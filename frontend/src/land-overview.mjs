/** Keep selection and navigation inside the currently visible plot order. */
export function visiblePlot(rows, selectedId) {
  return rows.find((plot) => `plot:${plot.id}` === selectedId) ?? rows[0] ?? null;
}

export function nextVisiblePlot(rows, selectedId, step) {
  if (!rows.length) return null;
  const index = rows.findIndex((plot) => `plot:${plot.id}` === selectedId);
  if (index < 0) return step < 0 ? rows.at(-1) : rows[0];
  return rows[(index + step + rows.length) % rows.length];
}
