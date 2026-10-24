"""Contract and pinned-source tests for the Tok evidence extractor."""
import csv
import hashlib
import importlib.util
import io
import json
from pathlib import Path
import tempfile
import unittest

ROOT = Path(__file__).resolve().parents[1]
SPEC = importlib.util.spec_from_file_location("gold_evidence", ROOT / "scripts/gold_evidence.py")
gold = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(gold)
RAW = ROOT / "data/raw/gold-feasibility/tok-river-2016/source/tables"
SOURCE = RAW / gold.SOURCE_NAME
LIMITS = RAW / gold.LIMITS_NAME
SELECTION = ROOT / "research/gold-site-selection.json"
CATALOG = ROOT / "research/gold-source-catalog.json"


def records(payload):
    return list(csv.DictReader(io.StringIO(payload.decode())))


class MeasurementTests(unittest.TestCase):
    def test_blank_censored_and_quantified_are_distinct(self):
        parse = gold.audit.parse_measurement
        self.assertEqual(parse("  ", .001, 1), {"raw": "  ", "status": "not_analyzed", "value_ppm": None, "bound_ppm": None})
        self.assertEqual(parse("-1", .001, 1)["bound_ppm"], .001)
        self.assertEqual(parse("-2", .001, 1), {"raw": "-2", "status": "above_detection", "value_ppm": None, "bound_ppm": 1})
        self.assertEqual(parse(" .013 ", .001, 1)["value_ppm"], .013)
        self.assertEqual(parse("1.1", .01, 100)["value_ppm"], 1.1)

    def test_unknown_and_out_of_range_values_rejected(self):
        for value in ("N.S.", "-3", "nan", "inf", "0", "1.1"):
            with self.subTest(value=value), self.assertRaises(ValueError):
                gold.audit.parse_measurement(value, .001, 1)

    def test_existing_output_is_protected(self):
        with tempfile.TemporaryDirectory() as temp:
            path = Path(temp) / "pack"
            self.assertEqual(gold.write_pack({"one.txt": b"original"}, path), "created")
            self.assertEqual(gold.write_pack({"one.txt": b"original"}, path), "unchanged")
            with self.assertRaises(ValueError):
                gold.write_pack({"one.txt": b"changed"}, path)
            (path / "unrelated.txt").write_text("keep")
            with self.assertRaises(ValueError):
                gold.write_pack({"one.txt": b"original"}, path)
            self.assertEqual((path / "one.txt").read_bytes(), b"original")
            self.assertEqual((path / "unrelated.txt").read_text(), "keep")

    def test_symlink_output_rejected(self):
        with tempfile.TemporaryDirectory() as temp:
            path = Path(temp) / "link"
            path.symlink_to(Path(temp) / "missing", target_is_directory=True)
            with self.assertRaises(ValueError):
                gold.write_pack({"one.txt": b"data"}, path)


