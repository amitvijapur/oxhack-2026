"""Check the publisher's adapters and request against fixtures trimmed from real workstream outputs."""

import contextlib
import hashlib
import http.server
import io
import json
from pathlib import Path
import sys
import tempfile
import threading
import unittest

ROOT = Path(__file__).resolve().parents[1]
FIXTURES = ROOT / "tests/fixtures/publish"
sys.path.insert(0, str(ROOT / "scripts"))
import publish_adapters  # noqa: E402
import publish_run  # noqa: E402


class AdapterTests(unittest.TestCase):
    def test_land_summary_and_rows(self):
        payload, summary, rows = publish_adapters.land(FIXTURES / "land")
        self.assertEqual(summary["kind"], "land")
        self.assertEqual(summary["snapshotAt"], "2026-10-24")
        self.assertEqual(summary["activeClaimsInBox"], 706)
        self.assertEqual(summary["sites"]["A"]["insideActiveClaim"], 2)
        self.assertEqual(len(rows), 3)
        claim = next(r for r in rows if r["contractRecordId"] == "ADL 802461")
        self.assertEqual(claim["sampleKey"], "alaska_dggs_rdf2016_10:16MBW001:-200")
        self.assertEqual(claim["boundaryDistanceM"], 204)
        unmatched = next(r for r in rows if r["matchStatus"] == "no_record_in_checked_layers")
        # Empty CSV cells stay unknown rather than becoming zero distances.
        self.assertIsNone(unmatched["boundaryDistanceM"])
        self.assertIsNone(unmatched["contractRecordId"])
        self.assertEqual(len(payload["land_matches"]), 3)

    def test_land_requires_every_file(self):
        with tempfile.TemporaryDirectory() as empty:
            with self.assertRaisesRegex(ValueError, "missing"):
                publish_adapters.land(empty)

    def test_tok_decision_keeps_status_and_nulls(self):
        data = json.loads((FIXTURES / "decision-tok.json").read_text())
        _, summary, rows = publish_adapters.decision(data)
        self.assertIsNone(rows)
        [section] = summary["sections"]
        self.assertEqual((section["label"], section["action"], section["status"]), ("decision", "BUY", "manual_review"))
        self.assertAlmostEqual(section["pLoss"], data["outcomes"]["p_loss"])
        # The scored swarm runs have not finished, so the engine reports no swarm adjustment.
        self.assertFalse(section["swarmUsed"])
        self.assertEqual(len(section["fragile"]), 2)

    def test_nv_decision_sections_use_forecast_cells(self):
        data = json.loads((FIXTURES / "decision-nv.json").read_text())
        _, summary, _ = publish_adapters.decision(data)
        self.assertEqual([s["label"] for s in summary["sections"]], ["21 0310N 0330E 001", "21 0040N 0320E 016"])
        self.assertIsNone(summary["sections"][0]["worstOutcomeUsd"])
        self.assertIsNone(summary["sections"][0]["status"])

    def test_decision_rejects_non_records(self):
        for bad in ([], [1], "BUY"):
            with self.assertRaises(ValueError):
                publish_adapters.decision(bad)

    def test_swarm_summary(self):
        data = json.loads((FIXTURES / "swarm-results.json").read_text())
        _, summary, _ = publish_adapters.swarm(data)
        self.assertEqual(summary["checks"], {"placebo": "pass", "mirrors": "not run", "stability": "fail",
                                             "grounding": "pass, partly not run"})
        self.assertEqual((summary["runsJudged"], summary["runsTotal"]), (1, 2))
        self.assertEqual(summary["scenarios"], ["mine_approved"])
        self.assertEqual(summary["baselineCalls"]["price"], {"call": "up", "answers": 6})
        self.assertIsNone(summary["baselineCalls"]["policy"]["call"])

    def test_swarm_without_judged_baseline(self):
        _, summary, _ = publish_adapters.swarm({"runs": [{"scenario": "baseline", "status": "not run"}]})
        self.assertIsNone(summary["baselineCalls"])
        self.assertEqual(summary["checks"]["placebo"], None)

    def test_number_never_invents_values(self):
        for value in ("", "n/a", None, True, float("nan"), float("inf")):
            self.assertIsNone(publish_adapters.number(value))
        self.assertEqual(publish_adapters.number("160.000"), 160.0)


