#!/usr/bin/env python3
"""Exact decision engine for gold land contracts: BUY / HOLD / SELL / SKIP.

Standard library only. Three parts, each checkable by hand:

1. ``evaluate_fixture``: the single-date calculator from the combined strategy (PR #24, section 7).
   A dated cash-flow ledger, funding checked before receipts, a scenario loss limit, and the
   ``insufficient_inputs`` status when required economics are missing.
2. ``GammaArrival``: buyer arrival as a Poisson process whose rate is uncertain. The staking rate
   has a Gamma prior; buyers arrive at ``q`` times the staking rate. Quiet months (no buyer) and
   observed staking update the belief exactly (Gamma-Poisson conjugacy).
3. ``solve``: backward induction over a monthly tree for staged options and purchases. At each
   month the holder pays the next stage or lets the option lapse, and accepts or declines an
   arriving buyer's offer. Every value uses only what is known at that node.

Usage: python3 scripts/decision_engine.py CONTRACT.json   (prints a decision record)
"""
from __future__ import annotations

import argparse
from dataclasses import dataclass
import json
import math
from pathlib import Path
import statistics

TOLERANCE = 1e-9


# ---------------------------------------------------------------------------
# Part 1: single-date fixture calculator


def _peak_funding(ledger):
    """Largest cash outlay before receipts. Items marked ``from_proceeds`` are paid out of a receipt."""
    order = sorted(ledger, key=lambda item: (item["day"], item.get("from_proceeds", False), item["usd"] > 0))
    cash, peak = 0.0, 0.0
    for item in order:
        cash += item["usd"]
        peak = max(peak, -cash)
    return peak


def _npv(ledger, rate, basis):
    return sum(item["usd"] * (1 + rate) ** (-item["day"] / basis) for item in ledger)


def evaluate_fixture(fx):
    """Compare purchase, single-date purchase option and SKIP under declared scenarios."""
    scenarios = fx.get("scenarios") or []
    if not scenarios or any(s.get("gross_executable_bid_usd") is None for s in scenarios):
        return {"status": "insufficient_inputs", "action": None, "instrument": None,
                "missing_inputs": ["gross_executable_bid_usd"]}
    if abs(sum(s["probability"] for s in scenarios) - 1) > TOLERANCE:
        return {"status": "insufficient_inputs", "action": None, "instrument": None,
                "missing_inputs": ["scenario probabilities summing to 1"]}
    rate, basis = fx["annual_discount_rate"], fx["day_count_basis"]
    budget = fx["cash_budget_usd"] + fx.get("allowed_borrowing_usd", 0)
    loss_limit = fx["policy"]["maximum_loss_within_declared_scenarios_usd"]

    p = fx["purchase"]
    o = fx["purchase_option"]
    results = {}

    ledgers = {}
    for s in scenarios:
        ledgers[s["id"]] = [
            {"day": p["entry_day"], "usd": -p["price_usd"], "item": "purchase price"},
            {"day": p["entry_day"], "usd": -p["entry_fee_usd"], "item": "entry fee"},
            {"day": p["carry_payment_day"], "usd": -p["carry_usd"], "item": "carry"},
            {"day": p["exit_day"], "usd": s["gross_executable_bid_usd"], "item": "sale proceeds"},
            {"day": p["exit_day"], "usd": -p["exit_fee_usd"], "item": "exit fee", "from_proceeds": True},
        ]
    results["purchase"] = _summarise(ledgers, scenarios, rate, basis, budget, loss_limit, {})

    ledgers, decisions = {}, {}
    exercise_day = o["allowed_exercise_days"][-1]
    settles_in_time = exercise_day + o["settlement_delay_days"] <= o["closing_deadline_day"]
    for s in scenarios:
        gain = s["gross_executable_bid_usd"] - o["strike_usd"] - o["exercise_fee_usd"] - o["exit_fee_usd"]
        ledger = [{"day": o["premium_payment_day"], "usd": -o["premium_usd"], "item": "option premium"}]
        if settles_in_time and gain > 0:  # the bid is known before the only exercise date
            decisions[s["id"]] = "EXERCISE"
            ledger += [
                {"day": exercise_day, "usd": -o["strike_usd"], "item": "strike"},
                {"day": exercise_day, "usd": -o["exercise_fee_usd"], "item": "exercise fee"},
                {"day": o["exit_day"], "usd": s["gross_executable_bid_usd"], "item": "sale proceeds"},
                {"day": o["exit_day"], "usd": -o["exit_fee_usd"], "item": "exit fee", "from_proceeds": True},
            ]
        else:
            decisions[s["id"]] = "LAPSE"
        ledgers[s["id"]] = ledger
    results["purchase_option"] = _summarise(ledgers, scenarios, rate, basis, budget, loss_limit, decisions)

    feasible = {name: r for name, r in results.items() if not r["excluded_because"]}
    best = max(feasible, key=lambda name: feasible[name]["expected_npv_usd"], default=None)
    if best is None or feasible[best]["expected_npv_usd"] <= TOLERANCE:  # ties select SKIP
        action, instrument = "SKIP", None
    else:
        action, instrument = "BUY", best
    return {"status": "ok", "action": action, "instrument": instrument, "instruments": results}