@unittest.skipUnless(SOURCE.exists() and LIMITS.exists(), "Pinned DGGS raw CSV files absent; see source catalog acquisition instructions")
class PinnedSourceTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.packs = {area: gold.build_payloads(SOURCE, LIMITS, SELECTION, CATALOG, area) for area in "AB"}
        with SOURCE.open(newline="", encoding="utf-8-sig") as stream:
            cls.original = list(csv.DictReader(stream))

    def test_complete_disjoint_coverage_and_fixed_medians(self):
        ids = {}
        for area, count, au, li in (("A", 33, .013, 31.6), ("B", 34, .008, 21.0)):
            summary = json.loads(self.packs[area]["summary.json"])
            self.assertEqual(summary["record_count"], count)
            self.assertEqual(summary["methods"]["gold_primary"]["quantified_only"]["median_ppm"], au)
            self.assertEqual(summary["methods"]["lithium_secondary"]["quantified_only"]["median_ppm"], li)
            ids[area] = set(summary["sample_ids"])
        self.assertFalse(ids["A"] & ids["B"])
        self.assertEqual(ids["A"] | ids["B"], {row["SAMPLE"] for row in self.original if row["SIZE_FRACTION"].strip() == "-200"})
        a = json.loads(self.packs["A"]["summary.json"])["methods"]["gold_primary"]
        b = json.loads(self.packs["B"]["summary.json"])["methods"]["gold_primary"]
        self.assertEqual(a["counts"], {"quantified": 33, "below_detection": 0, "above_detection": 0, "not_analyzed": 0})
        self.assertEqual(b["counts"], {"quantified": 33, "below_detection": 0, "above_detection": 1, "not_analyzed": 0})

    def test_raw_source_records_and_identifiers_preserved(self):
        for area in "AB":
            raw = records(self.packs[area]["source_records.csv"])
            ids = {row["SAMPLE"] for row in raw}
            expected = [row for row in self.original if row["SAMPLE"] in ids and row["SIZE_FRACTION"].strip() == "-200"]
            self.assertEqual(raw, expected)
            self.assertEqual(len(raw[0]), 70)
            for row in records(self.packs[area]["samples.csv"]):
                original = self.original[int(row["source_csv_record_number"]) - 1]
                self.assertEqual(row["sample_id"], original["SAMPLE"])
                self.assertEqual(row["laboratory_sample_id"], original["LAB_SAMPLE_NUMBER"])
                self.assertEqual(row["batch_number_raw"], original["BATCH_NUMBER"])
                self.assertEqual(row["batch_number"], original["BATCH_NUMBER"].strip())
                self.assertEqual(row["longitude_raw"], original["LONGITUDE"])
                self.assertEqual(row["latitude_raw"], original["LATITUDE"])
                for prefix, field in (("gold_primary", "Au_ppm_PGM-MS23"), ("gold_retest", "Au_ppm_Au-AA25"), ("lithium_secondary", "Li_ppm_ME-MS61")):
                    self.assertEqual(row[prefix + "_raw"], original[field])

    def test_upper_censored_result_keeps_separate_retest(self):
        sample = next(row for row in records(self.packs["B"]["samples.csv"]) if row["sample_id"] == "16MBW012")
        self.assertEqual(sample["gold_primary_raw"], "-2")
        self.assertEqual(sample["gold_primary_status"], "above_detection")
        self.assertEqual(sample["gold_primary_value_ppm"], "")
        self.assertEqual(float(sample["gold_primary_bound_ppm"]), 1)
        self.assertEqual(float(sample["gold_retest_value_ppm"]), 1.1)
        self.assertEqual(sample["gold_retest_method"], "Au-AA25")
        for area in "AB":
            for row in records(self.packs[area]["samples.csv"]):
                if row["sample_id"] != "16MBW012":
                    self.assertEqual(row["gold_retest_status"], "not_analyzed")
                    self.assertEqual(row["gold_retest_value_ppm"], "")

    def test_geojson_axis_order_ids_and_nulls(self):
        for area in "AB":
            geo = json.loads(self.packs[area]["samples.geojson"])
            self.assertEqual(geo["type"], "FeatureCollection")
            original = {row["SAMPLE"]: row for row in self.original if row["SIZE_FRACTION"].strip() == "-200"}
            for feature in geo["features"]:
                row = original[feature["properties"]["sample_id"]]
                self.assertEqual(feature["geometry"], {"type": "Point", "coordinates": [float(row["LONGITUDE"]), float(row["LATITUDE"])]})
                self.assertEqual(feature["id"], f"alaska_dggs_rdf2016_10:{row['SAMPLE']}:-200")
                if row["SAMPLE"] == "16MBW012":
                    self.assertIsNone(feature["properties"]["gold_primary_value_ppm"])

    def test_no_fabricated_contract_fields(self):
        for area, count in (("A", 33), ("B", 34)):
            rows = records(self.packs[area]["land_match_template.csv"])
            self.assertEqual(len(rows), count)
            for row in rows:
                self.assertEqual(row["match_status"], "not_evaluated")
                self.assertEqual(row["coordinate_order"], "lon,lat")
                self.assertEqual((row["sample_accuracy_min_m"], row["sample_accuracy_max_m"]), ("1", "10"))
                self.assertEqual(row["sample_accuracy_scope"], "source_reported_range_not_per_point_confidence")
                self.assertTrue(all(row[field] == "" for field in gold.CONTRACT_FIELDS))

    def test_batch_summaries_and_denominators(self):
        import statistics
        for area in "AB":
            rows = records(self.packs[area]["source_records.csv"])
            summary = json.loads(self.packs[area]["summary.json"])
            for batch, count in summary["batches"].items():
                group = [row for row in rows if row["BATCH_NUMBER"].strip() == batch]
                values = [float(row["Au_ppm_PGM-MS23"]) for row in group if float(row["Au_ppm_PGM-MS23"]) >= 0]
                self.assertEqual(count, len(group))
                stats = summary["gold_primary_by_batch"][batch]["quantified_only"]
                self.assertEqual(stats["denominator"], len(values))
                self.assertEqual(stats["median_ppm"], statistics.median(values))

    def test_determinism_hashes_and_portability(self):
        for area in "AB":
            pack = self.packs[area]
            self.assertEqual(pack, gold.build_payloads(SOURCE, LIMITS, SELECTION, CATALOG, area))
            hashes = json.loads(pack["validation.json"])["output_sha256"]
            self.assertEqual(set(hashes), set(pack) - {"validation.json"})
            for name, sha in hashes.items():
                self.assertEqual(hashlib.sha256(pack[name]).hexdigest(), sha)
            self.assertNotIn(b"/Users/", b"".join(pack.values()))
            self.assertNotIn(b"/private/tmp/", b"".join(pack.values()))
            with tempfile.TemporaryDirectory() as temp:
                path = Path(temp) / "evidence"
                self.assertEqual(gold.write_pack(pack, path), "created")
                self.assertEqual(gold.write_pack(pack, path), "unchanged")
                (path / "samples.csv").write_text("tampered")
                with self.assertRaises(ValueError):
                    gold.write_pack(pack, path)

    def test_changed_inputs_rejected_before_output(self):
        with tempfile.TemporaryDirectory() as temp:
            temp = Path(temp)
            for original, argument in ((SOURCE, "source"), (LIMITS, "limits")):
                changed = temp / original.name
                changed.write_bytes(original.read_bytes() + b"\n")
                args = dict(source=SOURCE, limits=LIMITS, selection_path=SELECTION, catalog_path=CATALOG, area="A")
                args[argument] = changed
                with self.assertRaises(ValueError):
                    gold.build_payloads(**args)
            for kind, mutate in (
                ("selection", lambda doc: doc["areas"]["A"]["sample_ids"].pop()),
                ("selection", lambda doc: doc.update(split_longitude=-143)),
                ("selection", lambda doc: doc["areas"]["B"]["sample_coordinate_bounds"].update(west=-140)),
                ("catalog", lambda doc: doc["files"]["assays"].update(sha256="0" * 64)),
                ("catalog", lambda doc: doc["methods"]["gold_primary"].update(unit="ppb")),
                ("catalog", lambda doc: doc["urls"].update(publication="https://example.org")),
            ):
                with self.subTest(kind=kind):
                    doc = json.loads((SELECTION if kind == "selection" else CATALOG).read_text())
                    mutate(doc)
                    path = temp / (kind + ".json")
                    path.write_text(json.dumps(doc))
                    with self.assertRaises(ValueError):
                        gold.build_payloads(SOURCE, LIMITS, path if kind == "selection" else SELECTION,
                                            path if kind == "catalog" else CATALOG, "A")


if __name__ == "__main__":
    unittest.main()
