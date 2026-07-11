import { AlertCircle } from 'lucide-react';

import type { ResultPanelProps } from './ResultPanel.types';

export function ResultPanel({ result }: ResultPanelProps) {
  return (
    <div className={`panel result-panel ${result.ok ? 'success' : 'failure'}`}>
      <div className="panel-title">
        <AlertCircle size={18} />
        <h2>{result.title}</h2>
      </div>
      <pre>{result.body}</pre>
    </div>
  );
}
