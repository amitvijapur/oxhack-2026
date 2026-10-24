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
        seen = history.count("declined")  # buyers seen so far, read from the full history
        quiet = step(month + 1, paid, history + ("quiet",))
        declined = step(month + 1, paid, history + ("declined",))
        b = arrival.beta / arrival.q + month
        p = 1 - (b / (b + 1)) ** (arrival.alpha + seen)
        owed = sum(s["payment_usd"] for s in stages[paid:])
        offers = sum(prob * max(bid - exit_fee - owed, declined) for bid, prob in bids)
        return -cost + p * offers + (1 - p) * quiet

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


class HistoryTests(unittest.TestCase):
    """The belief that forgets old years, and how its forgetting rate is chosen."""

    def test_no_forgetting_is_ordinary_pooling(self):
        a, b = engine.discounted_posterior([2, 0, 3], [1, 1, 1], 1.0, 0.5, 0.5)
        self.assertEqual((a, b), (5.5, 3.5))

    def test_discounted_update_hand_values(self):
        # forget 0.5: (0.5,0.5) -> (0.25+2, 0.25+1) -> (1.125+0, 0.625+1) -> (0.5625+3, 0.8125+1)
        a, b = engine.discounted_posterior([2, 0, 3], [1, 1, 1], 0.5, 0.5, 0.5)
        self.assertAlmostEqual(a, 3.5625)
        self.assertAlmostEqual(b, 1.8125)

    def test_partial_year_counts_less(self):
        _, b_full = engine.discounted_posterior([1], [1.0], 1.0, 0.5, 0.5)
        _, b_part = engine.discounted_posterior([1], [0.25], 1.0, 0.5, 0.5)
        self.assertAlmostEqual(b_full - b_part, 0.75)

    def test_forgetting_score_uses_only_earlier_years(self):
        counts, exposure = [2, 0, 0, 3, 1, 0, 0], [1.0] * 7
        row = engine.forgetting_profile(counts, exposure, [0.8], 0.5, 0.5, burn_in=3)[0]
        manual = 0.0
        for t in range(3, len(counts)):
            a, b = engine.discounted_posterior(counts[:t], exposure[:t], 0.8, 0.5, 0.5)
            manual += engine.nb_logpmf(counts[t], a, b, 1.0)
        self.assertAlmostEqual(row["log_score"], manual)
        changed = engine.forgetting_profile(counts[:-1] + [9], exposure, [0.8], 0.5, 0.5, burn_in=3)[0]
        early = engine.forgetting_profile(counts[:-1], exposure[:-1], [0.8], 0.5, 0.5, burn_in=3)[0]
        last_a, last_b = engine.discounted_posterior(counts[:-1], exposure[:-1], 0.8, 0.5, 0.5)
        self.assertAlmostEqual(changed["log_score"], early["log_score"] + engine.nb_logpmf(9, last_a, last_b, 1.0))

    def test_single_component_mixture_equals_gamma(self):
        g = engine.GammaArrival(2, 6, 0.5)
        m = engine.MixtureArrival(((1.0, g),))
        for month, seen in ((0, 0), (5, 0), (5, 2)):
            self.assertAlmostEqual(m.p_buyer_in_month(month, seen), g.p_buyer_in_month(month, seen))

    def test_quiet_months_shift_weight_to_slower_component(self):
        slow, fast = engine.GammaArrival(2, 24), engine.GammaArrival(2, 3)
        m = engine.MixtureArrival(((0.5, slow), (0.5, fast)))
        self.assertGreater(m.weights(months=12)[0], 0.5)
        self.assertLess(m.weights(months=2, arrivals=3)[0], 0.5)

    def test_forecast_sets_prior_mean(self):
        prior = engine.arrival_from_forecast(0.2, {"mean_events": 0.2326, "var_events": 0.5403}, q=0.5)
        self.assertAlmostEqual(prior.alpha / prior.beta * 12, -__import__("math").log(0.8))
        self.assertAlmostEqual(prior.alpha, 0.2326 ** 2 / (0.5403 - 0.2326))


