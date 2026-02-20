import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';
import type { Meal, Ingredient, MealPlanEntry } from '../types';

interface AppContextValue {
  meals: Meal[];
  ingredients: Ingredient[];
  mealPlan: MealPlanEntry[];
  addMealToPlan: (entry: Omit<MealPlanEntry, 'id'>) => void;
  removeMealFromPlan: (entryId: string) => void;
}

const AppContext = createContext<AppContextValue | null>(null);

const MOCK_INGREDIENTS: Ingredient[] = [
  { id: '1', name: 'Chicken breast', unit: 'kg', costPerUnit: 8, nutrition: { kcalPerUnit: 1650, proteinPerUnit: 310, carbsPerUnit: 0, fatPerUnit: 37 } },
  { id: '2', name: 'Rice', unit: 'kg', costPerUnit: 3, nutrition: { kcalPerUnit: 1300, proteinPerUnit: 26, carbsPerUnit: 286, fatPerUnit: 2.6 } },
  { id: '3', name: 'Broccoli', unit: 'kg', costPerUnit: 4, nutrition: { kcalPerUnit: 340, proteinPerUnit: 28, carbsPerUnit: 70, fatPerUnit: 3.7 } },
  { id: '4', name: 'Eggs', unit: 'pc', costPerUnit: 0.4, nutrition: { kcalPerUnit: 155, proteinPerUnit: 13, carbsPerUnit: 1.1, fatPerUnit: 11 } },
  { id: '5', name: 'Olive oil', unit: 'l', costPerUnit: 10, nutrition: { kcalPerUnit: 8840, proteinPerUnit: 0, carbsPerUnit: 0, fatPerUnit: 1000 } },
];

const MOCK_MEALS: Meal[] = [
  {
    id: 'm1',
    name: 'Grilled Chicken & Rice',
    servings: 4,
    tags: ['dinner', 'high-protein'],
    prepTime: 15,
    cookTime: 30,
    steps: ['Season chicken with salt and pepper.', 'Grill chicken 6–7 min per side.', 'Cook rice according to package.', 'Serve chicken over rice with broccoli.'],
    ingredients: [
      { ingredientId: '1', quantity: 0.5, unit: 'kg' },
      { ingredientId: '2', quantity: 0.3, unit: 'kg' },
      { ingredientId: '3', quantity: 0.2, unit: 'kg' },
      { ingredientId: '5', quantity: 0.02, unit: 'l' },
    ],
  },
  {
    id: 'm2',
    name: 'Veggie Stir-Fry',
    servings: 2,
    tags: ['lunch', 'vegetarian'],
    prepTime: 10,
    cookTime: 15,
    steps: ['Chop vegetables.', 'Heat oil in a wok.', 'Stir-fry vegetables 5–7 min.', 'Season and serve.'],
    ingredients: [
      { ingredientId: '3', quantity: 0.4, unit: 'kg' },
      { ingredientId: '2', quantity: 0.2, unit: 'kg' },
      { ingredientId: '5', quantity: 0.01, unit: 'l' },
    ],
  },
  {
    id: 'm3',
    name: 'Scrambled Eggs',
    servings: 1,
    tags: ['breakfast', 'quick'],
    prepTime: 2,
    cookTime: 5,
    steps: ['Beat eggs.', 'Cook in nonstick pan over medium heat, stirring.', 'Season and serve.'],
    ingredients: [
      { ingredientId: '4', quantity: 3, unit: 'pc' },
      { ingredientId: '5', quantity: 0.005, unit: 'l' },
    ],
  },
];

export function AppProvider({ children }: { children: ReactNode }) {
  const [mealPlan, setMealPlan] = useState<MealPlanEntry[]>([]);

  const value = useMemo<AppContextValue>(() => ({
    meals: MOCK_MEALS,
    ingredients: MOCK_INGREDIENTS,
    mealPlan,
    addMealToPlan: (entry) => {
      setMealPlan((prev) => [...prev, { ...entry, id: `plan-${Date.now()}` }]);
    },
    removeMealFromPlan: (entryId) => {
      setMealPlan((prev) => prev.filter((e) => e.id !== entryId));
    },
  }), [mealPlan]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