def _summarise(ledgers, scenarios, rate, basis, budget, loss_limit, decisions):
    npvs = {sid: _npv(ledger, rate, basis) for sid, ledger in ledgers.items()}
    peak = max(_peak_funding(ledger) for ledger in ledgers.values())
    expected = sum(s["probability"] * npvs[s["id"]] for s in scenarios)
    worst = min(npvs.values())
    excluded = []
    if peak > budget + TOLERANCE:
        excluded.append(f"needs {peak:,.0f} before receipts; budget {budget:,.0f}")
    if -worst > loss_limit + TOLERANCE:
        excluded.append(f"worst scenario loses {-worst:,.0f}; limit {loss_limit:,.0f}")
    return {"scenario_npv_usd": npvs, "expected_npv_usd": expected, "worst_loss_usd": max(0.0, -worst),
            "peak_funding_usd": peak, "decisions": decisions, "ledgers": ledgers, "excluded_because": excluded}


# ---------------------------------------------------------------------------
# Part 2: buyer arrival (Gamma-Poisson)


@dataclass(frozen=True)
class GammaArrival:
    """Staking rate s ~ Gamma(alpha, beta) per month; buyers arrive at rate q * s.

    Then the buyer rate is Gamma(alpha, beta / q). A month with no buyer adds one month of
    exposure, so belief in a buyer arriving soon fades as quiet months pass.
    """
    alpha: float
    beta: float  # rate parameter, in months
    q: float = 1.0  # buyers per staking event (labelled assumption)

    def with_staking(self, events, months):
        """Exact posterior after observing ``events`` staking events in ``months`` months."""
        return GammaArrival(self.alpha + events, self.beta + months, self.q)

    def p_buyer_within(self, months, quiet_months=0):
        """P(at least one buyer in the next ``months``) after ``quiet_months`` with no buyer."""
        b = self.beta / self.q + quiet_months
        return 1 - (b / (b + months)) ** self.alpha

    def p_buyer_in_month(self, month):
        """Chance a buyer arrives during ``month`` (0-based), given none arrived before it."""
        return self.p_buyer_within(1, quiet_months=month)


@dataclass(frozen=True)
class FixedArrival:
    """Given per-month arrival probabilities; used for fixtures and the bridging test."""
    probabilities: tuple

    def p_buyer_in_month(self, month):
        return self.probabilities[month] if month < len(self.probabilities) else 0.0