class ForecastToDecisionTests(unittest.TestCase):
    """The measured forecast reaches the decision: a stronger forecast can never lower an option's value."""

    BAND = {"mean_events": 0.2326, "var_events": 0.5403}

    def test_band_lookup(self):
        moments = {"0.0-0.1": {"n": 1}, "0.1-0.2": {"n": 2}, "0.3-0.4": {"n": 3}}
        self.assertEqual(engine.band_for(0.15, moments)[0], "0.1-0.2")
        self.assertEqual(engine.band_for(0.95, moments)[0], "0.3-0.4")  # beyond the last band: use the top one

    def test_higher_forecast_never_lowers_option_value(self):
        contract = {"instrument": "staged_option", "horizon_months": 24, "exit_fee_usd": 5000,
                    "carry_usd_per_month": 300, "carry_during_option": True, "bids": BIDS,
                    "stages": [{"month": 0, "payment_usd": 8000}, {"month": 12, "payment_usd": 30000},
                               {"month": 24, "payment_usd": 90000}]}
        values = [engine.solve(contract, engine.arrival_from_forecast(p, self.BAND, 0.5), 100000)
                  for p in (0.02, 0.1, 0.2, 0.35, 0.5)]
        self.assertEqual(values, sorted(values))


class WaitRiskChangepointTests(unittest.TestCase):
    def test_staking_predictive_is_negative_binomial(self):
        g = engine.GammaArrival(alpha=2, beta=6)  # months
        pred = engine.staking_predictive(g, 12)
        self.assertAlmostEqual(sum(p for p, _ in pred), 1.0, places=6)
        self.assertAlmostEqual(pred[0][0], (6 / 18) ** 2)  # P(0 events in 12 months)
        self.assertEqual(pred[3][1], g.with_staking(3, 12))

    def test_wait_value_bounds(self):
        contract = {"instrument": "staged_option", "horizon_months": 24, "exit_fee_usd": 5000,
                    "carry_usd_per_month": 300, "carry_during_option": True, "bids": BIDS,
                    "stages": [{"month": 0, "payment_usd": 8000}, {"month": 12, "payment_usd": 30000},
                               {"month": 24, "payment_usd": 90000}]}
        arrival = engine.GammaArrival(1.5, 20, 0.5)
        never, _ = engine.wait_value(contract, arrival, 10 ** 6, 10 ** 6, 0.0)
        half, if_open = engine.wait_value(contract, arrival, 10 ** 6, 10 ** 6, 0.5)
        self.assertEqual(never, 0.0)
        self.assertAlmostEqual(half, 0.5 * if_open)
        self.assertGreaterEqual(if_open, 0.0)

    def test_certainty_equivalent(self):
        sure = {1000.0: 1.0}
        self.assertAlmostEqual(engine.certainty_equivalent(sure, 10000, 2), 1000.0)
        gamble = {-5000.0: 0.5, 7000.0: 0.5}  # mean +1000
        ces = [engine.certainty_equivalent(gamble, 10000, g) for g in (0.5, 1, 2, 4)]
        self.assertEqual(ces, sorted(ces, reverse=True))  # more risk aversion, lower value
        self.assertLess(ces[0], 1000.0)
        self.assertAlmostEqual(engine.certainty_equivalent(gamble, 10000, 1), (5000 * 17000) ** 0.5 - 10000)

    def test_segment_marginal_hand_value(self):
        # One event in one year, Gamma(1, 1) rate: negative binomial P(1) = 1/4.
        self.assertAlmostEqual(engine.segment_log_marginal([1], [1.0], 1.0, 1.0), __import__("math").log(0.25))

    def test_changepoint_finds_a_clear_break(self):
        years = list(range(2000, 2020))
        counts = [4] * 10 + [0] * 10
        post = engine.changepoint_posterior(years, counts, [1.0] * 20, 1.0, 1.0)
        self.assertAlmostEqual(post["p_no_change"] + sum(post["p_change_by_year"].values()), 1.0)
        self.assertEqual(post["most_likely_change_year"], 2010)
        self.assertGreater(1 - post["p_no_change"], 0.99)


class GateTests(unittest.TestCase):
    def test_failed_gate_excludes_entry(self):
        result = engine.apply_gates({"signal": "BUY", "excluded_because": []},
                                    {"title": {"status": "fail"}, "access": {"status": "pass"}})
        self.assertEqual((result["status"], result["signal"]), ("excluded", "SKIP"))

    def test_unknown_gate_keeps_signal_for_manual_review(self):
        result = engine.apply_gates({"signal": "BUY"}, {"land_status": {"status": "unknown"},
                                                        "counterparty": {"status": "pass"}})
        self.assertEqual((result["status"], result["signal"], result["manual_review"]),
                         ("manual_review", "BUY", ["land_status"]))


SWARM_SPEC = importlib.util.spec_from_file_location("swarm_adapter", ROOT / "scripts/swarm_adapter.py")
swarm = importlib.util.module_from_spec(SWARM_SPEC)
SWARM_SPEC.loader.exec_module(swarm)
MAPPINGS = json.loads((ROOT / "research/decision-engine/swarm-mappings.json").read_text())


