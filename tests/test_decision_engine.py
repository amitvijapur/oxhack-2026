"""Correctness tests for the land-contract decision engine.

The fixture in tests/fixtures/decision_fixture.json is copied unchanged from Amit's combined
strategy (PR #24, commit c73602c, research/strategy-amendments/decision-fixture.json).
"""
import copy
import importlib.util
import itertools
import json
from pathlib import Path
import random
import unittest

ROOT = Path(__file__).resolve().parents[1]
SPEC = importlib.util.spec_from_file_location("decision_engine", ROOT / "scripts/decision_engine.py")
engine = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(engine)
FIXTURE = json.loads((ROOT / "tests/fixtures/decision_fixture.json").read_text())
BIDS = [{"usd": 130000, "probability": 0.6}, {"usd": 90000, "probability": 0.4}]


def one_period_option(premium=3000):
    return {"instrument": "staged_option", "horizon_months": 1, "bids": BIDS, "exit_fee_usd": 2000,
            "carry_usd_per_month": 0, "stages": [{"month": 0, "payment_usd": premium},
                                                 {"month": 1, "payment_usd": 102000}]}


def one_period_purchase():
    return {"instrument": "purchase", "price_usd": 100000, "entry_fee_usd": 2000, "horizon_months": 1,
            "bids": BIDS, "exit_fee_usd": 2000, "carry_usd_per_month": 500}


class FixtureCalculatorTests(unittest.TestCase):
    def test_reproduces_expected_results(self):
        result = engine.evaluate_fixture(FIXTURE)
        expected = FIXTURE["expected_results"]
        for name in ("purchase", "purchase_option"):
            got = result["instruments"][name]
            self.assertEqual(list(got["scenario_npv_usd"].values()), expected[name]["scenario_net_cashflows_usd"])
            self.assertEqual(got["expected_npv_usd"], expected[name]["expected_net_cashflow_usd"])
            self.assertEqual(got["worst_loss_usd"], expected[name]["worst_loss_within_scenarios_usd"])
            self.assertEqual(got["peak_funding_usd"], expected[name]["required_cash_before_exit_usd"])
            self.assertEqual(not got["excluded_because"], expected[name]["passes_loss_constraint"])
        self.assertEqual(list(result["instruments"]["purchase_option"]["decisions"].values()),
                         expected["purchase_option"]["exercise_decisions"])
        self.assertEqual((result["action"], result["instrument"]), ("BUY", "purchase_option"))

    def test_boundary_cases(self):
        def run(edit):
            fx = copy.deepcopy(FIXTURE)
            edit(fx)
            return engine.evaluate_fixture(fx)

        high_premium = run(lambda fx: fx["purchase_option"].update(premium_usd=16000))
        self.assertEqual(high_premium["instruments"]["purchase_option"]["expected_npv_usd"], -400)
        self.assertEqual(high_premium["action"], "SKIP")
        self.assertEqual(run(lambda fx: fx["purchase_option"].update(settlement_delay_days=1))["action"], "SKIP")
        self.assertEqual(run(lambda fx: fx.update(cash_budget_usd=104000))["action"], "SKIP")
        missing = run(lambda fx: [s.pop("gross_executable_bid_usd") for s in fx["scenarios"]])
        self.assertEqual((missing["status"], missing["action"]), ("insufficient_inputs", None))

    def test_ledger_sums_to_npv(self):
        result = engine.evaluate_fixture(FIXTURE)
        for got in result["instruments"].values():
            for scenario, ledger in got["ledgers"].items():
                self.assertEqual(sum(item["usd"] for item in ledger), got["scenario_npv_usd"][scenario])


