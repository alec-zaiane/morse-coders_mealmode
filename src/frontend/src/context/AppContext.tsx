import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';

interface AppContextValue {
}

const AppContext = createContext<AppContextValue | null>(null);



export function AppProvider({ children }: { children: ReactNode }) {

  const value = null;

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