def fake_results(placebo_quiet="pass", tax="pass", tax_effect=-1.2, band=0.5):
    """A results.json in the shape swarm/score.py writes."""
    return {"checks": {"placebo": {"status": "pass", "parts": [
                {"part": swarm.PLACEBO_PART, "status": placebo_quiet}, {"part": "tax_rise", "status": tax}]},
                       "mirrors": {"status": "not run", "parts": []}},
            "effects": {"tax_rise": {"funds": {"effect": tax_effect, "band": band, "beyond_band": abs(tax_effect) > band},
                                     "land_industry": {"effect": -0.1, "band": band, "beyond_band": False}}}}


class SwarmAdapterTests(unittest.TestCase):
    def test_nothing_used_when_placebo_fails(self):
        used, dropped = swarm.usable_scenarios(fake_results(placebo_quiet="fail"), MAPPINGS)
        self.assertEqual(used, [])
        self.assertIn("all", dropped)

    def test_passed_scenario_applied_once(self):
        used, dropped = swarm.usable_scenarios(fake_results(), MAPPINGS)
        self.assertEqual([u[0] for u in used], ["tax_rise"])
        self.assertIn("mine_approved", dropped)  # not run, so not used
        changed, _ = swarm.apply_transform({"bids": [{"usd": 100000.0, "probability": 1.0}]},
                                           engine.GammaArrival(1, 1, 0.5), used[0][1])
        self.assertAlmostEqual(changed["bids"][0]["usd"], 85000.0)

    def test_effect_inside_band_ignored(self):
        used, _ = swarm.usable_scenarios(fake_results(tax_effect=-0.3), MAPPINGS)
        self.assertEqual(used, [])

    def test_missing_results_file(self):
        used, dropped, _ = swarm.load(ROOT / "no-such-results.json")
        self.assertEqual(used, [])
        self.assertIn("no swarm results", dropped["all"])


POLICY_SPEC = importlib.util.spec_from_file_location("policy_extract", ROOT / "scripts/policy_extract.py")
policy = importlib.util.module_from_spec(POLICY_SPEC)
POLICY_SPEC.loader.exec_module(policy)


class PolicyExtractTests(unittest.TestCase):
    def test_rules_fallback(self):
        self.assertEqual(policy.rules_label("The state will propose raising the mining tax.")["move"], "tax_change")
        self.assertEqual(policy.rules_label("DNR will continue reviewing public comments.")["move"], "review_or_delay")
        self.assertEqual(policy.rules_label("Approval with enforceable mitigation conditions.")["move"],
                         "approve_with_conditions")

    def test_jev_request_shape(self):
        request = policy.jev_request("text")
        question = request["questions"]["policy_move"]
        self.assertEqual(question["type"], "choice")
        self.assertEqual(set(question["criteria"]), set(policy.MOVES))
        self.assertEqual(request["state"], {"answer": "text"})


class OutcomeTests(unittest.TestCase):
    def test_outcome_distribution_matches_value(self):
        rng = random.Random(5)
        for _ in range(20):
            contract = {"instrument": "staged_option", "horizon_months": 8, "exit_fee_usd": 2000,
                        "carry_usd_per_month": 150, "carry_during_option": True, "annual_discount_rate": 0.08,
                        "bids": [{"usd": rng.randint(150, 400) * 1000, "probability": 0.3},
                                 {"usd": rng.randint(50, 150) * 1000, "probability": 0.7}],
                        "stages": [{"month": 0, "payment_usd": 5000}, {"month": 4, "payment_usd": 30000},
                                   {"month": 8, "payment_usd": 90000}]}
            solver = engine.Solver(contract, engine.GammaArrival(rng.uniform(0.5, 3), rng.uniform(2, 20), 0.5))
            dist = solver.outcomes()
            self.assertAlmostEqual(sum(dist.values()), 1.0)
            self.assertAlmostEqual(sum(c * p for c, p in dist.items()), solver.entry_value(), places=4)
            self.assertAlmostEqual(min(dist), solver.entry_worst(), places=4)

    def test_commitment_cap_bounds_the_loss(self):
        contract = {"instrument": "staged_option", "horizon_months": 30, "exit_fee_usd": 1000,
                    "carry_usd_per_month": 100, "carry_during_option": True, "bids": BIDS,
                    "stages": [{"month": 0, "payment_usd": 5000}, {"month": 10, "payment_usd": 30000},
                               {"month": 20, "payment_usd": 60000}, {"month": 30, "payment_usd": 90000}]}
        arrival = engine.GammaArrival(3, 4, 1.0)
        free = engine.Solver(contract, arrival)
        capped = engine.Solver(contract, arrival, commitment_cap=40000)
        self.assertGreaterEqual(capped.entry_worst(), -40000 - 1e-6)
        self.assertLessEqual(capped.entry_value(), free.entry_value() + 1e-9)