class BridgingTests(unittest.TestCase):
    """The monthly tree, collapsed to one period with the fixture's bids, must agree with the fixture."""

    def test_one_period_tree_matches_fixture(self):
        certain = engine.FixedArrival((1.0,))
        option = engine.Solver(one_period_option(), certain)
        purchase = engine.Solver(one_period_purchase(), certain)
        self.assertEqual((option.entry_value(), option.entry_worst(), option.peak_funding()), (12600, -3000, 105000))
        self.assertEqual((purchase.entry_value(), purchase.entry_worst(), purchase.peak_funding()), (9500, -14500, 102500))
        self.assertEqual(engine.decide_entry(one_period_option(), certain, 105000, 5000)["action"], "BUY")
        self.assertTrue(engine.decide_entry(one_period_purchase(), certain, 105000, 5000)["excluded_because"])
        self.assertEqual(engine.solve(one_period_option(premium=16000), certain), -400)
        self.assertEqual(engine.decide_entry(one_period_option(), certain, 104000, 5000)["action"], "SKIP")


class ArrivalTests(unittest.TestCase):
    def test_conjugate_hand_values(self):
        prior = engine.GammaArrival(alpha=2, beta=4)
        self.assertAlmostEqual(prior.p_buyer_within(3), 33 / 49)  # 1 - (4/7)^2
        self.assertAlmostEqual(prior.p_buyer_within(3, quiet_months=2), 5 / 9)  # 1 - (6/9)^2
        self.assertAlmostEqual(prior.with_staking(2, 2).p_buyer_within(3), 65 / 81)  # 1 - (6/9)^4

    def test_conversion_rate_scales_buyer_rate(self):
        prior = engine.GammaArrival(alpha=2, beta=4, q=0.5)
        self.assertAlmostEqual(prior.p_buyer_within(3), 1 - (8 / 11) ** 2)

    def test_empirical_bayes_prior(self):
        prior = engine.gamma_prior_from_counts([0, 2, 4, 6], expected_per_year=6)
        mean, var = 3, 20 / 3  # sample mean and variance
        alpha = mean * mean / (var - mean)
        self.assertAlmostEqual(prior.alpha, alpha)
        self.assertAlmostEqual(prior.alpha / prior.beta * 12, 6)  # prior mean matches the forecast


def brute_force(contract, arrival, budget_months):
    """Independent expectimax over full histories, without the engine's state compression."""
    stages, bids = contract["stages"], [(b["usd"], b["probability"]) for b in contract["bids"]]
    horizon, exit_fee, carry = contract["horizon_months"], contract["exit_fee_usd"], contract["carry_usd_per_month"]

    def step(month, paid, history):
        owned = paid == len(stages)
        if month >= horizon:
            return contract.get("salvage_usd", 0.0) if owned else 0.0
        if not owned and stages[paid]["month"] == month:
            pay = -stages[paid]["payment_usd"] + run_month(month, paid + 1, history)
            return max(0.0, pay)
        return run_month(month, paid, history)

    def run_month(month, paid, history):
        owned = paid == len(stages)
        cost = carry if owned else 0.0
        later = step(month + 1, paid, history + ("quiet",))
        p = 1 - ((arrival.beta / arrival.q + month) / (arrival.beta / arrival.q + month + 1)) ** arrival.alpha
        owed = sum(s["payment_usd"] for s in stages[paid:])
        offers = sum(prob * max(bid - exit_fee - owed, later) for bid, prob in bids)
        return -cost + p * offers + (1 - p) * later

    return -stages[0]["payment_usd"] + run_month(0, 1, ())


