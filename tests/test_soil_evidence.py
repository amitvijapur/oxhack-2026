"""Contract tests for source interpretation and reproducible A/B evidence packs."""
import copy
import csv
import hashlib
import importlib.util
import io
import json
from pathlib import Path
import sys
import tempfile
import unittest

MODULE_PATH = Path(__file__).resolve().parents[1] / "scripts" / "soil_evidence.py"
spec = importlib.util.spec_from_file_location("soil_evidence", MODULE_PATH)
soil = importlib.util.module_from_spec(spec)
sys.modules[spec.name] = soil
spec.loader.exec_module(soil)


def fixture():
    fields = list(soil.REQUIRED) + [f"unused_{i}" for i in range(74)]
    rows = [[f"Source preamble {i}"] for i in range(12)]
    rows.append(fields)
    units = {"Latitude": "Degrees", "Longitude": "Degrees", "C_Depth": "cm", "C_Cu": "mg/kg"}
    rows.append([units.get(f, "") for f in fields])
    az_longitudes = [-4, -3, -2, -1, 0, 0, 1, 2, 3]
    for i, longitude in enumerate(az_longitudes, 1):
        values = {"SiteID": str(i), "C_LabID": f"LAB-{i}", "StateID": "AZ", "Latitude": "35", "Longitude": str(longitude), "CollDate": "04/20/09", "C_Depth": "N.S." if i == 2 else "50-100", "C_Cu": "N.S." if i == 2 else str({1: 10, 3: 30, 4: 20}.get(i, i * 10))}
        rows.append([values.get(f, "") for f in fields])
    for i, token in enumerate(["<0.5", "INS", "12.3"], 10):
        values = {"SiteID": str(i), "C_LabID": f"LAB-{i}", "StateID": "AL", "Latitude": "33", "Longitude": "-86", "CollDate": "04/21/09", "C_Depth": "80-100", "C_Cu": token}
        rows.append([values.get(f, "") for f in fields])
    rows.extend([[]] * 4)
    return rows


def encode(rows):
    target = io.StringIO(newline="")
    csv.writer(target, delimiter="\t", lineterminator="\n").writerows(rows)
    return target.getvalue().encode()


def profile(raw):
    return soil.SnapshotProfile(hashlib.sha256(raw).hexdigest(), {"quantified": 9, "below_detection": 1, "no_sample": 1, "insufficient_sample": 1}, {"quantified": 8, "below_detection": 0, "no_sample": 1, "insufficient_sample": 0}, minimum_quantified=2)


def manifest(raw):
    return {"schema_version": "1.0", "source_id": "usgs_ds801_c_horizon", "source_sha256": hashlib.sha256(raw).hexdigest(), "source_bytes": len(raw), "source_file_name": "fixture.txt", "state": "AZ", "coordinate_system": "WGS84 EPSG:4326", "selection_rule": "Coordinate-only median; A < split; B >= split", "split_longitude": 0.0, "areas": {"A": {"sample_ids": ["1", "2", "3", "4"], "record_count": 4, "sample_coordinate_bounds": {"west": -4.0, "east": -1.0, "south": 35.0, "north": 35.0}}, "B": {"sample_ids": ["5", "6", "7", "8", "9"], "record_count": 5, "sample_coordinate_bounds": {"west": 0.0, "east": 3.0, "south": 35.0, "north": 35.0}}}}


class CopperInterpretationTests(unittest.TestCase):
    def test_distinguishes_measurements_censoring_and_missingness(self):
        self.assertEqual(soil.parse_copper("0"), (0.0, "quantified", None))
        self.assertEqual(soil.parse_copper("12.3"), (12.3, "quantified", None))
        self.assertEqual(soil.parse_copper("<0.5"), (None, "below_detection", 0.5))
        self.assertEqual(soil.parse_copper("N.S."), (None, "no_sample", None))
        self.assertEqual(soil.parse_copper("INS"), (None, "insufficient_sample", None))

    def test_unknown_or_nonfinite_values_are_not_guessed(self):
        for token in ("", "-1", "NaN", "inf", "<1", "N.D.", "1e999"):
            with self.subTest(token=token), self.assertRaises(soil.EvidenceError):
                soil.parse_copper(token)


class SourceValidationTests(unittest.TestCase):
    def setUp(self):
        self.rows = fixture()
        self.fields = self.rows[12]

    def parse(self, rows):
        raw = encode(rows)
        return soil.parse_source(raw, profile(raw))

    def test_preamble_units_and_trailing_blanks_are_not_samples(self):
        records = self.parse(self.rows)
        self.assertEqual(len(records), 12)
        missing = next(r for r in records if r["sample_id"] == "2")
        self.assertEqual(missing["depth_raw_cm"], "N.S.")
        self.assertIsNone(missing["copper_mg_kg"])
        self.assertEqual(missing["collection_date"], "2009-04-20")
        self.assertEqual(missing["collection_date_raw"], "04/20/09")

    def test_malformed_record_is_not_silently_skipped(self):
        self.rows[14].pop()
        with self.assertRaisesRegex(soil.EvidenceError, "Malformed source row"):
            self.parse(self.rows)

    def test_interior_blank_row_is_rejected(self):
        self.rows.insert(15, [])
        with self.assertRaisesRegex(soil.EvidenceError, "after trailing blank"):
            self.parse(self.rows)

    def test_duplicate_id_invalid_coordinates_and_dates_fail(self):
        mutations = [("SiteID", "2", "Duplicate"), ("Latitude", "NaN", "coordinates"), ("Longitude", "181", "coordinates"), ("CollDate", "04/20/26", "outside source period"), ("CollDate", "02/31/09", "coordinates/date")]
        for field, value, error in mutations:
            with self.subTest(field=field, value=value):
                rows = copy.deepcopy(self.rows)
                rows[14][self.fields.index(field)] = value
                with self.assertRaisesRegex(soil.EvidenceError, error):
                    self.parse(rows)

    def test_units_must_match_the_audited_source(self):
        self.rows[13][self.fields.index("C_Cu")] = "percent"
        with self.assertRaisesRegex(soil.EvidenceError, "units row"):
            self.parse(self.rows)

    def test_changed_source_fails_snapshot_hash(self):
        raw = encode(self.rows)
        with self.assertRaisesRegex(soil.EvidenceError, "SHA-256"):
            soil.parse_source(raw + b"\n", profile(raw))

    def test_wrong_counts_fail_even_with_matching_hash(self):
        self.rows[14][self.fields.index("C_Cu")] = "INS"
        with self.assertRaisesRegex(soil.EvidenceError, "National status counts"):
            self.parse(self.rows)


