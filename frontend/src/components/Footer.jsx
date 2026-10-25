import { ExternalLink } from 'lucide-react';
import { DISCLAIMER } from '../copy.js';

export default function Footer({ source }) {
  return <footer className="evidence-footer">
    <p>{DISCLAIMER}</p>
    <p>
      Soil data: <a href={source.publication_url} target="_blank" rel="noreferrer">Alaska DGGS {source.version}<ExternalLink size={12} aria-hidden="true" /></a>,
      {' '}the −200 mesh fraction, split into two areas by longitude. Map © OpenFreeMap, OpenStreetMap; terrain Mapzen/USGS.
    </p>
  </footer>;
}