class BackwardInductionTests(unittest.TestCase):
    def test_matches_brute_force_on_random_small_contracts(self):
        rng = random.Random(7)
        for _ in range(40):
            horizon = rng.randint(1, 5)
            months = sorted(rng.sample(range(1, horizon + 1), rng.randint(1, horizon)))
            contract = {
                "instrument": "staged_option", "horizon_months": horizon,
                "stages": [{"month": 0, "payment_usd": rng.randint(1, 20) * 1000}] +
                          [{"month": m, "payment_usd": rng.randint(1, 60) * 1000} for m in months],
                "bids": [{"usd": rng.randint(50, 300) * 1000, "probability": 0.5},
                         {"usd": rng.randint(10, 120) * 1000, "probability": 0.5}],
                "exit_fee_usd": rng.randint(0, 5) * 1000, "carry_usd_per_month": rng.randint(0, 3) * 500,
            }
            arrival = engine.GammaArrival(alpha=rng.uniform(0.5, 4), beta=rng.uniform(1, 30), q=rng.uniform(0.1, 1))
            self.assertAlmostEqual(engine.solve(contract, arrival), brute_force(contract, arrival, horizon), places=6)

    def test_costs_never_raise_value(self):
        rng = random.Random(11)
        arrival = engine.GammaArrival(alpha=2, beta=6, q=0.5)
        for _ in range(30):
            contract = {"instrument": "staged_option", "horizon_months": 6, "exit_fee_usd": 1000,
                        "carry_usd_per_month": 200, "bids": BIDS,
                        "stages": [{"month": 0, "payment_usd": 5000}, {"month": 3, "payment_usd": 40000},
                                   {"month": 6, "payment_usd": 60000}]}
            base = engine.solve(contract, arrival)
            for field in ("exit_fee_usd", "carry_usd_per_month"):
                dearer = copy.deepcopy(contract)
                dearer[field] += rng.randint(1, 5000)
                self.assertLessEqual(engine.solve(dearer, arrival), base + 1e-9)
            dearer = copy.deepcopy(contract)
            dearer["stages"][1]["payment_usd"] += rng.randint(1, 5000)
            self.assertLessEqual(engine.solve(dearer, arrival), base + 1e-9)

    def test_zero_probability_bid_changes_nothing(self):
        arrival = engine.GammaArrival(alpha=2, beta=6)
        contract = {"instrument": "purchase", "price_usd": 50000, "horizon_months": 4, "exit_fee_usd": 1000,
                    "carry_usd_per_month": 100, "bids": BIDS}
        extra = copy.deepcopy(contract)
        extra["bids"].append({"usd": 10 ** 7, "probability": 0.0})
        self.assertAlmostEqual(engine.solve(contract, arrival), engine.solve(extra, arrival))

    def test_break_even_flips_the_sign(self):
        arrival = engine.GammaArrival(alpha=2, beta=12, q=0.3)
        contract = {"instrument": "staged_option", "horizon_months": 12, "exit_fee_usd": 2000,
                    "carry_usd_per_month": 0, "bids": BIDS,
                    "stages": [{"month": 0, "payment_usd": 3000}, {"month": 12, "payment_usd": 102000}]}
        q_star = engine.analyse(contract, arrival, 10 ** 6, 10 ** 6)["break_even"]["buyers_per_staking_event_q"]
        self.assertIsNotNone(q_star)
        below = engine.solve(contract, engine.GammaArrival(2, 12, q_star * 0.9))
        above = engine.solve(contract, engine.GammaArrival(2, 12, q_star * 1.1))
        self.assertLess(below, 0)
        self.assertGreater(above, 0)


class TokDemoTests(unittest.TestCase):
    """Pins the demo decision on the real White Rock terms, so the presented numbers stay reproducible."""

    def setUp(self):
        spec = json.loads((ROOT / "research/decision-engine/tok-demo.json").read_text())
        counts = spec["staking_events_per_year"]
        prior = engine.gamma_prior_from_counts(counts, sum(counts) / len(counts))
        self.arrival = engine.GammaArrival(prior.alpha, prior.beta, spec["q_buyers_per_staking_event"])
        self.spec = spec

    def test_demo_decision(self):
        result = engine.analyse(self.spec["contract"], self.arrival, self.spec["policy"]["budget_usd"],
                                self.spec["policy"]["loss_limit_usd"])
        self.assertEqual(result["action"], "BUY")
        self.assertAlmostEqual(result["value_usd"], 14507.43, places=1)
        self.assertAlmostEqual(result["break_even"]["buyers_per_staking_event_q"], 0.1963, places=3)
        lapse = [m for m in result["policy"] if m["action"] == "LAPSE"]
        self.assertEqual(lapse[0]["month"], 12)

    def test_no_buyer_path_costs_first_payment_and_rent(self):
        solver = engine.Solver(self.spec["contract"], self.arrival)
        months = 12
        rent = sum(self.spec["contract"]["carry_usd_per_month"] * (1.08 ** (-m / 12)) for m in range(months))
        self.assertAlmostEqual(solver.entry_worst(), -(10000 + rent), places=6)


if __name__ == "__main__":
    unittest.main()