class BodyTests(unittest.TestCase):
    def test_body_fingerprints_payload_and_inputs(self):
        body = publish_run.build_body("land", str(FIXTURES / "land"))
        payload_sha = hashlib.sha256(body["payloadJson"].encode()).hexdigest()
        self.assertEqual(body["runId"], f"land-{payload_sha[:12]}")
        self.assertEqual(body["mode"], "measured")
        self.assertEqual([i["name"] for i in body["inputs"]],
                         ["tok_land_summary.json", "site-a/land_matches.csv", "site-b/land_matches.csv"])
        expected = hashlib.sha256((FIXTURES / "land/tok_land_summary.json").read_bytes()).hexdigest()
        self.assertEqual(body["inputs"][0]["sha256"], expected)
        # Rebuilding identical inputs gives the identical run, so re-publishing is a no-op.
        self.assertEqual(publish_run.build_body("land", str(FIXTURES / "land")), body)

    def test_non_finite_values_become_null(self):
        with tempfile.TemporaryDirectory() as tmp:
            path = Path(tmp) / "decision.json"
            path.write_text('{"action": "BUY", "value_usd": 5, "forgetting_sweep": [{"half_life_years": Infinity}]}')
            body = publish_run.build_body("decision", str(path))
        self.assertEqual(json.loads(body["payloadJson"])["forgetting_sweep"], [{"half_life_years": None}])

    def test_overrides_and_extra_inputs(self):
        body = publish_run.build_body("decision", str(FIXTURES / "decision-tok.json"), run_id="tok-demo-1",
                                      mode="evidence_only", extra_inputs=[str(FIXTURES / "decision-nv.json")])
        self.assertEqual((body["runId"], body["mode"]), ("tok-demo-1", "evidence_only"))
        self.assertEqual([i["name"] for i in body["inputs"]], ["decision-tok.json", "decision-nv.json"])
        self.assertNotIn("landMatches", body)

    def test_dry_run_prints_no_secret_or_payload(self):
        out = io.StringIO()
        with contextlib.redirect_stdout(out):
            self.assertEqual(publish_run.main(["land", str(FIXTURES / "land"), "--dry-run"]), 0)
        shown = json.loads(out.getvalue())
        self.assertNotIn("payloadJson", shown)
        self.assertEqual(shown["landMatches"], "3 rows")

    def test_env_file_parsing(self):
        with tempfile.TemporaryDirectory() as tmp:
            path = Path(tmp) / ".env.publish"
            path.write_text("# comment\nCONVEX_SITE_URL='https://x.convex.site'\nINGEST_SECRET_LAND=abc\n")
            self.assertEqual(publish_run.read_env_file(path),
                             {"CONVEX_SITE_URL": "https://x.convex.site", "INGEST_SECRET_LAND": "abc"})


class _Recorder(http.server.BaseHTTPRequestHandler):
    seen = []

    def do_POST(self):
        body = self.rfile.read(int(self.headers["Content-Length"]))
        type(self).seen.append((self.path, self.headers["Authorization"], json.loads(body)))
        status = 201 if self.headers["Authorization"] == "Bearer right" else 401
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.end_headers()
        self.wfile.write(json.dumps({"status": "created"} if status == 201 else {"error": "invalid publish secret"}).encode())

    def log_message(self, *args):
        pass


class PublishTests(unittest.TestCase):
    def setUp(self):
        _Recorder.seen = []
        self.server = http.server.HTTPServer(("127.0.0.1", 0), _Recorder)
        threading.Thread(target=self.server.serve_forever, daemon=True).start()
        self.url = f"http://127.0.0.1:{self.server.server_port}"

    def tearDown(self):
        self.server.shutdown()
        self.server.server_close()

    def test_posts_to_the_workstream_route_with_bearer(self):
        body = publish_run.build_body("swarm", str(FIXTURES / "swarm-results.json"))
        self.assertEqual(publish_run.publish("swarm", body, self.url, "right"), (201, {"status": "created"}))
        path, auth, sent = _Recorder.seen[0]
        self.assertEqual((path, auth), ("/ingest/swarm", "Bearer right"))
        self.assertEqual(sent, body)

    def test_reports_http_errors(self):
        body = publish_run.build_body("swarm", str(FIXTURES / "swarm-results.json"))
        self.assertEqual(publish_run.publish("swarm", body, self.url, "wrong"), (401, {"error": "invalid publish secret"}))


if __name__ == "__main__":
    unittest.main()
