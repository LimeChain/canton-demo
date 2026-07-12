import { AlertCircle, Terminal, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

import type { ResultPanelProps } from './ResultPanel.types';

export function ResultPanel({ result }: ResultPanelProps) {
  // STATE
  const [isOpen, setIsOpen] = useState<boolean>(false);

  // REFS
  const previousResult = useRef(result);

  // DERIVED STATE
  const isIdle = result.ok && result.title === 'Ready';

  // EFFECTS
  useEffect(() => {
    if (previousResult.current !== result) {
      previousResult.current = result;
      setIsOpen(true);
    }
  }, [result]);

  // RENDER
  if (!isOpen) {
    return (
      <button className="console-tab" type="button" onClick={() => setIsOpen(true)}>
        <Terminal size={16} />
        Console
      </button>
    );
  }

  return (
    <section className={`result-panel ${result.ok ? 'success' : 'failure'} ${isIdle ? 'idle' : ''}`}>
      <div className="console-title">
        <div>
          <AlertCircle size={18} />
          <h2>{result.title}</h2>
        </div>

        <button className="console-close" type="button" aria-label="Close console" onClick={() => setIsOpen(false)}>
          <X size={16} />
        </button>
      </div>

      <pre>{result.body}</pre>
    </section>
  );
}
