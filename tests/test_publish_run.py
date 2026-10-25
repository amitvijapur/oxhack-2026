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

    def test_canonical_assignment_uses_model_projection(self):
        data = json.loads((FIXTURES / "assignment-demo.json").read_text())
        payload, summary, rows = publish_adapters.decision(data)
        self.assertEqual(payload, data)
        self.assertIsNone(rows)
        self.assertEqual(summary["modelVersion"], "tok-option-demo-v2")
        self.assertEqual([row["days"] for row in summary["horizons"]], [30, 90, 180])
        self.assertEqual(summary["selected"]["mapped"]["entryAction"], "BUY_CANDIDATE")
        self.assertAlmostEqual(summary["selected"]["mapped"]["expectedNetCashUsd"], 7.6)
        self.assertAlmostEqual(summary["selected"]["mapped"]["negativeCashProbability"], 0.512)
        self.assertEqual(summary["provenance"]["economics"], "assumed")
        self.assertNotIn("sections", summary)
        forecast = summary["selected"]["mapped"]["goldForecast"]
        self.assertEqual(forecast["methodVersion"], "assumed-gold-response-v1")
        self.assertEqual(forecast["calibrationStatus"], "uncalibrated")
        self.assertEqual(forecast["baselinePriceUsdPerOz"], 2000)
        self.assertEqual(forecast["scenarioPriceUsdPerOz"], 2000)

    def test_pending_and_real_decisions_never_fill_missing_money(self):
        for name in ("assignment-pending.json", "assignment-real.json"):
            data = json.loads((FIXTURES / name).read_text())
            summary = publish_adapters.decision(data)[1]
            self.assertEqual(summary["selected"], {"baseline": None, "mapped": None})
            self.assertEqual(summary["readiness"]["economicsStatus"], "missing")
            self.assertIsNone(summary["provenance"]["economics"])

    def test_decision_rejects_legacy_or_incomplete_output(self):
        for bad in ([], [1], "BUY", {"action": "BUY", "value_usd": 8218.9}):
            with self.assertRaises(ValueError):
                publish_adapters.decision(bad)
        data = json.loads((FIXTURES / "assignment-pending.json").read_text())
        del data["selection"]
        with self.assertRaisesRegex(ValueError, "explicit area"):
            publish_adapters.decision(data)

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

    def test_non_finite_generic_diagnostics_become_null(self):
        with tempfile.TemporaryDirectory() as tmp:
            path = Path(tmp) / "swarm.json"
            path.write_text('{"runs": [], "diagnostic": Infinity}')
            body = publish_run.build_body("swarm", str(path))
        self.assertIsNone(json.loads(body["payloadJson"])["diagnostic"])

    def test_overrides_and_extra_inputs(self):
        body = publish_run.build_body("decision", str(FIXTURES / "assignment-demo.json"), run_id="tok-demo-1",
                                      mode="scenario", extra_inputs=[str(FIXTURES / "assignment-pending.json")])
        self.assertEqual((body["runId"], body["mode"]), ("tok-demo-1", "scenario"))
        self.assertEqual([i["name"] for i in body["inputs"]], ["assignment-demo.json", "assignment-pending.json"])
        self.assertEqual(body["producer"]["script"], "model/tok-option/export.mjs")
        self.assertNotIn("landMatches", body)

    def test_model_mode_determines_honest_publish_label(self):
        for name in ("assignment-pending.json", "assignment-real.json"):
            self.assertEqual(publish_run.build_body("decision", str(FIXTURES / name))["mode"], "evidence_only")
        with self.assertRaisesRegex(ValueError, "must use mode scenario"):
            publish_run.build_body("decision", str(FIXTURES / "assignment-demo.json"), mode="empirical")

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
