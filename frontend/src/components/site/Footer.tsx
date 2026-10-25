import { ExternalLink } from "lucide-react";
import { DISCLAIMER } from "@/lib/copy.js";
import type { EvidenceConfig } from "@/lib/types";

export function Footer({ source }: { source: EvidenceConfig["source"] }) {
  return (
    <footer className="evidence-footer">
      <p>{DISCLAIMER} Not investment or legal advice.</p>
      <p>
        Soil data:{" "}
        <a href={source.publication_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 underline underline-offset-4">
          Alaska DGGS {source.version}<ExternalLink className="size-3" aria-hidden="true" />
        </a>
        , the −200 mesh fraction, split into two areas by longitude.
      </p>
      <p>Map © OpenFreeMap, OpenStreetMap contributors; terrain Mapzen/USGS. The modern basemap is not a reconstruction of 2016.</p>
    </footer>
  );
}
