import { runWorkbench } from '../../../model/tok-option/workbench.mjs';

/** Inspect source readiness without supplying hypothetical contract economics. */
export function inspectRealInputs(features) {
  return runWorkbench({ features, controls: { mode: 'real' } });
}
