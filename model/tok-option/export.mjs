#!/usr/bin/env node
import { readFile } from 'node:fs/promises';
import { runWorkbench, DEFAULT_CONTROLS, parseSwarmImport } from './workbench.mjs';
import { decisionOutput } from './publish.mjs';

// Accept a saved explicit workbench request, or export the safe pending state.
// No backend credentials are read and nothing is published by this command.
const request = process.argv[2] ? JSON.parse(await readFile(process.argv[2], 'utf8')) : {};
if (!request || typeof request !== 'object' || Array.isArray(request)) throw new Error('request must be a JSON object');
const unknown = Object.keys(request).filter((key) => !['controls', 'features', 'swarmRuns'].includes(key));
if (unknown.length) throw new Error(`unknown request fields: ${unknown.join(', ')}`);
if (request.controls !== undefined && (!request.controls || typeof request.controls !== 'object' || Array.isArray(request.controls))) throw new Error('controls must be a JSON object');
if (request.features !== undefined && !Array.isArray(request.features)) throw new Error('features must be an array');
const controls = { ...DEFAULT_CONTROLS, ...request.controls };
const features = request.features ?? (await Promise.all(['a', 'b'].map(async (area) => JSON.parse(await readFile(new URL(`../../frontend/public/data/tok-gold/site-${area}/samples.geojson`, import.meta.url), 'utf8')).features))).flat();
let swarmRuns = request.swarmRuns ?? null;
if (swarmRuns !== null) {
  const parsed = parseSwarmImport(JSON.stringify(swarmRuns));
  if (parsed.errors.length) throw new Error(parsed.errors.join('; '));
  swarmRuns = parsed.runs;
}
const selection = { area: controls.area, horizonDays: controls.horizonDays, scenarioId: controls.scenarioId };
console.log(JSON.stringify(decisionOutput({ selection, result: runWorkbench({ features, controls, swarmRuns }) }), null, 2));