def gamma_prior_from_counts(yearly_counts, expected_per_year):
    """Empirical-Bayes prior: spread from cells in the same forecast band, mean from the forecast.

    Method of moments: for counts with mean m and variance v > m, a Gamma-Poisson mixture has
    shape alpha = m^2 / (v - m). The rate is then set so the prior mean equals the forecast's
    expected count. Returned in monthly units. Without overdispersion the shape is capped at 100.
    """
    m = statistics.fmean(yearly_counts)
    v = statistics.variance(yearly_counts)
    alpha = m * m / (v - m) if v > m and m > 0 else 100.0
    beta_year = alpha / expected_per_year
    return GammaArrival(alpha=alpha, beta=beta_year * 12)


# ---------------------------------------------------------------------------
# Part 3: monthly backward induction for staged contracts


class Solver:
    """Optimal values for a staged option or a purchase, by backward induction over months.

    ``position`` is ``("stage", i)`` once stages 0..i-1 are paid, ``("owned",)`` after the last
    stage or a purchase. Within each month: a stage due that month is paid or the option lapses;
    carry is charged while held; a buyer may arrive and make one offer from ``bids``, accepted or
    declined. Values depend only on (month, position) because the arrival belief after m quiet
    months is fixed, so every node sees only what is known there.
    """

    def __init__(self, contract, arrival):
        self.c, self.arrival = contract, arrival
        self.stages = contract.get("stages", [])
        self.bids = [(b["usd"], b["probability"]) for b in contract["bids"]]
        self.monthly = (1 + contract.get("annual_discount_rate", 0.0)) ** (1 / 12)
        self._value, self._hold, self._worst = {}, {}, {}

    def disc(self, month):
        return self.monthly ** (-month)

    def owed(self, pos):
        """Payments still due if the option is completed now (accelerated on a sale)."""
        if pos[0] != "stage":
            return 0.0
        return sum(s["payment_usd"] + s.get("work_usd", 0.0) for s in self.stages[pos[1]:])

    def carry(self, pos):
        if pos == ("owned",):
            return self.c.get("carry_after_exercise_usd_per_month", self.c["carry_usd_per_month"])
        return self.c["carry_usd_per_month"] if self.c.get("carry_during_option", False) else 0.0

    def can_sell(self, pos):
        return pos == ("owned",) or self.c.get("acceleration_allowed", True)

    def stage_due(self, month, pos):
        """The stage payable this month and the position after paying it, or None."""
        if pos[0] == "stage" and pos[1] < len(self.stages) and self.stages[pos[1]]["month"] == month:
            stage = self.stages[pos[1]]
            after = ("owned",) if pos[1] + 1 == len(self.stages) else ("stage", pos[1] + 1)
            return stage["payment_usd"] + stage.get("work_usd", 0.0), after
        return None

    def value(self, month, pos):
        key = (month, pos)
        if key not in self._value:
            if month >= self.c["horizon_months"]:
                result = self.disc(month) * self.c.get("salvage_usd", 0.0) if pos == ("owned",) else 0.0
            elif (due := self.stage_due(month, pos)) is not None:
                cost, after = due
                result = max(0.0, -self.disc(month) * cost + self.hold(month, after))  # lapse is worth 0
            else:
                result = self.hold(month, pos)
            self._value[key] = result
        return self._value[key]

    def accept(self, month, pos, bid):
        return self.disc(month) * (bid - self.c["exit_fee_usd"] - self.owed(pos))

    def hold(self, month, pos):
        key = (month, pos)
        if key not in self._hold:
            cont = self.value(month + 1, pos)
            p = self.arrival.p_buyer_in_month(month) if self.can_sell(pos) else 0.0
            offer = sum(prob * max(self.accept(month, pos, bid), cont) for bid, prob in self.bids)
            self._hold[key] = -self.disc(month) * self.carry(pos) + p * offer + (1 - p) * cont
        return self._hold[key]

    def pays(self, month, pos):
        due = self.stage_due(month, pos)
        return due is not None and -self.disc(month) * due[0] + self.hold(month, due[1]) > 0.0

    def worst(self, month, pos):
        """Worst reachable outcome under the optimal policy (scenarios with positive probability)."""
        key = (month, pos)
        if key not in self._worst:
            if month >= self.c["horizon_months"]:
                result = self.value(month, pos)
            elif (due := self.stage_due(month, pos)) is not None:
                result = -self.disc(month) * due[0] + self.worst_hold(month, due[1]) if self.pays(month, pos) else 0.0
            else:
                result = self.worst_hold(month, pos)
            self._worst[key] = result
        return self._worst[key]

    def worst_hold(self, month, pos):
        cont_worst = self.worst(month + 1, pos)
        cont = self.value(month + 1, pos)
        p = self.arrival.p_buyer_in_month(month) if self.can_sell(pos) else 0.0
        outcomes = [cont_worst] if p < 1.0 else []
        if p > 0.0:
            for bid, prob in self.bids:
                if prob > 0.0:
                    outcomes.append(self.accept(month, pos, bid) if self.accept(month, pos, bid) >= cont else cont_worst)
        return -self.disc(month) * self.carry(pos) + min(outcomes)

    def entry(self):
        """Entry payment and the position it creates."""
        if self.c["instrument"] == "purchase":
            return self.c["price_usd"] + self.c.get("entry_fee_usd", 0.0), ("owned",)
        first = self.stages[0]
        after = ("owned",) if len(self.stages) == 1 else ("stage", 1)
        return first["payment_usd"] + first.get("work_usd", 0.0), after

    def entry_value(self):
        cost, pos = self.entry()
        return -cost + self.hold(0, pos)

    def entry_worst(self):
        cost, pos = self.entry()
        return -cost + self.worst_hold(0, pos)

    def peak_funding(self):
        """Largest outlay before any receipt, along the quiet path and at each accepted offer."""
        cost, pos = self.entry()
        outlay, peak = cost, cost
        for month in range(self.c["horizon_months"]):
            due = self.stage_due(month, pos)
            if due is not None:
                if not self.pays(month, pos):
                    break
                outlay += due[0]
                pos = due[1]
            outlay += self.carry(pos)
            peak = max(peak, outlay)
            if self.can_sell(pos) and any(self.accept(month, pos, bid) >= self.value(month + 1, pos)
                                          for bid, _ in self.bids):
                peak = max(peak, outlay + self.owed(pos))  # remaining stages paid before proceeds
        return peak

    def policy(self):
        """The plan along the no-buyer path: position each month, stage decisions, and the minimum offer
        worth accepting (SELL: complete any remaining stages and sell) before deciding to wait."""
        _, pos = self.entry()
        months = []
        for month in range(self.c["horizon_months"]):
            due = self.stage_due(month, pos)
            if due is not None:
                if not self.pays(month, pos):
                    months.append({"month": month, "action": "LAPSE", "stage_payment_usd": due[0]})
                    break
                months.append({"month": month, "action": "PAY_STAGE", "stage_payment_usd": due[0]})
                pos = due[1]
            cont = self.value(month + 1, pos)
            minimum = cont / self.disc(month) + self.c["exit_fee_usd"] + self.owed(pos)
            months.append({"month": month, "action": "HOLD", "position": "owned" if pos == ("owned",) else
                           f"option, {pos[1]} stages paid", "sell_if_offer_at_least_usd": round(minimum, 2)})
        return months


