import { useState, useCallback, createContext, useContext } from 'react';
import { ProviderLevel } from '../database/types';

interface ProviderFilterContextValue {
  activeLevel: ProviderLevel | null;
  setActiveLevel: (level: ProviderLevel | null) => void;
  toggleLevel: (level: ProviderLevel) => void;
}

const ProviderFilterContext = createContext<ProviderFilterContextValue>({
  activeLevel: null,
  setActiveLevel: () => {},
  toggleLevel: () => {},
});

export function useProviderFilterState(): ProviderFilterContextValue {
  const [activeLevel, setActiveLevel] = useState<ProviderLevel | null>(null);

  const toggleLevel = useCallback((level: ProviderLevel) => {
    setActiveLevel(prev => (prev === level ? null : level));
  }, []);

  return { activeLevel, setActiveLevel, toggleLevel };
}

export function ProviderFilterProvider({
  children,
  value,
}: {
  children: React.ReactNode;
  value: ProviderFilterContextValue;
}) {
  return (
    <ProviderFilterContext.Provider value={value}>
      {children}
    </ProviderFilterContext.Provider>
  );
}

export function useProviderFilter(): ProviderFilterContextValue {
  return useContext(ProviderFilterContext);
}
