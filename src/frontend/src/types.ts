export interface Ingredient {
  id: string;
  name: string;
  unit: string;
  costPerUnit?: number; // optional; backend has no cost yet
  nutrition?: {
    kcalPerUnit: number | null;
    proteinPerUnit: number | null;
    carbsPerUnit: number | null;
    fatPerUnit: number | null;
  };
}

export interface MealIngredient {
  ingredientId: string;
  quantity: number;
  unit: string;
  notes?: string;
}

export interface Meal {
  id: string;
  name: string;
  servings: number;
  tags: string[];
  prepTime: number;
  cookTime: number;
  steps: string[];
  ingredients: MealIngredient[];
}

export interface MealPlanEntry {
  id: string;
  mealId: string;
  day: string;
  slot: string;
  servings: number;
}
