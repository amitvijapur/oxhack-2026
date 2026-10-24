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
import csv
from dataclasses import dataclass
import json
import math
from pathlib import Path
import random
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

    Then the buyer rate is Gamma(alpha, beta / q). After ``months`` months in which ``arrivals``
    buyers were seen, the exact posterior is Gamma(alpha + arrivals, beta / q + months): quiet
    months lower the belief, observed buyers raise it.
    """
    alpha: float
    beta: float  # rate parameter, in months
    q: float = 1.0  # buyers per staking event (labelled assumption)

    def with_staking(self, events, months):
        """Exact posterior after observing ``events`` staking events in ``months`` months."""
        return GammaArrival(self.alpha + events, self.beta + months, self.q)

    def with_q(self, q):
        return GammaArrival(self.alpha, self.beta, q)

    def p_buyer_within(self, months, quiet_months=0):
        """P(at least one buyer in the next ``months``) after ``quiet_months`` with no buyer."""
        b = self.beta / self.q + quiet_months
        return 1 - (b / (b + months)) ** self.alpha

    def p_buyer_in_month(self, month, arrivals=0):
        """Chance a buyer arrives during ``month`` (0-based), given ``arrivals`` buyers seen before it."""
        b = self.beta / self.q + month
        return 1 - (b / (b + 1)) ** (self.alpha + arrivals)


@dataclass(frozen=True)
class MixtureArrival:
    """A weighted average of Gamma beliefs, for example one per forgetting rate (Bayesian model averaging).

    The weights are updated exactly by how well each component explains what has been seen so far
    (the negative-binomial likelihood of ``arrivals`` buyers in ``months`` months).
    """
    components: tuple  # ((weight, GammaArrival), ...)

    def with_q(self, q):
        return MixtureArrival(tuple((w, g.with_q(q)) for w, g in self.components))

    def weights(self, months=0, arrivals=0):
        logs = []
        for w, g in self.components:
            b = g.beta / g.q
            logs.append(math.log(w) + math.lgamma(g.alpha + arrivals) - math.lgamma(g.alpha)
                        + g.alpha * math.log(b / (b + months)) - arrivals * math.log(b + months))
        top = max(logs)
        raw = [math.exp(x - top) for x in logs]
        return [r / sum(raw) for r in raw]

    def p_buyer_within(self, months, quiet_months=0):
        return sum(w * g.p_buyer_within(months, quiet_months)
                   for w, (_, g) in zip(self.weights(quiet_months, 0), self.components))

    def p_buyer_in_month(self, month, arrivals=0):
        return sum(w * g.p_buyer_in_month(month, arrivals)
                   for w, (_, g) in zip(self.weights(month, arrivals), self.components))


@dataclass(frozen=True)
class FixedArrival:
    """Given per-month arrival probabilities; used for fixtures and the bridging test."""
    probabilities: tuple

    def p_buyer_in_month(self, month, arrivals=0):
        return self.probabilities[month] if month < len(self.probabilities) else 0.0


def gamma_prior_from_counts(yearly_counts, expected_per_year):
    """Gamma prior whose spread comes from the counts (method of moments) and whose mean is given.

    For counts with mean m and variance v > m, a Gamma-Poisson mixture has shape
    alpha = m^2 / (v - m). The rate is set so the prior mean equals ``expected_per_year``, which
    the caller supplies (a forecast, or the historical mean). Monthly units. Without
    overdispersion the shape is capped at 100.
    """
    m = statistics.fmean(yearly_counts)
    v = statistics.variance(yearly_counts)
    alpha = m * m / (v - m) if v > m and m > 0 else 100.0
    beta_year = alpha / expected_per_year
    return GammaArrival(alpha=alpha, beta=beta_year * 12)


def arrival_from_forecast(p_any, band_moments, q):
    """Gamma belief from a measured forecast: P(any staking in a year) for one section.

    The mean yearly rate is the Poisson rate with that chance of at least one event,
    -ln(1 - p). The spread comes from the event counts of all sections in the same forecast band
    (method of moments; empirical Bayes). Monthly units.
    """
    rate = -math.log(1 - p_any)
    m, v = band_moments["mean_events"], band_moments["var_events"]
    alpha = m * m / (v - m) if v > m else 100.0
    return GammaArrival(alpha=alpha, beta=alpha / rate * 12, q=q)


def band_for(p_any, moments):
    """The forecast band (for example "0.1-0.2") that contains ``p_any``."""
    for band, row in moments.items():
        low, high = (float(x) for x in band.split("-"))
        if low <= p_any < high:
            return band, row
    return max(moments.items(), key=lambda kv: float(kv[0].split("-")[0]))


# ---------------------------------------------------------------------------
# Part 2b: from a staking history to a belief that forgets the distant past


def discounted_posterior(counts, exposures, forget, alpha0, beta0):
    """Gamma posterior (yearly units) when each year's old evidence is down-weighted by ``forget``.

    Before adding a year, alpha and beta are multiplied by ``forget`` in (0, 1]; forget = 1 is
    ordinary pooling. Exposure is the fraction of the year observed (a partial year counts less).
    """
    alpha, beta = alpha0, beta0
    for n, e in zip(counts, exposures):
        alpha, beta = forget * alpha + n, forget * beta + e
    return alpha, beta


def nb_logpmf(n, alpha, beta, exposure):
    """Log probability of n events in ``exposure`` years when the yearly rate is Gamma(alpha, beta)."""
    return (math.lgamma(alpha + n) - math.lgamma(alpha) - math.lgamma(n + 1)
            + alpha * math.log(beta / (beta + exposure)) + n * math.log(exposure / (beta + exposure)))


def forgetting_profile(counts, exposures, grid, alpha0, beta0, burn_in):
    """One-step-ahead predictive log score for each forgetting rate, using only earlier years."""
    rows = []
    for forget in grid:
        score = 0.0
        for t in range(burn_in, len(counts)):
            a, b = discounted_posterior(counts[:t], exposures[:t], forget, alpha0, beta0)
            score += nb_logpmf(counts[t], a, b, exposures[t])
        a, b = discounted_posterior(counts, exposures, forget, alpha0, beta0)
        half_life = math.inf if forget >= 1 else math.log(0.5) / math.log(forget)
        rows.append({"forget": forget, "half_life_years": half_life, "log_score": score,
                     "posterior_alpha": a, "posterior_beta_years": b, "rate_per_year": a / b})
    top = max(r["log_score"] for r in rows)
    total = sum(math.exp(r["log_score"] - top) for r in rows)
    for r in rows:
        r["weight"] = math.exp(r["log_score"] - top) / total
    return rows


def arrival_from_history(history, prior, q):
    """Bayesian average over forgetting rates, each weighted by its out-of-sample predictive score."""
    rows = forgetting_profile(history["events"], history["exposure_years"], prior["forget_grid"],
                              prior["alpha0"], prior["beta0_years"], prior["burn_in_years"])
    components = tuple((r["weight"], GammaArrival(r["posterior_alpha"], r["posterior_beta_years"] * 12, q))
                       for r in rows if r["weight"] > 1e-12)
    return MixtureArrival(components), rows


def segment_log_marginal(counts, exposures, a, b):
    """Log marginal likelihood of Poisson counts sharing one Gamma(a, b) rate (b in years)."""
    s, e = sum(counts), sum(exposures)
    return (a * math.log(b) - math.lgamma(a) + math.lgamma(a + s) - (a + s) * math.log(b + e)
            + sum(y * math.log(x) for y, x in zip(counts, exposures) if y) - sum(math.lgamma(y + 1) for y in counts))


def changepoint_posterior(years, counts, exposures, a, b, p_change=0.5):
    """Exact posterior over at most one change in the staking rate.

    Every change year is enumerated (uniform prior), against the no-change model. Each segment's
    rate has a Gamma(a, b) prior, so the marginals are closed-form (Raftery and Akman 1986). The
    forgetting model in ``discounted_posterior`` is the West and Harrison discount alternative."""
    no_change = segment_log_marginal(counts, exposures, a, b)
    splits = []
    for k in range(1, len(counts)):
        log_l = (segment_log_marginal(counts[:k], exposures[:k], a, b)
                 + segment_log_marginal(counts[k:], exposures[k:], a, b))
        splits.append((years[k], log_l, k))
    logs = [math.log(1 - p_change) + no_change] + [math.log(p_change / len(splits)) + l for _, l, _ in splits]
    top = max(logs)
    norm = sum(math.exp(x - top) for x in logs)
    post = [math.exp(x - top) / norm for x in logs]
    best_year, _, k = max(splits, key=lambda s: s[1])
    rate = lambda c, e: (a + sum(c)) / (b + sum(e))
    return {"prior": {"a": a, "b_years": b, "p_change": p_change}, "p_no_change": post[0],
            "p_change_by_year": {str(y): post[i + 1] for i, (y, _, _) in enumerate(splits)},
            "most_likely_change_year": best_year,
            "rate_before_per_year": rate(counts[:k], exposures[:k]), "rate_after_per_year": rate(counts[k:], exposures[k:]),
            "log_bayes_factor_change_vs_none": math.log(sum(math.exp(l - top) for _, l, _ in splits) / len(splits))
            + top - no_change}


def longest_zero_run(counts):
    best = run = 0
    for n in counts:
        run = run + 1 if n == 0 else 0
        best = max(best, run)
    return best


def zero_run_check(counts, alpha, beta, sims=20000, seed=1):
    """Posterior predictive check: how often a model with one constant rate produces a zero run this long."""
    rng = random.Random(seed)
    observed = longest_zero_run(counts)
    hits = 0
    for _ in range(sims):
        rate = rng.gammavariate(alpha, 1 / beta)
        series = []
        for _ in counts:  # Poisson by inversion; rates here are small
            n, p, u = 0, math.exp(-rate), rng.random()
            cumulative = p
            while u > cumulative:
                n += 1
                p *= rate / n
                cumulative += p
            series.append(n)
        hits += longest_zero_run(series) >= observed
    return {"observed_longest_zero_run": observed, "p_value": hits / sims, "simulations": sims}


# ---------------------------------------------------------------------------
# Part 3: monthly backward induction for staged contracts


class Solver:
    """Optimal values for a staged option or a purchase, by backward induction over months.

    State: (month, position, buyers seen so far). ``position`` is ``("stage", i)`` once stages
    0..i-1 are paid, or ``("owned",)`` after the last stage or a purchase. Within each month: a
    stage due that month is paid or the option lapses; carry is charged while held; a buyer may
    arrive and make one offer from ``bids``, which is accepted or declined. A declined offer is
    information: it raises the belief in later buyers. Each node sees only what is known there.
    """

    def __init__(self, contract, arrival, commitment_cap=None):
        self.c, self.arrival = contract, arrival
        self.cap = commitment_cap  # most cash the policy may put at risk; stages beyond it are refused
        self.stages = contract.get("stages", [])
        self.bids = [(b["usd"], b["probability"]) for b in contract["bids"]]
        self.monthly = (1 + contract.get("annual_discount_rate", 0.0)) ** (1 / 12)
        self._value, self._hold, self._worst = {}, {}, {}

    def outlay_before(self, month, pos):
        """Undiscounted cash spent by the start of ``month`` on the path that reaches ``pos``."""
        paid = len(self.stages) if pos == ("owned",) else pos[1]
        total = sum(s["payment_usd"] + s.get("work_usd", 0.0) for s in self.stages[:paid])
        for t in range(month):
            done = min(paid, sum(1 for s in self.stages if s["month"] <= t))
            total += self.carry(("owned",) if done == len(self.stages) else ("stage", done))
        return total

    def affordable(self, month, pos):
        """Whether paying the stage due now keeps total cash at risk within the cap, including carry
        until the next stage falls due (or the horizon)."""
        if self.cap is None:
            return True
        cost, after = self.stage_due(month, pos)
        later = [s["month"] for s in self.stages if s["month"] > month] + [self.c["horizon_months"]]
        exposure = self.outlay_before(month, pos) + cost + self.carry(after) * (min(later) - month)
        return exposure <= self.cap + TOLERANCE

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

    def p_arrival(self, month, pos, seen):
        return self.arrival.p_buyer_in_month(month, seen) if self.can_sell(pos) else 0.0

    def stage_due(self, month, pos):
        """The stage payable this month and the position after paying it, or None."""
        if pos[0] == "stage" and pos[1] < len(self.stages) and self.stages[pos[1]]["month"] == month:
            stage = self.stages[pos[1]]
            after = ("owned",) if pos[1] + 1 == len(self.stages) else ("stage", pos[1] + 1)
            return stage["payment_usd"] + stage.get("work_usd", 0.0), after
        return None

    def value(self, month, pos, seen=0):
        key = (month, pos, seen)
        if key not in self._value:
            if month >= self.c["horizon_months"]:
                result = self.disc(month) * self.c.get("salvage_usd", 0.0) if pos == ("owned",) else 0.0
            elif (due := self.stage_due(month, pos)) is not None:
                cost, after = due
                pay = -self.disc(month) * cost + self.hold(month, after, seen) if self.affordable(month, pos) else 0.0
                result = max(0.0, pay)  # lapse is worth 0
            else:
                result = self.hold(month, pos, seen)
            self._value[key] = result
        return self._value[key]

    def accept(self, month, pos, bid):
        return self.disc(month) * (bid - self.c["exit_fee_usd"] - self.owed(pos))

    def hold(self, month, pos, seen=0):
        key = (month, pos, seen)
        if key not in self._hold:
            quiet = self.value(month + 1, pos, seen)
            declined = self.value(month + 1, pos, seen + 1)
            p = self.p_arrival(month, pos, seen)
            offer = sum(prob * max(self.accept(month, pos, bid), declined) for bid, prob in self.bids) if p else 0.0
            self._hold[key] = -self.disc(month) * self.carry(pos) + p * offer + (1 - p) * quiet
        return self._hold[key]

    def pays(self, month, pos, seen=0):
        due = self.stage_due(month, pos)
        return (due is not None and self.affordable(month, pos)
                and -self.disc(month) * due[0] + self.hold(month, due[1], seen) > 0.0)

    def worst(self, month, pos, seen=0):
        """Worst reachable outcome under the optimal policy (scenarios with positive probability)."""
        key = (month, pos, seen)
        if key not in self._worst:
            if month >= self.c["horizon_months"]:
                result = self.value(month, pos, seen)
            elif (due := self.stage_due(month, pos)) is not None:
                result = (-self.disc(month) * due[0] + self.worst_hold(month, due[1], seen)
                          if self.pays(month, pos, seen) else 0.0)
            else:
                result = self.worst_hold(month, pos, seen)
            self._worst[key] = result
        return self._worst[key]

    def worst_hold(self, month, pos, seen=0):
        p = self.p_arrival(month, pos, seen)
        outcomes = [self.worst(month + 1, pos, seen)] if p < 1.0 else []
        if p > 0.0:
            declined = self.value(month + 1, pos, seen + 1)
            for bid, prob in self.bids:
                if prob > 0.0:
                    accepted = self.accept(month, pos, bid)
                    outcomes.append(accepted if accepted >= declined else self.worst(month + 1, pos, seen + 1))
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
        return -cost + self.hold(0, pos, 0)

    def entry_worst(self):
        cost, pos = self.entry()
        return -cost + self.worst_hold(0, pos, 0)

    def outcomes(self):
        """Exact distribution of discounted net cash under the optimal policy: {cash: probability}."""
        cost, pos = self.entry()
        horizon = self.c["horizon_months"]
        frontier, done = {(pos, 0, round(-cost, 6)): 1.0}, {}

        def add(table, key, prob):
            table[key] = table.get(key, 0.0) + prob

        for month in range(horizon):
            nxt = {}
            for (pos, seen, cash), prob in frontier.items():
                due = self.stage_due(month, pos)
                if due is not None:
                    if not self.pays(month, pos, seen):
                        add(done, cash, prob)  # lapse
                        continue
                    cash, pos = cash - self.disc(month) * due[0], due[1]
                cash = round(cash - self.disc(month) * self.carry(pos), 6)
                p = self.p_arrival(month, pos, seen)
                if p < 1.0:
                    add(nxt, (pos, seen, cash), prob * (1 - p))
                declined = self.value(month + 1, pos, seen + 1)
                for bid, bp in self.bids:
                    if p * bp == 0.0:
                        continue
                    accepted = self.accept(month, pos, bid)
                    if accepted >= declined:
                        add(done, round(cash + accepted, 6), prob * p * bp)
                    else:
                        add(nxt, (pos, seen + 1, cash), prob * p * bp)
            frontier = nxt
        for (pos, _, cash), prob in frontier.items():
            salvage = self.disc(horizon) * self.c.get("salvage_usd", 0.0) if pos == ("owned",) else 0.0
            add(done, round(cash + salvage, 6), prob)
        return done

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
            if self.can_sell(pos) and any(self.accept(month, pos, bid) >= self.value(month + 1, pos, 1)
                                          for bid, _ in self.bids):
                peak = max(peak, outlay + self.owed(pos))  # remaining stages paid before proceeds
        return peak

    def policy(self):
        """The plan along the no-buyer path: position each month, stage decisions, and the minimum offer
        worth accepting (SELL: complete any remaining stages and sell) rather than declining and waiting."""
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
            declined = self.value(month + 1, pos, 1)
            minimum = declined / self.disc(month) + self.c["exit_fee_usd"] + self.owed(pos)
            months.append({"month": month, "action": "HOLD", "position": "owned" if pos == ("owned",) else
                           f"option, {pos[1]} stages paid", "sell_if_offer_at_least_usd": round(minimum, 2)})
        return months


def summarise_outcomes(dist):
    """Probabilities of loss and gain, mean and percentiles of a {cash: probability} distribution."""
    items = sorted(dist.items())

    def quantile(level):
        running = 0.0
        for cash, prob in items:
            running += prob
            if running >= level - 1e-12:
                return cash
        return items[-1][0]

    mean = sum(c * p for c, p in items)
    return {"p_loss": sum(p for c, p in items if c < -TOLERANCE), "p_gain": sum(p for c, p in items if c > TOLERANCE),
            "mean_usd": mean, "p05_usd": quantile(0.05), "median_usd": quantile(0.5), "p95_usd": quantile(0.95),
            "distinct_outcomes": len(items)}


def solve(contract, arrival, commitment_cap=None):
    return Solver(contract, arrival, commitment_cap).entry_value()


def decide_entry(contract, arrival, budget_usd, loss_limit_usd):
    """BUY or SKIP for one contract, with its funding and loss constraints. Ties select SKIP."""
    solver = Solver(contract, arrival, commitment_cap=loss_limit_usd)
    value, worst, peak = solver.entry_value(), solver.entry_worst(), solver.peak_funding()
    excluded = []
    if peak > budget_usd + TOLERANCE:
        excluded.append(f"needs up to {peak:,.0f} before receipts; budget {budget_usd:,.0f}")
    if -worst > loss_limit_usd + TOLERANCE:
        excluded.append(f"worst reachable outcome loses {-worst:,.0f}; limit {loss_limit_usd:,.0f}")
    action = "BUY" if not excluded and value > TOLERANCE else "SKIP"
    outcome = summarise_outcomes(solver.outcomes())
    outcome["ev_per_dollar_at_risk"] = value / -worst if worst < -TOLERANCE else None
    return {"action": action, "value_usd": value, "worst_outcome_usd": worst, "peak_funding_usd": peak,
            "excluded_because": excluded, "outcomes": outcome, "policy": solver.policy()}


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


def staking_predictive(arrival, months, max_events=200, tail=1e-9):
    """Exact predictive of staking counts over ``months``, and the updated belief after each count.

    Returns [(probability, belief after n events), ...]. For a mixture, each component's weight is
    updated by how likely it made the observed count (negative binomial)."""
    components = arrival.components if isinstance(arrival, MixtureArrival) else ((1.0, arrival),)
    out, total = [], 0.0
    for n in range(max_events + 1):
        joint = []
        for w, g in components:
            b = g.beta
            log_nb = (math.lgamma(g.alpha + n) - math.lgamma(g.alpha) - math.lgamma(n + 1)
                      + g.alpha * math.log(b / (b + months)) + n * math.log(months / (b + months)))
            joint.append((w * math.exp(log_nb), g.with_staking(n, months)))
        prob = sum(j for j, _ in joint)
        if prob > 0:
            belief = joint[0][1] if len(joint) == 1 else MixtureArrival(tuple((j / prob, g) for j, g in joint if j > 0))
            out.append((prob, belief))
            total += prob
        if 1 - total < tail:
            break
    return out


def entry_value_if_feasible(contract, arrival, budget_usd, loss_limit_usd):
    """Value of entering now, or 0 if a funding or loss constraint excludes entry."""
    solver = Solver(contract, arrival, commitment_cap=loss_limit_usd)
    value = solver.entry_value()
    if solver.peak_funding() > budget_usd + TOLERANCE or -solver.entry_worst() > loss_limit_usd + TOLERANCE:
        return 0.0
    return max(0.0, value)


def wait_value(contract, arrival, budget_usd, loss_limit_usd, p_deal_still_open, months=12):
    """Value of waiting ``months``, watching nearby staking, then deciding on the same terms.

    Exact: sum over staking counts n of P(n) times the value of entering with the updated belief,
    discounted, times the chance the deal is still open (a labelled assumption)."""
    rate = contract.get("annual_discount_rate", 0.0)
    disc = (1 + rate) ** (-months / 12)
    later = sum(prob * entry_value_if_feasible(contract, belief, budget_usd, loss_limit_usd)
                for prob, belief in staking_predictive(arrival, months))
    return p_deal_still_open * disc * later, disc * later


def certainty_equivalent(dist, wealth, gamma):
    """CRRA certainty equivalent of a {cash: probability} distribution added to ``wealth``."""
    if gamma == 1:
        expected = sum(p * math.log(wealth + c) for c, p in dist.items())
        return math.exp(expected) - wealth
    expected = sum(p * (wealth + c) ** (1 - gamma) for c, p in dist.items())
    return expected ** (1 / (1 - gamma)) - wealth


FRAGILE_BAND = 0.25  # an input within 25% of the value that flips the action is flagged


def analyse(contract, arrival, budget_usd, loss_limit_usd):
    """Entry decision, outcome distribution, break-evens and assumption checks."""
    decision = decide_entry(contract, arrival, budget_usd, loss_limit_usd)

    def with_first_payment(amount):
        changed = json.loads(json.dumps(contract))
        if contract["instrument"] == "purchase":
            changed["price_usd"] = amount
        else:
            changed["stages"][0]["payment_usd"] = amount
        return solve(changed, arrival, loss_limit_usd)

    def with_high_bid(amount):
        changed = json.loads(json.dumps(contract))
        top = max(range(len(changed["bids"])), key=lambda i: changed["bids"][i]["usd"])
        changed["bids"][top]["usd"] = amount
        return solve(changed, arrival, loss_limit_usd)

    has_q = hasattr(arrival, "with_q")
    q_star = break_even(lambda q: solve(contract, arrival.with_q(q), loss_limit_usd), 1e-6, 1.0) if has_q else None
    first = contract["price_usd"] if contract["instrument"] == "purchase" else contract["stages"][0]["payment_usd"]
    top_bid = max(b["usd"] for b in contract["bids"])
    flipped = json.loads(json.dumps(contract))
    flipped["acceleration_allowed"] = not contract.get("acceleration_allowed", True)
    out = {
        **decision,
        "break_even": {
            "buyers_per_staking_event_q": q_star,
            "max_first_payment_usd": break_even(with_first_payment, 0.0, 10 * max(first, 1.0)),
            "min_high_bid_usd": break_even(with_high_bid, 0.0, 10 * top_bid),
        },
        "assumption_checks": {
            "acceleration_allowed": contract.get("acceleration_allowed", True),
            "value_if_acceleration_flipped_usd": solve(flipped, arrival, loss_limit_usd),
        },
    }
    fragile = []
    q = getattr(arrival, "q", None) or (arrival.components[0][1].q if hasattr(arrival, "components") else None)
    low, high = 1 - FRAGILE_BAND, 1 / (1 - FRAGILE_BAND)
    if q_star and q and low < q / q_star < high:
        fragile.append(f"q within {FRAGILE_BAND:.0%} of its break-even")
    mx = out["break_even"]["max_first_payment_usd"]
    if mx is not None and low < first / max(mx, 1e-9) < high:
        fragile.append(f"first payment within {FRAGILE_BAND:.0%} of its break-even")
    if (out["assumption_checks"]["value_if_acceleration_flipped_usd"] > TOLERANCE) != (decision["value_usd"] > TOLERANCE):
        fragile.append("the acceleration assumption alone flips the sign of the value")
    out["fragile"] = fragile
    return out


def decide_with_waiting(contract, arrival, budget_usd, loss_limit_usd, p_deal_still_open, wealth_usd=None):
    """BUY, WAIT or SKIP: compare entering now with waiting a year and deciding with more evidence."""
    out = analyse(contract, arrival, budget_usd, loss_limit_usd)
    buy = out["value_usd"] if out["action"] == "BUY" else 0.0
    wait, wait_if_open = wait_value(contract, arrival, budget_usd, loss_limit_usd, p_deal_still_open)
    if buy > TOLERANCE and buy >= wait:
        signal = "BUY"
    elif wait > TOLERANCE:
        signal = "WAIT"
    else:
        signal = "SKIP"
    out["signal"] = signal
    out["wait"] = {"months": 12, "p_deal_still_open": p_deal_still_open, "value_usd": wait,
                   "value_if_deal_still_open_usd": wait_if_open,
                   "p_open_where_wait_beats_buy": (buy / wait_if_open if wait_if_open > TOLERANCE else None)}
    dist = Solver(contract, arrival, commitment_cap=loss_limit_usd).outcomes()
    wealth = wealth_usd or budget_usd
    out["risk_aversion"] = {
        "wealth_usd": wealth,
        "certainty_equivalent_usd": {str(g): certainty_equivalent(dist, wealth, g) for g in (0.5, 1, 2, 4)},
        "gamma_where_buy_stops_paying": (break_even(lambda g: certainty_equivalent(dist, wealth, g), 1e-6, 50.0)
                                         if out["value_usd"] > TOLERANCE else None),
    }
    if out["fragile"]:
        out["conditional_on"] = out["fragile"]
    return out


def apply_gates(result, gates):
    """Gates are checked facts (pass / fail / unknown). A failed gate excludes entry; an unknown one
    keeps the scenario signal but marks the result for manual review."""
    failed = [name for name, g in gates.items() if g["status"] == "fail"]
    unknown = [name for name, g in gates.items() if g["status"] == "unknown"]
    result["gates"] = gates
    if failed:
        result["status"], result["signal"] = "excluded", "SKIP"
        result["excluded_because"] = result.get("excluded_because", []) + [f"gate failed: {n}" for n in failed]
    elif unknown:
        result["status"] = "manual_review"
        result["manual_review"] = unknown
    else:
        result["status"] = "ok"
    return result


def swarm_scenarios(spec, contract, arrival):
    """Decision with and without each swarm scenario whose pre-registered checks passed."""
    import importlib.util
    path = Path(__file__).with_name("swarm_adapter.py")
    module_spec = importlib.util.spec_from_file_location("swarm_adapter", path)
    adapter = importlib.util.module_from_spec(module_spec)
    module_spec.loader.exec_module(adapter)
    used, dropped, mappings = adapter.load(spec["swarm"]["results"], spec["swarm"].get("mappings", adapter.MAPPINGS))
    base = analyse(contract, arrival, spec["policy"]["budget_usd"], spec["policy"]["loss_limit_usd"])
    rows = []
    for scenario, transform, evidence in used:
        changed, belief = adapter.apply_transform(contract, arrival, transform)
        r = analyse(changed, belief, spec["policy"]["budget_usd"], spec["policy"]["loss_limit_usd"])
        rows.append({"scenario": scenario, "transform": transform, "assumption": evidence["assumption"],
                     "value_usd": r["value_usd"], "action": r["action"], "action_changes": r["action"] != base["action"]})
    return {"mappings_version": mappings["version"], "used": rows, "dropped": dropped,
            "without_swarm": {"value_usd": base["value_usd"], "action": base["action"]}}


def main():
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument("contract", type=Path, help="JSON with contract, arrival and policy sections")
    args = parser.parse_args()
    spec = json.loads(args.contract.read_text())
    if "purchase_option" in spec:
        print(json.dumps(evaluate_fixture(spec), indent=2, default=str))
        return
    report = {}
    if "arrival" in spec:
        arrival = GammaArrival(**spec["arrival"])
    elif "forecast_cells" in spec:  # the measured forecast sets the prior for each named section
        source = spec["forecast_source"]
        moments = json.loads(Path(source["report"]).read_text())["final_model"]["count_moments_by_forecast_band"]
        with open(source["cells_csv"], newline="") as handle:
            rows = {r["mtrs"]: r for r in csv.DictReader(handle)}
        results = []
        for mtrs in spec["forecast_cells"]:
            row = rows[mtrs]
            p_any = float(row["p_any_staking"])
            band, band_row = band_for(p_any, moments)
            arrival = arrival_from_forecast(p_any, band_row, spec["q_buyers_per_staking_event"])
            result = decide_with_waiting(spec["contract"], arrival, spec["policy"]["budget_usd"],
                                         spec["policy"]["loss_limit_usd"], spec["p_deal_still_open"])
            result["forecast"] = {"mtrs": mtrs, "p_any_staking": p_any, "cutoff": row["cutoff"], "band": band,
                                  "staking_rate_per_year": -math.log(1 - p_any), "alpha": arrival.alpha,
                                  "p_buyer_within_12_months": arrival.p_buyer_within(12)}
            results.append(result)
        print(json.dumps(results, indent=2))
        return
    else:
        history, prior, q = spec["staking_history"], spec["arrival_prior"], spec["q_buyers_per_staking_event"]
        arrival, profile = arrival_from_history(history, prior, q)
        sweep = []
        for row in profile:  # the decision if one forgetting rate were known to be right
            single = GammaArrival(row["posterior_alpha"], row["posterior_beta_years"] * 12, q)
            sweep.append({k: row[k] for k in ("forget", "half_life_years", "log_score", "weight", "rate_per_year")}
                         | {"value_usd": solve(spec["contract"], single, spec["policy"]["loss_limit_usd"])})
        pooled = [r for r in profile if r["forget"] == 1.0][0]
        full = [n for n, e in zip(history["events"], history["exposure_years"]) if e >= 1.0]
        report["forgetting_sweep"] = sweep
        report["changepoint"] = [changepoint_posterior(history["years"], history["events"], history["exposure_years"], a, b)
                                 for a, b in spec.get("changepoint_priors", [[0.5, 0.5], [1, 1], [2, 2]])]
        report["pooled_model_check"] = zero_run_check(full, pooled["posterior_alpha"], pooled["posterior_beta_years"])
        latest = max(i for i, n in enumerate(history["events"]) if n > 0)
        trimmed = dict(history, events=[n - (i == latest) for i, n in enumerate(history["events"])])
        without, _ = arrival_from_history(trimmed, prior, q)
        report["latest_event_check"] = {
            "year_of_latest_event": history["years"][latest],
            "value_without_it_usd": solve(spec["contract"], without, spec["policy"]["loss_limit_usd"])}
    result = decide_with_waiting(spec["contract"], arrival, spec["policy"]["budget_usd"],
                                 spec["policy"]["loss_limit_usd"], spec["p_deal_still_open"])
    result["arrival"] = {"p_buyer_within_12_months": arrival.p_buyer_within(12)}
    result.update(report)
    if "swarm" in spec:
        result["swarm"] = swarm_scenarios(spec, spec["contract"], arrival)
    apply_gates(result, spec.get("gates", {}))
    if "latest_event_check" in report and (report["latest_event_check"]["value_without_it_usd"] > TOLERANCE) != \
            (result["value_usd"] > TOLERANCE):
        result["fragile"].append("removing the single most recent staking event flips the sign of the value")
    print(json.dumps(result, indent=2, default=lambda v: None if v == math.inf else v))


if __name__ == "__main__":
    main()
