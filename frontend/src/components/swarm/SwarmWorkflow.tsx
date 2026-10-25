"use client";

import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Check, CirclePause, FileText, FlaskConical, Gem, GitBranch, Landmark, LockKeyhole, Newspaper, Play, RotateCcw, Settings2, TrendingUp, Wallet, X } from "lucide-react";
import type { WorkflowData, WorkflowGroup, WorkflowRun } from "@/lib/swarm-workflow.mjs";
import { algorithmSnapshot, getAlgorithmFrame } from "@/lib/algorithm-workflow.mjs";
import "./workflow.css";
import { SITE_NAME, SITE_PLACE } from "@/lib/copy.js";
import { FeeSensitivity } from "@/FeeSensitivity.jsx";
import { ContractLotBasis } from "@/ContractLotBasis.jsx";
import { requiredAssignmentProceeds } from "../../../../model/tok-option/diagnostics.mjs";

export type { WorkflowData } from "@/lib/swarm-workflow.mjs";
type NodeKind = "input" | "society" | "score" | "delta" | "baseline" | "signal" | "gate" | "response" | "price" | "quantity" | "goldValue" | "economics" | "success" | "model" | "cash" | "decision" | "land" | "liquidity" | "terms" | "study";
type GraphNode = { id: string; x: number; y: number; kind: NodeKind; label: string; value: string; ready: boolean; calculated?: boolean; negative?: boolean; group?: WorkflowGroup };
type GraphEdge = { from: string; to: string; groupId?: string; pulse: boolean; phase: number; assumed?: boolean; blocked?: boolean };
const ROWS = [140, 225, 310, 395, 480];
const COLUMNS = [70, 210, 350, 490, 640, 820, 1010];
const STAGES = ["Inputs", "Stakeholders", "Support scores", "Matched contrast", "Swarm signal", "Gold forecast", "Option valuation"];
const numeric = (value: number | null | undefined, digits = 2) => value === null || value === undefined || !Number.isFinite(value) ? "—" : value.toLocaleString("en-GB", { minimumFractionDigits: digits, maximumFractionDigits: digits });
const signed = (value: number | null | undefined, digits = 3) => value === null || value === undefined ? "—" : `${value > 0 ? "+" : ""}${numeric(value, digits)}`;
const money = (value: number | null | undefined, digits = 2) => value === null || value === undefined ? "—" : `$${numeric(value, digits)}`;
const percent = (value: number | null | undefined, digits = 2) => value === null || value === undefined ? "—" : `${numeric(value * 100, digits)}%`;
const subscribeMotion = (change: () => void) => { const query = window.matchMedia("(prefers-reduced-motion: reduce)"); query.addEventListener("change", change); return () => query.removeEventListener("change", change); };
const motionSnapshot = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const serverMotionSnapshot = () => true;
const reading = (run: WorkflowRun | undefined, day: number, groupId: string) => run?.days.find((d) => d.day === day)?.groups.find((g) => g.id === groupId);
const pathBetween = (from: GraphNode, to: GraphNode) => {
  if (from.x === to.x) { const direction = to.y > from.y ? 1 : -1; return `M ${from.x} ${from.y + 31 * direction} C ${from.x} ${from.y + 90 * direction}, ${to.x} ${to.y - 90 * direction}, ${to.x} ${to.y - 31 * direction}`; }
  const direction = to.x > from.x ? 1 : -1;
  return `M ${from.x + 29 * direction} ${from.y} C ${from.x + 85 * direction} ${from.y}, ${to.x - 85 * direction} ${to.y}, ${to.x - 33 * direction} ${to.y}`;
};

function NodeSymbol({ node }: { node: GraphNode }) {
  const icon = { x: -10, y: -10, width: 20, height: 20, strokeWidth: 1.5 };
  if (node.kind === "input") return node.id === "input-context" ? <FileText {...icon} /> : node.id === "input-news" ? <Newspaper {...icon} /> : <Settings2 {...icon} />;
  if (node.kind === "gate" || node.kind === "study") return <FlaskConical {...icon} />;
  if (node.kind === "price" || node.kind === "response") return <TrendingUp {...icon} />;
  if (node.kind === "quantity" || node.kind === "goldValue") return <Gem {...icon} />;
  if (node.kind === "decision") return <GitBranch {...icon} />;
  if (node.kind === "cash" || node.kind === "liquidity") return <Wallet {...icon} />;
  if (node.kind === "land") return <Landmark {...icon} />;
  if (node.kind === "economics" || node.kind === "terms") return <Settings2 {...icon} />;
  if (node.kind === "model" || node.kind === "success") return <ArrowRight {...icon} />;
  if (node.kind === "signal") return <text className="swf-node-value" textAnchor="middle" dy="5">Σ</text>;
  return <text className="swf-node-value" textAnchor="middle" dy="4">{node.value}</text>;
}

