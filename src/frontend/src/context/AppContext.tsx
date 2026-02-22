import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  useMealPlanEntriesList,
  useMealPlanEntriesCreate,
  useMealPlanEntriesDestroy,
  getMealPlanEntriesListQueryKey,
  type DayEnum,
  type SlotEnum,
} from '../api/mealmodeAPI';

export interface MealPlanEntry {
  id: string;
  mealId: string;
  day: string;
  slot: string;
  servings: number;
}

interface AppContextValue {
  mealPlan: MealPlanEntry[];
  isLoading: boolean;
  addMealToPlan: (entry: Omit<MealPlanEntry, 'id'>) => void;
  removeMealFromPlan: (entryId: string) => void;
}

const AppContext = createContext<AppContextValue | null>(null);

function apiEntryToContext(entry: { id: number; recipe: number; day: string; slot: string; servings?: number }): MealPlanEntry {
  return {
    id: String(entry.id),
    mealId: String(entry.recipe),
    day: entry.day,
    slot: entry.slot,
    servings: entry.servings ?? 1,
  };
}

export function AppProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const { data: listResponse, isLoading } = useMealPlanEntriesList({ limit: 500 });
  const createEntry = useMealPlanEntriesCreate({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getMealPlanEntriesListQueryKey() });
      },
    },
  });
  const destroyEntry = useMealPlanEntriesDestroy({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getMealPlanEntriesListQueryKey() });
      },
    },
  });

  const mealPlanFromServer: MealPlanEntry[] = useMemo(() => {
    const results = listResponse?.data?.results;
    if (!Array.isArray(results)) return [];
    return results.map(apiEntryToContext);
  }, [listResponse]);
  const [mealPlan, setMealPlan] = useState<MealPlanEntry[]>([]);

  useEffect(() => {
    setMealPlan(mealPlanFromServer);
  }, [mealPlanFromServer]);

  const value = useMemo<AppContextValue>(
    () => ({
      mealPlan,
      isLoading,
      addMealToPlan: (entry) => {
        const tempId = `temp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
        setMealPlan((prev) => {
          const withoutSlot = prev.filter((item) => !(item.day === entry.day && item.slot === entry.slot));
          return [...withoutSlot, { id: tempId, ...entry }];
        });
        createEntry.mutate({
          data: {
            recipe: Number(entry.mealId),
            day: entry.day as DayEnum,
            slot: entry.slot as SlotEnum,
            servings: entry.servings,
          },
        }, {
          onError: () => {
            queryClient.invalidateQueries({ queryKey: getMealPlanEntriesListQueryKey() });
          },
        });
      },
      removeMealFromPlan: (entryId) => {
        setMealPlan((prev) => prev.filter((item) => item.id !== entryId));
        if (entryId.startsWith('temp-')) return;
        const id = Number(entryId);
        if (!Number.isNaN(id)) destroyEntry.mutate({ id });
      },
    }),
    [mealPlan, isLoading, createEntry, destroyEntry, queryClient]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
