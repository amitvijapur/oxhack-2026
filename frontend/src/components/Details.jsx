import { ChevronDown } from 'lucide-react';

/** A native disclosure: secondary detail stays one click away instead of on the page. */
export default function Details({ summary, children, className = '' }) {
  return <details className={`details ${className}`}>
    <summary><span>{summary}</span><ChevronDown size={15} aria-hidden="true" /></summary>
    <div className="details-body">{children}</div>
  </details>;
}