export function SwarmWorkflow({ data }: { data: WorkflowData }) {
  const initial = data.runs.find((r) => r.available && r.scenario === "mine_approval") ?? data.runs.find((r) => r.available) ?? data.runs[0];
  const [runId, setRunId] = useState(initial.id);
  const [area, setArea] = useState<"A" | "B">("A");
  const [horizonDays, setHorizonDays] = useState<30 | 90 | 180>(90);
  const [day, setDay] = useState(5);
  const [playing, setPlaying] = useState(false);
  const [validationOpen, setValidationOpen] = useState(false);
  const validationButton = useRef<HTMLButtonElement>(null);
  const [speed, setSpeed] = useState(1);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const reducedMotion = useSyncExternalStore(subscribeMotion, motionSnapshot, serverMotionSnapshot);
  const run = data.runs.find((r) => r.id === runId) ?? initial;
  const frame = useMemo(() => {
    const value = getAlgorithmFrame(algorithmSnapshot, { area, scenarioId: run.scenario, horizonDays });
    if (!value.controls || !value.evidence || !value.signal || !value.source) throw new Error("The canonical algorithm snapshot is incomplete.");
    return { ...value, controls: value.controls, evidence: value.evidence, signal: value.signal, source: value.source };
  }, [area, run.scenario, horizonDays]);
  const result = day === 5 ? (frame.mapped ?? (run.scenario === "baseline" ? frame.baseline : null)) : null;
  const signal = day === 5 ? frame.signal.value : null;
  const reference = data.runs.find((r) => r.id === frame.signal.referenceRunId);
  const contrast = frame.signal.groups;
  const activeReplay = playing && run.available && !reducedMotion;
  const nodeRefs = useRef(new Map<string, SVGGElement | HTMLButtonElement>());

  useEffect(() => {
    if (!activeReplay) return;
    const timer = window.setTimeout(() => setDay((value) => value === 5 ? 1 : value + 1), 2400 / speed);
    return () => window.clearTimeout(timer);
  }, [activeReplay, day, speed]);
  useEffect(() => {
    if (!selectedId && !validationOpen) return;
    const onKey = (event: KeyboardEvent) => { if (event.key === "Escape") { if (selectedId) { setSelectedId(null); nodeRefs.current.get(selectedId)?.focus(); } else { setValidationOpen(false); validationButton.current?.focus(); } } };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selectedId, validationOpen]);

  const complete = run.available && day === 5;
  const calculationReady = complete && result !== null;
  const inputs = frame.controls;
  const forecast = result?.goldForecast;
  const noSale = result ? (frame.cashDiagnostics.mapped ?? frame.cashDiagnostics.baseline)?.outcomes.find((row) => row.kind === "no_sale") : null;
  const assignmentTarget = requiredAssignmentProceeds(result, { targetReturnRatio: 0.25 });
  const researchStatus = frame.signal.researchReadiness?.status ?? "unknown";
  const noEventReference = run.scenario === "baseline";
  const researchPassed = !noEventReference && ["pass", "ready"].includes(researchStatus);
  const researchFailed = !noEventReference && ["fail", "failed"].includes(researchStatus);
  const validationLabel = noEventReference ? "No-event reference" : researchPassed ? "Checks passed" : researchFailed ? "Checks failed" : "Not evaluated";
  const study = algorithmSnapshot.validationStudy;
  const eventMae = study?.metrics.eventMaePp;
  const goldMae = study?.metrics.goldOnlyMaePp;
  const studyCompared = typeof eventMae === "number" && typeof goldMae === "number";
  const studyImproved = studyCompared && eventMae < goldMae;
  const studyWorse = studyCompared && eventMae > goldMae;
  const studyLabel = !studyCompared ? "Not evaluated" : studyImproved ? "Beat baseline" : studyWorse ? "Below baseline" : "Matched baseline";
  const returnRatio = result && typeof result.expectedNetCashUsd === "number" && typeof result.amountAtRiskUsd === "number" && result.amountAtRiskUsd > 0 ? result.expectedNetCashUsd / result.amountAtRiskUsd : null;
  const actionLabel = result?.entryAction === "BUY_CANDIDATE" ? "Conditional candidate" : result?.entryAction === "SKIP" ? "Skip" : day < 5 && run.available ? "Waiting for replay" : "Unavailable";
  const nodes: GraphNode[] = [
    { id: "input-context", x: 70, y: 190, kind: "input", label: "Context", value: data.source.commit?.slice(0, 8) ?? "Unknown", ready: true },
    { id: "input-news", x: 70, y: 310, kind: "input", label: run.scenario !== "baseline" && day >= 3 ? "Scenario news" : "Common news", value: run.scenario !== "baseline" && day >= 3 ? "Day 3" : "Day 1", ready: true },
    { id: "input-settings", x: 70, y: 430, kind: "input", label: "Run settings", value: `Seed ${run.seed}`, ready: true },
    ...data.groups.map((group, i): GraphNode => ({ id: `society-${group.id}`, x: 210, y: ROWS[i], kind: "society", label: group.label, value: String(group.agents), ready: run.available, group })),
    ...data.groups.map((group, i): GraphNode => ({ id: `score-${group.id}`, x: 350, y: ROWS[i], kind: "score", label: group.label, value: numeric(reading(run, day, group.id)?.mean), ready: typeof reading(run, day, group.id)?.mean === "number", group })),
    ...data.groups.map((group, i): GraphNode => ({ id: `delta-${group.id}`, x: 490, y: ROWS[i], kind: "delta", label: group.label, value: complete ? signed(contrast.find((g) => g.group === group.id)?.delta) : "—", ready: complete && typeof contrast.find((g) => g.group === group.id)?.delta === "number", group })),
    { id: "matched-baseline", x: 350, y: 595, kind: "baseline", label: reference ? "Matched placebo" : "No matched contrast", value: reference ? `S${reference.seed}` : "—", ready: Boolean(reference?.available) },
    { id: "weighted-signal", x: 640, y: 310, kind: "signal", label: run.scenario === "baseline" ? "No-event baseline" : "Weighted signal", value: signed(signal, 4), ready: signal !== null && complete },
    { id: "baseline-price", x: 820, y: 135, kind: "price", label: "Price assumption", value: money(result ? inputs.price : null, 0), ready: calculationReady, calculated: true },
    { id: "gold-price", x: 820, y: 310, kind: "price", label: "Gold forecast / oz", value: money(forecast?.scenarioPriceUsdPerOz), ready: calculationReady, calculated: true },
    { id: "gold-estimate", x: 1010, y: 135, kind: "quantity", label: "Assumed quantity", value: `${numeric(inputs.quantity, 1)} oz`, ready: true, calculated: true },
    { id: "model-output", x: 1010, y: 310, kind: "model", label: "Option assignment", value: money(result?.assignmentValueUsd), ready: calculationReady, calculated: true },
    { id: "economic-inputs", x: 1010, y: 545, kind: "economics", label: "Option assumptions", value: "Ownership, terms & costs", ready: true, calculated: true },
  ];
  const edges: GraphEdge[] = [];
  data.groups.forEach((group, i) => {
    ["input-context", "input-news", "input-settings"].forEach((input, j) => edges.push({ from: input, to: `society-${group.id}`, groupId: group.id, pulse: run.available, phase: (i * .17) + (j * .3) }));
    edges.push({ from: `society-${group.id}`, to: `score-${group.id}`, groupId: group.id, pulse: run.available, phase: 1 + (i * .17) });
    edges.push({ from: `score-${group.id}`, to: `delta-${group.id}`, groupId: group.id, pulse: complete && contrast.length > 0, phase: 2 + (i * .17) });
    edges.push({ from: "matched-baseline", to: `delta-${group.id}`, groupId: group.id, pulse: complete && Boolean(reference), phase: 2.3 + (i * .17) });
    edges.push({ from: `delta-${group.id}`, to: "weighted-signal", groupId: group.id, pulse: complete && contrast.length > 0, phase: 3 + (i * .17) });
  });
  for (const [from, to] of [["weighted-signal", "gold-price"], ["baseline-price", "gold-price"], ["gold-price", "model-output"], ["gold-estimate", "model-output"], ["economic-inputs", "model-output"]]) edges.push({ from, to, pulse: calculationReady, phase: 4, assumed: true });

  const outputNode: GraphNode = { id: "decision-output", x: 0, y: 0, kind: "decision", label: "Model output", value: actionLabel, ready: calculationReady, calculated: true };
  const selected = selectedId === "decision-output" ? outputNode : nodes.find((node) => node.id === selectedId);
  const active = nodes.find((node) => node.id === (hoveredId ?? selectedId));
  const related = (edge: GraphEdge) => active ? edge.from === active.id || edge.to === active.id || Boolean(active.group && edge.groupId === active.group.id) : false;
  const closeInspector = () => { const id = selectedId; setSelectedId(null); if (id) nodeRefs.current.get(id)?.focus(); };
  const selectedReading = selected?.group ? reading(run, day, selected.group.id) : null;
  const selectedDelta = selected?.group ? contrast.find((g) => g.group === selected.group?.id) : null;
  const waitPayload = { state: "WAITING_REPLAY_WINDOW", simulatedDay: day, requiredDays: [3, 4, 5] };
  const calculationPayload = result ? { provenance: "Hypothetical canonical calculation snapshot", modelCommit: frame.source.commit, modelVersion: frame.source.modelVersion, horizonDays } : !run.available || day === 5 ? { state: "UNAVAILABLE", reasons: frame.reasons } : waitPayload;
  let payload: unknown = calculationPayload;
  let explanation = "";
  if (selected) {
    if (selected.kind === "input") { payload = { source: data.source.id, commit: data.source.commit, scenario: run.scenario, seed: run.seed, inputCutoff: data.source.knowledgeCutoff }; explanation = selected.id === "input-news" ? run.scenario === "baseline" ? "The baseline receives common hypothetical gold news on day 1, with no additional day-3 event." : "Common hypothetical gold news appears on day 1. The scenario event enters on day 3." : selected.id === "input-settings" ? "Five simulated days are replayed from recorded summaries. Replay speed does not change the holding horizon." : "Pinned simulation context. The exact input knowledge cutoff remains unknown."; }
    else if (selected.kind === "society") { payload = { group: selected.group?.id, fictionalRoles: selected.group?.agents, policyWeight: selected.group?.weight }; explanation = "Role counts and financial weights are separate assumptions."; }
    else if (selected.kind === "score") payload = { group: selected.group?.id, day, meanSupport: selectedReading?.mean ?? null, numericScores: selectedReading?.count ?? null };
    else if (selected.kind === "delta") { payload = complete ? { referenceRunId: frame.signal.referenceRunId, scenarioRunId: frame.signal.scenarioRunId, window: [3, 4, 5], ...selectedDelta } : waitPayload; explanation = "Equal means of days 3–5 are compared with the matching Claude sports-placebo run. This is a descriptive contrast, not a validated news effect."; }
    else if (selected.kind === "baseline") { payload = { run: reference?.id ?? null, provider: reference?.configuration?.provider, model: reference?.configuration?.model, noEventBaseline: run.scenario === "baseline" }; explanation = reference ? "Approval and blockage are paired with the matching Claude placebo configuration. The older OpenAI baseline is not used for these financial contrasts." : "No matched illustrative contrast is available for this selected run. A no-event baseline calculation uses a zero signal by definition."; }
    else if (selected.kind === "signal") { payload = complete ? frame.signal : waitPayload; explanation = "Group contrasts are normalized by 10, weighted by the policy weights and summed. The weights are assumed. A baseline zero is a no-event assumption."; }
    else if (selected.kind === "gate") { payload = { status: noEventReference ? "baseline_reference" : researchStatus, calculationAvailable: frame.available, strictSourceReady: data.monetaryReady, inputCutoff: data.source.knowledgeCutoff, researchReadiness: frame.signal.researchReadiness, checks: data.checks }; explanation = noEventReference ? "A no-event baseline uses a zero signal by definition. It is a reference calculation, not a passed prediction test. The hypothetical calculator remains available." : "The calculator can run while validation remains incomplete. Current simulation checks include an unknown information cutoff and failed configuration, interview and grounding checks. Completing the code does not establish predictive accuracy. The hypothetical gold response remains an assumption."; }
    else if (selected.kind === "study") { payload = study ?? { status: "unavailable" }; explanation = study ? `This separate retrospective pilot tests ${study.target.toLowerCase()} over ${study.primaryHorizonSessions ?? "unknown"} trading sessions. ${studyWorse ? "The gold-plus-event model had higher held-out error than the gold-only baseline." : "The comparison measures held-out error against a gold-only baseline."} It does not validate the fictional swarm or Tok option returns.` : "No historical event-test result is included in this snapshot."; }
    else if (selected.kind === "quantity") { payload = { quantity: inputs.quantity, unit: "troy_oz", provenance: "assumed", derivedFromPpm: false, swarmChangesQuantity: false }; explanation = "A synthetic quantity input, scaled once from the earlier invented example. Sediment ppm and historical signing payments do not establish recoverable ounces. Editing the premium does not rescale quantity or buyer consideration; the swarm never changes quantity."; }
    else if (selected.id === "baseline-price") { payload = result ? { ...calculationPayload, inputPrice: inputs.price, annualGrowthRate: inputs.annualGrowthRate, baselinePriceUsdPerOz: forecast?.baselinePriceUsdPerOz } : calculationPayload; explanation = "Baseline price × (1 + annual growth)^(holding days / 365). The current fixture assumes zero growth and does not use the live ticker."; }
    else if (selected.kind === "response") { payload = result ? { ...calculationPayload, signal: frame.signal.value, cap: inputs.goldResponseCap, exposure: inputs.eventExposure, retention: inputs.retention, adjustment: forecast?.adjustment, calibrationStatus: forecast?.calibrationStatus } : calculationPayload; explanation = "Assumed relative gold response = signal × response cap × exposure × retention. The default cap is 7%. This relationship is uncalibrated."; }
    else if (selected.kind === "price") { payload = result ? { ...calculationPayload, ...forecast } : calculationPayload; explanation = "The relative response changes gold price once: baseline price × (1 + response). It is applied at each modeled valuation and sale date, not as a second option markup."; }
    else if (selected.kind === "goldValue") { payload = result ? { ...calculationPayload, materialTrace: result.materialTrace, rawMaterialValueUsd: result.rawMaterialValueUsd } : calculationPayload; explanation = "Assumed gold quantity × scenario gold price. This is gross material value, before ownership, economic conversion or remaining buyer consideration."; }
    else if (selected.kind === "economics") { payload = { unit: "whole_contract", ownershipFraction: inputs.ownershipFraction, kappa: inputs.kappa, pGeo: inputs.pGeo, remainingBuyerConsiderationUsd: inputs.remainingBuyerConsiderationUsd, entryPremiumUsd: inputs.entryPremiumUsd, entryFeeUsd: inputs.entryFeeUsd, unavoidableAdditionalObligationsUsd: inputs.unavoidableAdditionalObligationsUsd, exitFeeUsd: inputs.exitFeeUsd, hazardPer30Days: inputs.hazardPer30Days, provenance: "assumed" }; explanation = "Ownership, economic conversion and geological probability set the assignment value. USD costs cover one whole contract. The initial-payment reference uses selected historical contracts, not a current quote. The larger exposure and buyer consideration come from a separately scaled invented example; historical obligations are separate. The assumed monthly sale hazard sets expected cash."; }
    else if (selected.kind === "success") { payload = result ? { ...calculationPayload, rawMaterialValueUsd: result.rawMaterialValueUsd, ownershipFraction: inputs.ownershipFraction, kappa: inputs.kappa, successValueUsd: result.successValueUsd } : calculationPayload; explanation = "Success value = gross material value × ownership fraction × economic conversion."; }
    else if (selected.kind === "model") { payload = result ? { ...result, ...calculationPayload, expectedReturnRatio: returnRatio, expectedReturnPercent: returnRatio === null ? null : returnRatio * 100, returnDenominatorUsd: result.amountAtRiskUsd } : calculationPayload; explanation = "Projected gold price × assumed quantity produces gross material value. Ownership and economic conversion produce success value. Assignment value = geological probability × max(success value − remaining buyer consideration, 0). The swarm changes Au price once; it does not change quantity or add a second option markup."; }
    else if (selected.kind === "cash") { payload = result ? { ...calculationPayload, expectedNetCashUsd: result.expectedNetCashUsd, saleProbability: result.saleProbability, noSaleProbability: result.noSaleProbability, amountAtRiskUsd: result.amountAtRiskUsd, intervals: result.intervals, diagnostics: frame.cashDiagnostics.mapped ?? frame.cashDiagnostics.baseline } : calculationPayload; explanation = "Monthly sale probabilities weight the assignment proceeds at each sale date. Fees, premium and upfront obligations are deducted. An unsold option pays zero sale proceeds; its mark is not cash."; }
    else if (selected.kind === "land") { payload = frame.evidence; explanation = "Observed sediment evidence controls eligibility. The threshold profile is separate from hypothetical quantity and geological probability. Passing this gate does not establish a deposit or available contract."; }
    else if (selected.kind === "liquidity") { payload = { hazardPer30Days: inputs.hazardPer30Days, provenance: "assumed", saleProbability: result?.saleProbability ?? null, noSaleProbability: result?.noSaleProbability ?? null, horizonDays }; explanation = "The assumed monthly sale hazard controls sale and no-sale probabilities. It is a separate input, not inferred from stakeholder support."; }
    else if (selected.kind === "terms") { payload = { candidate: frame.candidate, controls: inputs, provenance: "assumed" }; explanation = "Hypothetical assignment permission, remaining consideration, fees, expiry and capped obligations feed valuation, cash and eligibility. The model does not exercise an option."; }
    else if (selected.kind === "decision") { payload = result ? { ...result, ...calculationPayload, expectedReturnRatio: returnRatio, expectedReturnPercent: returnRatio === null ? null : returnRatio * 100, returnDenominatorUsd: result.amountAtRiskUsd, evidence: frame.evidence, portfolio: frame.portfolio, cashDiagnostics: frame.cashDiagnostics.mapped ?? frame.cashDiagnostics.baseline } : calculationPayload; explanation = "Expected option return is expected net cash divided by upfront amount at risk, including premium, entry fees and unavoidable upfront obligations. Sale and no-sale cases remain in the cash calculation. The model's entry action also checks evidence, contract terms, expiry and risk. This is a hypothetical output, not an executable trade."; }
  }

  return <main className="swf-page" data-playing={activeReplay || undefined} data-testid="swarm-workflow">
    <header className="swf-header"><Link className="swf-brand" href="/">{SITE_NAME} <span>{SITE_PLACE}</span></Link><Link href="/" className="swf-return"><ArrowLeft size={15} /> Back to explorer</Link></header>
    <div className="swf-topline"><h1>Swarm workflow</h1><div className="swf-statusline"><span className="swf-recorded"><i /> Recorded replay</span><span className="swf-hypothetical">Hypothetical calculation</span><span className="swf-mono">Model {frame.source.commit.slice(0, 8)}</span></div></div>
    <div className="swf-calculation-controls"><label>Evidence area<select aria-label="Evidence area" value={area} onChange={(e) => setArea(e.target.value as "A" | "B")}><option value="A">A · Tok west</option><option value="B">B · Tok east</option></select></label><label>Holding horizon<select aria-label="Holding horizon" value={horizonDays} onChange={(e) => setHorizonDays(Number(e.target.value) as 30 | 90 | 180)}><option value={30}>30 days</option><option value={90}>90 days</option><option value={180}>180 days</option></select></label><span>{day < 5 ? "Calculation appears after the five-day replay" : frame.available ? "Pinned calculation snapshot · assumed economics" : "No illustrative mapping for this scenario"}</span></div>
    <section className="swf-visual-area swf-workspace" aria-label="Recorded workflow and model output">
      <div className="swf-graph-frame">
        <div className="swf-network-scroll" tabIndex={0} role="region" aria-label="Workflow network, scroll horizontally to explore all layers" data-testid="workflow-network"><div className="swf-network-canvas"><svg viewBox="0 0 1120 700" className="swf-network" aria-label="Recorded scores merge into a weighted signal, then a gold forecast and option valuation before the model output">
          <defs><marker id="swf-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M 1 1 L 9 5 L 1 9" fill="none" stroke="#8a8a8a" strokeWidth="1.5" /></marker></defs>
          <g className="swf-layer-labels">{STAGES.map((label, i) => <text key={label} x={COLUMNS[i]} y="48" textAnchor="middle">{label}</text>)}</g>
          <g className="swf-edges" aria-hidden="true">{edges.map((edge, i) => { const path = pathBetween(nodes.find((n) => n.id === edge.from)!, nodes.find((n) => n.id === edge.to)!); return <g key={`${edge.from}-${edge.to}`} className={`${related(edge) ? "is-related " : ""}${edge.assumed ? "is-assumed" : ""}`} data-from={edge.from} data-to={edge.to} data-assumed={edge.assumed || undefined}><path d={path} className="swf-edge" markerEnd={edge.assumed ? "url(#swf-arrow)" : undefined} />{activeReplay && edge.pulse ? <circle r="2.5" className="swf-pulse" data-testid="workflow-pulse" data-from={edge.from} data-to={edge.to}><animateMotion path={path} dur={`${4 / speed}s`} begin={`${-edge.phase / speed}s`} repeatCount="indefinite" key={`${i}-${speed}`} /></circle> : null}</g>; })}<g className="is-assumed" data-from="model-output" data-to="decision-output"><path d="M 1040 310 L 1100 310" className="swf-edge" markerEnd="url(#swf-arrow)" /></g></g>
          <g className="swf-nodes">{nodes.map((node) => <g key={node.id} id={`swarm-node-${node.id}`} ref={(element) => { if (element) nodeRefs.current.set(node.id, element); else nodeRefs.current.delete(node.id); }} transform={`translate(${node.x} ${node.y})`} role="button" tabIndex={0} aria-label={`${node.label}${node.kind === "score" ? ` support ${node.value} out of 10` : node.kind === "delta" ? ` matched delta ${node.value}` : node.kind === "society" ? `, ${node.value} fictional roles` : `, ${node.value}`}. Inspect node`} aria-pressed={selectedId === node.id} className={`swf-node is-${node.kind}${node.ready ? " is-ready" : ""}${node.calculated ? " is-calculated" : ""}${selectedId === node.id ? " is-selected" : ""}${hoveredId === node.id ? " is-hovered" : ""}`} data-testid="workflow-node" data-node-id={node.id} data-ready={node.ready} data-calculated={node.calculated || undefined} onMouseEnter={() => setHoveredId(node.id)} onMouseLeave={() => setHoveredId(null)} onFocus={(event) => { setHoveredId(node.id); event.currentTarget.scrollIntoView({ block: "nearest", inline: "nearest", behavior: "auto" }); }} onBlur={() => setHoveredId(null)} onClick={() => setSelectedId(node.id)} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); setSelectedId(node.id); } }}><circle r={node.kind === "signal" || node.kind === "model" || node.id === "gold-price" ? 32 : 27} className="swf-node-disc" /><NodeSymbol node={node} />{node.kind !== "score" && node.kind !== "delta" ? <text className="swf-node-label" y="46" textAnchor="middle">{node.label}</text> : null}{!["society", "score", "delta"].includes(node.kind) ? <text className="swf-node-subvalue" y="65" textAnchor="middle">{node.value}</text> : null}</g>)}</g>
        </svg></div></div>
        {!run.available ? <div className="swf-no-run" role="status"><LockKeyhole size={15} /><span>No scored output for {run.label}</span></div> : null}
        <div className="swf-graph-caption"><span>Recorded summaries · dashed links use assumed economics</span><span className="swf-pan-hint">Scroll to explore <ArrowRight size={12} /></span></div>
    {selected ? <aside className="swf-node-inspector" aria-label="Selected workflow node" data-testid="workflow-inspector"><div className="swf-inspector-head"><div><h2>{selected.label}</h2><p>{selected.kind === "society" ? "Fictional stakeholder group" : selected.kind === "score" ? `Mining support · simulated day ${day}` : selected.kind === "delta" ? "Days 3–5 · matched placebo" : selected.kind === "study" ? "Separate historical validation" : selected.kind === "gate" ? "Validation status · calculator available" : selected.calculated ? `Hypothetical calculation · ${horizonDays} days` : "Recorded workflow"}</p></div><button type="button" className="swf-icon-button" aria-label="Close node details" data-testid="workflow-inspector-close" onClick={closeInspector}><X size={17} /></button></div>{selected.kind === "society" ? <dl><div><dt>Roles</dt><dd>{selected.group?.agents}</dd></div><div><dt>Policy weight</dt><dd>{percent(selected.group?.weight, 0)}</dd></div></dl> : null}{selected.kind === "score" ? <dl><div><dt>Support</dt><dd>{selected.value} / 10</dd></div><div><dt>Numeric scores</dt><dd>{numeric(selectedReading?.count, 0)}</dd></div></dl> : null}{selected.kind === "delta" ? <dl><div><dt>Scenario mean</dt><dd>{complete ? numeric(selectedDelta?.scenarioMean) : "—"}</dd></div><div><dt>Reference mean</dt><dd>{complete ? numeric(selectedDelta?.baselineMean) : "—"}</dd></div><div><dt>Normalized delta</dt><dd>{selected.value}</dd></div></dl> : null}{explanation ? <p>{explanation}</p> : null}{selected.kind === "study" && study ? <dl><div><dt>Held-out / training events</dt><dd>{study.heldOutEvents ?? "—"} / {study.trainEvents ?? "—"}</dd></div><div><dt>Gold-only MAE</dt><dd>{numeric(study.metrics.goldOnlyMaePp)} pp</dd></div><div><dt>Gold + event MAE</dt><dd>{numeric(study.metrics.eventMaePp)} pp</dd></div><div><dt>No-change MAE</dt><dd>{numeric(study.metrics.noChangeMaePp)} pp</dd></div></dl> : null}{selected.kind === "gate" ? <details className="swf-check-details"><summary>Validation checks ({data.checks.length})</summary><div>{data.checks.map((check) => <div key={check.id} className={`swf-check is-${check.status}`}><span>{check.status === "pass" ? <Check size={12} /> : check.status === "fail" ? <X size={12} /> : "?"}</span><span>{check.label}</span><span>{check.status === "pass" ? "Passed" : check.status === "fail" ? "Failed" : "Unknown"}</span></div>)}</div></details> : null}<details className="swf-payload-details"><summary>Inspect payload</summary><pre tabIndex={0}>{JSON.stringify(payload, null, 2)}</pre></details></aside> : null}
      </div>
      <aside className="swf-result" data-testid="model-result" aria-label="Hypothetical model output">
        <div className="swf-result-heading"><h2>Model output</h2><span>{horizonDays}-day projection</span></div>
        <div className="swf-result-return"><span>Expected option return</span><strong className={`swf-mono${returnRatio !== null && returnRatio < 0 ? " is-loss" : ""}`} data-testid="expected-option-return">{percent(returnRatio)}</strong><p>{result ? <>Synthetic {numeric(inputs.quantity, 1)} oz exposure; {money(result.amountAtRiskUsd, 0)} upfront capital per whole contract.</> : day < 5 && run.available ? "Complete the five-day replay to reveal the calculation." : "No calculated output is supplied for this scenario."}</p>{result && noSale ? <p data-testid="workflow-no-sale-risk">{percent(result.noSaleProbability, 1)} no sale · {money(noSale.netCashUsd, 0)} cash if unsold by day {horizonDays}</p> : null}</div>
        <dl className="swf-result-facts"><div><dt>Gold forecast / oz</dt><dd>{money(forecast?.scenarioPriceUsdPerOz)}</dd></div><div><dt>Option assignment</dt><dd>{money(result?.assignmentValueUsd)}</dd></div><div><dt>Expected net cash</dt><dd>{money(result?.expectedNetCashUsd)}</dd></div></dl>
        <div className={`swf-result-action${result?.entryAction === "SKIP" ? " is-skip" : ""}`}><span>Model decision</span><strong>{actionLabel}</strong></div>
        {algorithmSnapshot.lotBasis && algorithmSnapshot.capitalPolicy && algorithmSnapshot.syntheticLotProfile ? <ContractLotBasis controls={inputs} lotBasis={algorithmSnapshot.lotBasis} syntheticProfile={algorithmSnapshot.syntheticLotProfile} capitalPolicy={algorithmSnapshot.capitalPolicy} compact /> : <p className="swf-result-note">Contract-basis metadata is unavailable in this snapshot.</p>}
        <p className="swf-result-note">Buyer consideration {money(inputs.remainingBuyerConsiderationUsd)}. Exposure is an invented example scaled once, not measured resources or a resale valuation from the historical payments.</p>
        {result ? <FeeSensitivity comparison={frame.feeComparison} compact /> : null}
        <details className="swf-target"><summary>25% return hurdle · {money(assignmentTarget.requiredAssignmentProceedsUsd, 0)}</summary><p>Required gross assignment proceeds per whole contract at every sale date, given the assumed sale probability and exit fee. This is a target sensitivity, not a forecast or current quote. The model assignment above is unchanged.</p></details>
        <p className="swf-result-evidence">Area {area} evidence: {frame.evidence.pass}/{frame.evidence.total} · {frame.evidence.gate}. Sale hazard: {percent(inputs.hazardPer30Days, 0)} per 30 days, assumed.</p>
        <button type="button" className="swf-inspect-result" data-node-id="decision-output" aria-label="Inspect model output" aria-pressed={selectedId === "decision-output"} ref={(element) => { if (element) nodeRefs.current.set("decision-output", element); else nodeRefs.current.delete("decision-output"); }} onClick={() => setSelectedId("decision-output")}>Inspect calculation <ArrowRight size={14} /></button>
        <div className="swf-validation" data-testid="validation-summary"><button ref={validationButton} type="button" aria-label="Validation details" aria-expanded={validationOpen} aria-controls="swarm-validation-details" onClick={() => { setValidationOpen(!validationOpen); setSelectedId(null); }}><FlaskConical size={15} /><span>Validation</span><span>{data.monetaryReady ? "Source checks passed" : "Not established"}</span><span aria-hidden="true">{validationOpen ? "−" : "+"}</span></button>
          {validationOpen ? <div id="swarm-validation-details" className="swf-validation-details"><p>These findings describe the evidence behind the model. They do not stop the hypothetical calculation.</p><div className="swf-validation-finding"><strong>Swarm checks</strong><span className={researchFailed ? "is-failed" : ""}>{validationLabel}</span><p>The input cutoff is unknown. Configuration, interview and grounding checks remain unresolved.</p></div><details className="swf-check-details"><summary>Simulation checks ({data.checks.length})</summary><div>{data.checks.map((check) => <div key={check.id} className={`swf-check is-${check.status}`}><span>{check.status === "pass" ? <Check size={12} /> : check.status === "fail" ? <X size={12} /> : "?"}</span><span>{check.label}</span><span>{check.status === "pass" ? "Passed" : check.status === "fail" ? "Failed" : "Unknown"}</span></div>)}</div></details><div className="swf-validation-finding"><strong>Historical equity pilot</strong><span className={studyWorse ? "is-failed" : ""}>{studyLabel}</span><p>{study ? `${study.heldOutEvents} held-out events over ${study.primaryHorizonSessions} trading sessions. This is a separate equity test, not Tok option returns.` : "No historical study is supplied."}</p>{study ? <dl><div><dt>Gold-only error</dt><dd>{numeric(study.metrics.goldOnlyMaePp)} pp</dd></div><div><dt>Gold + event error</dt><dd>{numeric(study.metrics.eventMaePp)} pp</dd></div><div><dt>No-change error</dt><dd>{numeric(study.metrics.noChangeMaePp)} pp</dd></div></dl> : null}</div><div className="swf-validation-finding"><strong>Swarm predictive lift</strong><span>Not measured</span><p>No matching historical swarm predictions and financial outcomes are supplied.</p></div><details className="swf-payload-details"><summary>Study source and payload</summary><pre tabIndex={0}>{JSON.stringify(study ?? { status: "unavailable" }, null, 2)}</pre></details></div> : null}
        </div>
        <p className="swf-result-note">Hypothetical snapshot · assumptions remain unvalidated.</p>
      </aside>
    </section>
    <footer className="swf-controls" aria-label="Replay controls"><label className="swf-run-select"><span className="swf-sr-only">Scenario and seed</span><select aria-label="Scenario and seed" value={runId} onChange={(event) => { setRunId(event.target.value); setSelectedId(null); setHoveredId(null); setDay(5); setPlaying(false); }}>{data.runs.map((r) => <option key={r.id} value={r.id}>{r.label} · seed {r.seed}{r.available ? "" : " · unavailable"}</option>)}</select></label><div className="swf-transport"><button type="button" className="swf-primary" disabled={!run.available || reducedMotion} aria-label={activeReplay ? "Pause replay" : "Play replay"} onClick={() => setPlaying(!activeReplay)}>{activeReplay ? <CirclePause size={15} /> : <Play size={15} />}{activeReplay ? "Pause" : "Play"}</button><button className="swf-icon-button" type="button" aria-label="Reset replay" disabled={!run.available} onClick={() => { setDay(1); setPlaying(false); }}><RotateCcw size={16} /></button><select aria-label="Replay speed" className="swf-speed" value={speed} onChange={(event) => setSpeed(Number(event.target.value))}><option value={1}>1×</option><option value={2}>2×</option><option value={4}>4×</option></select></div><div className="swf-day-control"><label htmlFor="swarm-day">Simulated day <strong className="swf-mono">{day}<span>/5</span></strong></label><input id="swarm-day" aria-label="Simulated day" type="range" min="1" max="5" step="1" value={day} disabled={!run.available} onChange={(event) => { setDay(Number(event.target.value)); setPlaying(false); }} /></div><span className="swf-view-note">{reducedMotion ? "Motion reduced · use day slider" : "Replay, not live execution"}</span></footer>
  </main>;
}
