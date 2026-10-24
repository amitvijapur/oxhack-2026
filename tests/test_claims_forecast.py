"""Leakage and arithmetic tests for the claim-activity forecast, on synthetic claims."""
import csv
from datetime import date
import importlib.util
from pathlib import Path
import random
import tempfile
import unittest

ROOT = Path(__file__).resolve().parents[1]
SPEC = importlib.util.spec_from_file_location("claims_forecast", ROOT / "scripts/claims_forecast.py")
forecast = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(forecast)
FIELDS = ("AdminState", "MTRS", "Claimant", "Location_Date", "Closed_Date", "lon", "lat")


def write_claims(path, claims):
    with open(path, "w", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=FIELDS)
        writer.writeheader()
        for state, mtrs, who, located, closed in claims:
            writer.writerow({"AdminState": state, "MTRS": mtrs, "Claimant": who, "Location_Date": located,
                             "Closed_Date": closed, "lon": "-116.5", "lat": "40.0"})


class FakeGold:
    def km_to_nearest(self, lon, lat, cap=50.0):
        return 3.0


class FeatureTests(unittest.TestCase):
    def rows_for(self, claims, years):
        with tempfile.TemporaryDirectory() as tmp:
            path = Path(tmp) / "claims.csv"
            write_claims(path, claims)
            cells = forecast.load_claims(path)
        return forecast.build_rows(cells, FakeGold(), years)

    def test_cells_staked_later_are_not_eligible_earlier(self):
        rows = self.rows_for([("NV", "21 0100N 0100E 001", "A", "1998-05-01", ""),
                              ("NV", "21 0100N 0100E 002", "B", "2006-05-01", "")], range(2005, 2008))
        eligible = {(r["cell"], r["year"]) for r in rows}
        self.assertNotIn(("21 0100N 0100E 002", 2005), eligible)
        self.assertNotIn(("21 0100N 0100E 002", 2006), eligible)  # staked 2006-05, after the 2006 cutoff
        self.assertIn(("21 0100N 0100E 002", 2007), eligible)

    def test_future_events_do_not_change_features(self):
        base = [("NV", "21 0100N 0100E 001", "A", "1998-05-01", ""), ("NV", "21 0100N 0100E 001", "A", "2003-03-01", "")]
        later = base + [("NV", "21 0100N 0100E 001", "C", "2005-12-01", ""), ("NV", "21 0100N 0100E 001", "D", "2009-01-05", "")]
        before = {r["year"]: r["x"] for r in self.rows_for(base, [2004, 2005])}
        after = {r["year"]: r["x"] for r in self.rows_for(later, [2004, 2005])}
        self.assertEqual(before, after)

    def test_lag_gap_excludes_recent_staking(self):
        """Staking in the last 92 days before 1 January is neither a feature nor in the label year."""
        rows = self.rows_for([("NV", "21 0100N 0100E 001", "A", "1998-05-01", ""),
                              ("NV", "21 0100N 0100E 001", "B", "2004-12-15", "")], [2005])
        self.assertEqual(rows[0]["x"][1], 0.0)  # log1p(trailing 1y) is zero
        self.assertEqual(rows[0]["y"], 0)

    def test_locator_days_not_claim_counts(self):
        """One claimant filing many claims on one day is one event."""
        claims = [("NV", "21 0100N 0100E 001", "A", "1998-05-01", "")]
        claims += [("NV", "21 0100N 0100E 001", "BIGCO", "2005-06-01", "")] * 50
        row = [r for r in self.rows_for(claims, [2005]) if r["year"] == 2005][0]
        self.assertEqual(row["events"], 1)

    def test_closed_claims_leave_the_active_count(self):
        rows = self.rows_for([("NV", "21 0100N 0100E 001", "A", "1998-05-01", "2002-08-31"),
                              ("NV", "21 0100N 0100E 001", "B", "1999-05-01", "")], [2004])
        self.assertAlmostEqual(rows[0]["x"][3], __import__("math").log1p(1))