class PartitionAndPackTests(unittest.TestCase):
    def setUp(self):
        self.raw = encode(fixture())
        self.profile = profile(self.raw)
        self.selection = manifest(self.raw)

    def build(self, area="A", selection=None):
        return soil.build_payloads(self.raw, self.selection if selection is None else selection, area, self.profile)

    def test_boundary_ties_go_to_b_and_missing_record_stays_in_a(self):
        a = json.loads(self.build("A")["summary.json"])
        b = json.loads(self.build("B")["summary.json"])
        self.assertEqual(a["sample_ids"], ["1", "2", "3", "4"])
        self.assertEqual(b["sample_ids"], ["5", "6", "7", "8", "9"])
        self.assertEqual(a["record_count"], 4)
        self.assertEqual(a["copper"]["denominator"], 3)
        self.assertFalse(set(a["sample_ids"]) & set(b["sample_ids"]))
        self.assertEqual(set(a["sample_ids"]) | set(b["sample_ids"]), {str(i) for i in range(1, 10)})

    def test_hand_calculated_summary_and_raw_values(self):
        payloads = self.build()
        summary = json.loads(payloads["summary.json"])
        c = summary["copper"]
        self.assertEqual([c[k] for k in ("minimum", "q1", "median", "q3", "maximum")], [10, 15, 20, 25, 30])
        self.assertEqual([r["sample_id"] for r in c["top_three"]], ["3", "4", "1"])
        records = list(csv.DictReader(io.StringIO(payloads["samples.csv"].decode())))
        missing = next(r for r in records if r["sample_id"] == "2")
        self.assertEqual(missing["copper_mg_kg"], "")
        self.assertEqual(missing["copper_raw"], "N.S.")
        self.assertEqual(missing["depth_raw_cm"], "N.S.")

    def test_manifest_changes_cannot_reassign_or_relabel_samples(self):
        for key, value in [("source_sha256", "0" * 64), ("source_bytes", 1), ("split_longitude", 1), ("coordinate_system", "unknown"), ("state", "AL"), ("source_file_name", "/private/source.txt")]:
            with self.subTest(key=key):
                wrong = copy.deepcopy(self.selection)
                wrong[key] = value
                with self.assertRaises(soil.EvidenceError):
                    self.build(selection=wrong)
        for mutate in (lambda m: m["areas"].update(A=None), lambda m: m.update(areas=["A", "B"]), lambda m: m["areas"]["A"]["sample_ids"].append("5"), lambda m: m["areas"]["A"].update(record_count=1), lambda m: m["areas"]["B"]["sample_coordinate_bounds"].update(west=-1)):
            wrong = copy.deepcopy(self.selection)
            mutate(wrong)
            with self.assertRaises(soil.EvidenceError):
                self.build(selection=wrong)

    def test_both_areas_are_byte_deterministic_with_integrity_graph(self):
        for area in ("A", "B"):
            with self.subTest(area=area):
                first, second = self.build(area), self.build(area)
                self.assertEqual(first, second)
                checks = json.loads(first["validation.json"])
                self.assertEqual(set(checks["output_sha256"]), set(first) - {"validation.json"})
                for name, digest in checks["output_sha256"].items():
                    self.assertEqual(digest, hashlib.sha256(first[name]).hexdigest())
                graph = json.loads(first["provenance.json"])
                self.assertEqual(graph["source"]["sha256"], self.selection["source_sha256"])
                self.assertEqual(json.loads(first["assumptions.json"])["assumptions"], [])

    def test_existing_output_only_accepts_identical_managed_pack(self):
        payloads = self.build()
        with tempfile.TemporaryDirectory() as directory:
            output = Path(directory) / "site-a"
            self.assertEqual(soil.write_pack(output, payloads), "created")
            self.assertEqual(soil.write_pack(output, payloads), "unchanged")
            (output / "personal-notes.txt").write_text("keep me")
            with self.assertRaises(soil.EvidenceError):
                soil.write_pack(output, payloads)
            self.assertEqual((output / "personal-notes.txt").read_text(), "keep me")

    def test_changed_pack_and_symlink_are_not_overwritten(self):
        with tempfile.TemporaryDirectory() as directory:
            output = Path(directory) / "site-a"
            payloads = self.build()
            soil.write_pack(output, payloads)
            (output / "evidence.md").write_text("manual edit")
            with self.assertRaises(soil.EvidenceError):
                soil.write_pack(output, payloads)
            self.assertEqual((output / "evidence.md").read_text(), "manual edit")
            link = Path(directory) / "linked"
            link.symlink_to(output, target_is_directory=True)
            with self.assertRaises(soil.EvidenceError):
                soil.write_pack(link, payloads)


if __name__ == "__main__":
    unittest.main()
