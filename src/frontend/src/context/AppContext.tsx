import { createContext, useContext, useMemo, type ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  useMealPlanEntriesList,
  useMealPlanEntriesCreate,
  useMealPlanEntriesDestroy,
  useMealPlanEntriesPartialUpdate,
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
  updateMealPlanEntry: (entryId: string, data: { servings: number }) => void;
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
  const partialUpdateEntry = useMealPlanEntriesPartialUpdate({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getMealPlanEntriesListQueryKey() });
      },
    },
  });

  const mealPlan: MealPlanEntry[] = useMemo(() => {
    const results = listResponse?.data?.results;
    if (!Array.isArray(results)) return [];
    return results.map(apiEntryToContext);
  }, [listResponse]);

  const value = useMemo<AppContextValue>(
    () => ({
      mealPlan,
      isLoading,
      addMealToPlan: (entry) => {
        createEntry.mutate({
          data: {
            recipe: Number(entry.mealId),
            day: entry.day as DayEnum,
            slot: entry.slot as SlotEnum,
            servings: entry.servings,
          },
        });
      },
      updateMealPlanEntry: (entryId, data) => {
        const id = Number(entryId);
        if (!Number.isNaN(id) && data.servings >= 1) {
          partialUpdateEntry.mutate({ id, data: { servings: data.servings } });
        }
      },
      removeMealFromPlan: (entryId) => {
        const id = Number(entryId);
        if (!Number.isNaN(id)) destroyEntry.mutate({ id });
      },
    }),
    [mealPlan, isLoading, createEntry, partialUpdateEntry, destroyEntry]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