class TokDemoTests(unittest.TestCase):
    """Pins the demo decision on the real White Rock terms, so the presented numbers stay reproducible.

    Re-pinned on 25 Oct 2026 after the PR #25 review fixes: time-aware history (forgetting rate chosen
    out of sample, 2025 counted as 63 days), buyer arrivals in the state, and the loss limit applied
    inside the policy. The earlier pin (+$14,507) pooled all years and ignored declined offers.
    Re-pinned again (+$9,617 -> +$8,219) when the assumed Alaska rent was replaced by Arjin's verified
    rates for claims aged 6-10 plus annual labour.
    """

    def setUp(self):
        spec = json.loads((ROOT / "research/decision-engine/tok-demo.json").read_text())
        self.arrival, self.rows = engine.arrival_from_history(spec["staking_history"], spec["arrival_prior"],
                                                              spec["q_buyers_per_staking_event"])
        self.spec = spec

    def test_demo_decision(self):
        result = engine.analyse(self.spec["contract"], self.arrival, self.spec["policy"]["budget_usd"],
                                self.spec["policy"]["loss_limit_usd"])
        self.assertEqual(result["action"], "BUY")
        self.assertAlmostEqual(result["value_usd"], 8219.0, delta=1.0)
        self.assertGreaterEqual(result["worst_outcome_usd"], -self.spec["policy"]["loss_limit_usd"])
        self.assertIn("the acceleration assumption alone flips the sign of the value", result["fragile"])
        self.assertEqual([m for m in result["policy"] if m["action"] == "LAPSE"][0]["month"], 12)

    def test_best_forgetting_rate(self):
        best = max(self.rows, key=lambda r: r["weight"])
        self.assertEqual(best["forget"], 0.75)


if __name__ == "__main__":
    unittest.main()


SENTIMENT_SPEC = importlib.util.spec_from_file_location("jev_sentiment_check", ROOT / "scripts/jev_sentiment_check.py")
sentiment = importlib.util.module_from_spec(SENTIMENT_SPEC)
SENTIMENT_SPEC.loader.exec_module(sentiment)


class SentimentCheckTests(unittest.TestCase):
    def test_bucket_matches_judge_prompt(self):
        self.assertEqual([sentiment.bucket(s) for s in (0, 3, 4, 6, 7, 10, None, "n/a")],
                         ["cold", "cold", "warm", "warm", "hot", "hot", None, None])

    def test_kappa_hand_value(self):
        # 10 items, 8 agree. Reference: 5 warm, 5 hot. Predicted: 6 warm, 3 hot, 1 cold.
        # Chance agreement = (5*6 + 5*3) / 100 = 0.45, so kappa = (0.8 - 0.45) / 0.55 = 0.6364.
        pairs = [("warm", "warm")] * 5 + [("hot", "hot")] * 3 + [("hot", "warm")] + [("hot", "cold")]
        result = sentiment.agreement(pairs)
        self.assertEqual(result["accuracy"], 0.8)
        self.assertAlmostEqual(result["kappa"], 0.6364)

    def test_always_warm_has_no_skill(self):
        pairs = [("warm", "warm")] * 8 + [("hot", "warm"), ("cold", "warm")]
        self.assertEqual(sentiment.agreement(pairs)["kappa"], 0.0)

    def test_request_and_response_shapes(self):
        posts = [{"name": "A", "group": "Funds", "text": "Buying GLD calls."}]
        request = sentiment.build_request(posts)
        self.assertEqual(request["questions"]["support_0"]["type"], "score")
        self.assertEqual(len(request["questions"]["support_0"]["criteria"]), 3)
        self.assertEqual(request["questions"]["on_topic_0"]["type"], "noul")
        response = {"answers": {"support_0": {"score": 1.8, "confidence": 0.7, "probabilities": {"0": 0.0, "1": 0.2, "2": 0.8}},
                                "on_topic_0": {"noul": 0.95}}}
        answer = sentiment.read_answers(response, 1)[0]
        self.assertEqual(answer["label"], "hot")
        self.assertEqual(answer["p_on_topic"], 0.95)
