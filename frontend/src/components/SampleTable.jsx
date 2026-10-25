import { useMemo, useState } from 'react';
import { ChevronDown, Search } from 'lucide-react';
import { formatAssay } from '../evidence.js';

export default function SampleTable({ features, total, selectedId, onSelect }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? features.filter((f) => [f.properties.sample_id, f.properties.laboratory_sample_id, f.properties.area]
      .some((v) => String(v).toLowerCase().includes(q))) : features;
  }, [features, query]);
  return <section className="data-section" id="data" aria-labelledby="record-heading">
    <div className="section-head">
      <h2 id="record-heading">The data</h2>
      <p>Every sample with its gold, retest and lithium results.</p>
    </div>
    <button type="button" className="button-secondary" aria-expanded={open} aria-controls="sample-records" onClick={() => setOpen((value) => !value)}>
      {open ? 'Hide samples' : `Browse all ${total} samples`}<ChevronDown size={16} aria-hidden="true" className={open ? 'is-flipped' : ''} />
    </button>
    {open ? <div id="sample-records" className="records">
      <label className="search">
        <Search size={16} aria-hidden="true" />
        <span className="sr-only">Search sample records by sample ID, laboratory ID or area</span>
        <input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Find a sample, e.g. 16MBW012" />
        <span className="search-count">{visible.length} of {features.length}</span>
      </label>
      <div className="records-scroll">
        <table>
          <caption className="sr-only">Select a sample to see it on the map. Gold retests are shown separately.</caption>
          <thead><tr><th scope="col">Sample</th><th scope="col">Area</th><th scope="col">Gold</th><th scope="col">Gold retest</th><th scope="col">Lithium</th></tr></thead>
          <tbody>{visible.map((f) => <tr key={f.id} className={selectedId === f.id ? 'is-selected' : ''}>
            <th scope="row"><button type="button" className="sample-open" onClick={() => onSelect(f)} aria-pressed={selectedId === f.id}>{f.properties.sample_id}</button></th>
            <td>{f.properties.area}</td>
            <td>{formatAssay(f.properties, 'gold_primary')}</td>
            <td>{formatAssay(f.properties, 'gold_retest')}</td>
            <td>{formatAssay(f.properties, 'lithium_secondary')}</td>
          </tr>)}</tbody>
        </table>
        {visible.length === 0 ? <div className="no-records">No samples match “{query}”. Try another sample ID.</div> : null}
      </div>
    </div> : null}
  </section>;
}