def solve(contract, arrival):
    return Solver(contract, arrival).entry_value()


def decide_entry(contract, arrival, budget_usd, loss_limit_usd):
    """BUY or SKIP for one contract, with its funding and loss constraints. Ties select SKIP."""
    solver = Solver(contract, arrival)
    value, worst, peak = solver.entry_value(), solver.entry_worst(), solver.peak_funding()
    excluded = []
    if peak > budget_usd + TOLERANCE:
        excluded.append(f"needs up to {peak:,.0f} before receipts; budget {budget_usd:,.0f}")
    if -worst > loss_limit_usd + TOLERANCE:
        excluded.append(f"worst reachable outcome loses {-worst:,.0f}; limit {loss_limit_usd:,.0f}")
    action = "BUY" if not excluded and value > TOLERANCE else "SKIP"
    return {"action": action, "value_usd": value, "worst_outcome_usd": worst, "peak_funding_usd": peak,
            "excluded_because": excluded, "policy": solver.policy()}


def break_even(objective, low, high, steps=60):
    """Value of a parameter where ``objective`` crosses zero, by bisection; None if no crossing."""
    f_low, f_high = objective(low), objective(high)
    if f_low * f_high > 0:
        return None
    for _ in range(steps):
        mid = (low + high) / 2
        if (objective(mid) > 0) == (f_low > 0):
            low = mid
        else:
            high = mid
    return (low + high) / 2


