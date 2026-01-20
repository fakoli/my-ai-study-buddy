import { useState, useEffect, useCallback, createContext, ReactNode } from 'react';

type Politeness = 'polite' | 'assertive';

export interface LiveRegionContextValue {
  announce: (message: string, politeness?: Politeness) => void;
}

export const LiveRegionContext = createContext<LiveRegionContextValue | null>(null);

interface LiveRegionProviderProps {
  children: ReactNode;
}

export function LiveRegionProvider({ children }: LiveRegionProviderProps) {
  const [politeMessage, setPoliteMessage] = useState('');
  const [assertiveMessage, setAssertiveMessage] = useState('');

  const announce = useCallback((message: string, politeness: Politeness = 'polite') => {
    if (politeness === 'assertive') {
      setAssertiveMessage('');
      setTimeout(() => setAssertiveMessage(message), 100);
    } else {
      setPoliteMessage('');
      setTimeout(() => setPoliteMessage(message), 100);
    }
  }, []);

  useEffect(() => {
    if (politeMessage) {
      const timer = setTimeout(() => setPoliteMessage(''), 3000);
      return () => clearTimeout(timer);
    }
  }, [politeMessage]);

  useEffect(() => {
    if (assertiveMessage) {
      const timer = setTimeout(() => setAssertiveMessage(''), 3000);
      return () => clearTimeout(timer);
    }
  }, [assertiveMessage]);

  return (
    <LiveRegionContext.Provider value={{ announce }}>
      {children}
      <div
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      >
        {politeMessage}
      </div>
      <div
        aria-live="assertive"
        aria-atomic="true"
        className="sr-only"
      >
        {assertiveMessage}
      </div>
    </LiveRegionContext.Provider>
  );
}

