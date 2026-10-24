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


class LogisticTests(unittest.TestCase):
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
