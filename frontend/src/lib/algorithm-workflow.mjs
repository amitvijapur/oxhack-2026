import snapshot from './algorithm-workflow.json' with { type: 'json' };

/** Read only canonical snapshot outputs. This adapter performs no financial math. */
export const algorithmSnapshot = snapshot;
export function getAlgorithmFrame(data = algorithmSnapshot, { area = 'A', scenarioId = 'mine_approval', horizonDays = 90 } = {}) {
  const areaData = data?.areas?.[area];
  const scenario = areaData?.scenarios?.[scenarioId];
  const horizon = scenario?.horizons?.find((row) => row.days === horizonDays);
  const baseHorizon = areaData?.baseline?.find((row) => row.days === horizonDays);
  const mapped = scenarioId === 'baseline' && scenario ? baseHorizon?.result : horizon?.mapped;
  const available = Boolean(mapped);
  const invalidSelection = !scenario || !baseHorizon;
  return {
    source: data?.source ?? null, area, scenarioId, horizonDays, available,
    status: invalidSelection ? 'INSUFFICIENT_DATA' : mapped?.status ?? scenario?.status ?? 'INSUFFICIENT_DATA',
    reasons: invalidSelection ? ['No snapshot is available for this selection.'] : mapped?.reasons ?? scenario?.reasons ?? [],
    evidence: areaData?.evidence ?? null, landContext: areaData?.landContext ?? null,
    controls: scenario && areaData?.controls ? { ...areaData.controls, area, scenarioId, horizonDays } : null,
    candidate: areaData?.candidate ?? null, signal: scenario?.signal ?? null,
    baseline: baseHorizon?.result ?? null, mapped: mapped ?? null,
    delta: horizon?.delta ?? null,
    cashDiagnostics: { baseline: baseHorizon?.diagnostics ?? null, mapped: scenarioId === 'baseline' && scenario ? baseHorizon?.diagnostics ?? null : horizon?.diagnostics ?? null },
    portfolio: scenarioId === 'baseline' && scenario ? baseHorizon?.portfolio ?? null : horizon?.portfolio ?? null,
  };
}