def analyse(contract, arrival, budget_usd, loss_limit_usd):
    """Entry decision plus break-evens: conversion rate q*, maximum first payment, minimum high bid."""
    decision = decide_entry(contract, arrival, budget_usd, loss_limit_usd)

    def with_q(q):
        return solve(contract, GammaArrival(arrival.alpha, arrival.beta, q))

    def with_first_payment(amount):
        changed = json.loads(json.dumps(contract))
        key = "price_usd" if contract["instrument"] == "purchase" else None
        if key:
            changed[key] = amount
        else:
            changed["stages"][0]["payment_usd"] = amount
        return solve(changed, arrival)

    def with_high_bid(amount):
        changed = json.loads(json.dumps(contract))
        top = max(range(len(changed["bids"])), key=lambda i: changed["bids"][i]["usd"])
        changed["bids"][top]["usd"] = amount
        return solve(changed, arrival)

    q_star = break_even(with_q, 1e-6, 1.0) if isinstance(arrival, GammaArrival) else None
    first = contract["price_usd"] if contract["instrument"] == "purchase" else contract["stages"][0]["payment_usd"]
    top_bid = max(b["usd"] for b in contract["bids"])
    out = {
        **decision,
        "break_even": {
            "buyers_per_staking_event_q": q_star,
            "max_first_payment_usd": break_even(with_first_payment, 0.0, 10 * max(first, 1.0)),
            "min_high_bid_usd": break_even(with_high_bid, 0.0, 10 * top_bid),
        },
    }
    fragile = []
    if q_star and isinstance(arrival, GammaArrival) and 0.8 < arrival.q / q_star < 1.25:
        fragile.append("q within 25% of its break-even")
    mx = out["break_even"]["max_first_payment_usd"]
    if mx is not None and 0.8 < first / max(mx, 1e-9) < 1.25:
        fragile.append("first payment within 25% of its break-even")
    out["fragile"] = fragile
    return out


def main():
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument("contract", type=Path, help="JSON with contract, arrival and policy sections")
    args = parser.parse_args()
    spec = json.loads(args.contract.read_text())
    if "purchase_option" in spec:
        print(json.dumps(evaluate_fixture(spec), indent=2, default=str))
        return
    if "arrival" in spec:
        arrival = GammaArrival(**spec["arrival"])
    else:  # empirical-Bayes prior from a staking history, mean equal to the historical mean
        counts = spec["staking_events_per_year"]
        prior = gamma_prior_from_counts(counts, statistics.fmean(counts))
        arrival = GammaArrival(prior.alpha, prior.beta, spec["q_buyers_per_staking_event"])
    result = analyse(spec["contract"], arrival, spec["policy"]["budget_usd"], spec["policy"]["loss_limit_usd"])
    result["arrival"] = {"alpha": arrival.alpha, "beta_months": arrival.beta, "q": arrival.q,
                         "p_buyer_within_12_months": arrival.p_buyer_within(12)}
    print(json.dumps(result, indent=2))


if __name__ == "__main__":
    main()