class ValidationTests(unittest.TestCase):
    def test_claimant_names_normalised(self):
        self.assertEqual(forecast.normalise_claimant("ABC, LLC"), forecast.normalise_claimant("ABC LLC"))
        self.assertEqual(forecast.normalise_claimant("Barrick Gold Exploration Inc."), "BARRICK GOLD EXPLORATION")

    def test_name_variants_are_one_decision(self):
        claims = [("NV", "21 0100N 0100E 001", "A", "1998-05-01", ""),
                  ("NV", "21 0100N 0100E 001", "ABC, LLC", "2005-06-01", ""),
                  ("NV", "21 0100N 0100E 001", "ABC LLC", "2005-06-01", "")]
        with tempfile.TemporaryDirectory() as tmp:
            path = Path(tmp) / "claims.csv"
            write_claims(path, claims)
            row = [r for r in forecast.build_rows(forecast.load_claims(path), FakeGold(), [2005])][0]
        self.assertEqual(row["events"], 1)

    def test_invalid_rows_counted_and_dropped(self):
        claims = [("NV", "21 0100N 0100E 001", "A", "1998-05-01", ""),
                  ("NV", "bad mtrs", "A", "1998-05-01", ""),
                  ("NV", "21 0100N 0100E 001", "B", "2026-01-01", ""),
                  ("NV", "21 0100N 0100E 001", "C", "2000-01-01", "1999-01-01")]
        stats = {}
        with tempfile.TemporaryDirectory() as tmp:
            path = Path(tmp) / "claims.csv"
            write_claims(path, claims)
            forecast.load_claims(path, stats)
        self.assertEqual(stats["dropped_bad_mtrs_format"], 1)
        self.assertEqual(stats["dropped_location_after_snapshot"], 1)
        self.assertEqual(stats["closed_before_located_ignored"], 1)
        self.assertEqual(stats["kept"], 2)


class ScoringTests(unittest.TestCase):
    def test_intercept_shift_recovers_known_offset(self):
        rng = random.Random(9)
        rows = []
        for _ in range(20000):
            x = (1.0, rng.gauss(0, 1))
            rows.append({"x": x, "y": 1 if rng.random() < forecast.predict((-1.0, 1.0), x, shift=-0.7) else 0})
        self.assertAlmostEqual(forecast.intercept_shift((-1.0, 1.0), rows), -0.7, delta=0.06)

    def test_economic_value_bounds(self):
        perfect = [(1.0, 1)] * 10 + [(0.0, 0)] * 90
        self.assertTrue(all(abs(v["value"] - 1.0) < 1e-9 for v in forecast.economic_value(perfect)))
        useless = [(0.1, 1)] * 10 + [(0.1, 0)] * 90  # constant at the base rate
        self.assertTrue(all(v["value"] <= 1e-9 for v in forecast.economic_value(useless)))

    def test_student_t_p_value(self):
        self.assertAlmostEqual(forecast.t_two_sided_p(2.086, 20), 0.05, places=3)
        self.assertAlmostEqual(forecast.t_two_sided_p(0.0, 5), 1.0)


class LogisticTests(unittest.TestCase):
    def test_converges_and_reports(self):
        rng = random.Random(4)
        rows = [{"x": (1.0, x), "y": 1 if rng.random() < forecast.predict((0.3, -0.8), (1.0, x)) else 0}
                for x in (rng.gauss(0, 1) for _ in range(3000))]
        info = {}
        forecast.fit_logistic(rows, info=info)
        self.assertTrue(info["converged"])
        self.assertLess(info["iterations"], 25)

    def test_recovers_known_coefficients(self):
        rng = random.Random(3)
        rows = []
        for _ in range(4000):
            x = (1.0, rng.gauss(0, 1))
            p = forecast.predict((-0.5, 1.5), x)
            rows.append({"x": x, "y": 1 if rng.random() < p else 0})
        w = forecast.fit_logistic(rows, ridge=0.0)
        self.assertAlmostEqual(w[0], -0.5, delta=0.15)
        self.assertAlmostEqual(w[1], 1.5, delta=0.15)


if __name__ == "__main__":
    unittest.main()


PBO_SPEC = importlib.util.spec_from_file_location("claims_pbo", ROOT / "scripts/claims_pbo.py")
claims_pbo = importlib.util.module_from_spec(PBO_SPEC)
PBO_SPEC.loader.exec_module(claims_pbo)


class PboTests(unittest.TestCase):
    def test_clear_winner_has_no_overfitting(self):
        rng = random.Random(1)
        names = [f"v{i}" for i in range(5)] + ["best"]
        matrix = {y: {n: rng.gauss(3 if n == "best" else 0, 1) for n in names} for y in range(2003, 2024)}
        result = claims_pbo.pbo(matrix, names, 6)
        self.assertEqual(result["splits"], 20)
        self.assertEqual(result["pbo"], 0.0)

    def test_identical_variants_are_coin_flips(self):
        names = ["a", "b"]
        matrix = {y: {"a": (y % 2) * 1.0, "b": ((y + 1) % 2) * 1.0} for y in range(2003, 2023)}
        self.assertGreater(claims_pbo.pbo(matrix, names, 4)["pbo"], 0.0)
