export type GroupId = 'government' | 'industry' | 'community' | 'funds' | 'retail';
export type WorkflowGroup = { id: GroupId; sourceId: string; label: string; agents: number; weight: number };
export type WorkflowReading = { id: GroupId; mean: number | null; count: number | null };
export type WorkflowDay = { day: number; count: number | null; groups: WorkflowReading[] };
export type WorkflowComparison = {
  baselineRunId: string | null;
  window: number[];
  groups: { id: GroupId; baselineMean: number | null; scenarioMean: number | null; delta: number | null; contribution: number | null }[];
  signal: number | null;
  diagnosticOnly: boolean;
};
export type WorkflowRun = {
  id: string; label: string; scenario: string; seed: number; available: boolean;
  days: WorkflowDay[]; totalRows: number | null; numericRows: number | null; nullRows: number | null;
  configuration: { provider: string | null; model: string | null; minutesPerRound: number | null; simulatorCommit: string | null } | null;
  readiness: { status: string; reasons: string[] };
  comparison: WorkflowComparison;
};
export type WorkflowCheck = { id: string; label: string; status: 'pass' | 'fail' | 'unknown'; detail: string };
export type WorkflowData = {
  source: { id: string | null; commit: string | null; ref: string | null; committedAt: string | null; retrievedAt: string | null; knowledgeCutoff: string | null; url: string | null };
  counts: { plannedRuns: number; availableRuns: number; scoreRows: number | null; numericRows: number | null; nullRows: number | null; agents: number; groups: number; newsWires: number; interviewsExpected: number | null; interviewsParsed: number | null };
  groups: WorkflowGroup[]; runs: WorkflowRun[]; checks: WorkflowCheck[]; limitations: string[];
  eventDefinition: string | null; replayGrain: string; replayNote: string; scoreMetric: string; scoreRange: number[];
  monetaryReady: boolean;
};
export type WorkflowFrame = {
  run: WorkflowRun | null; day: number; days: WorkflowDay[];
  groups: (WorkflowGroup & WorkflowReading)[];
  cumulativeCount: number | null; complete: boolean; comparison: WorkflowComparison | null;
};
export function buildWorkflowData(bundle: unknown): WorkflowData;
export function getReplayFrame(data: WorkflowData, runId: string, day: number): WorkflowFrame;
