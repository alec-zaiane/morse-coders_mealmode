import type { Meal, Ingredient } from '../types';

export function getIngredientById(ingredients: Ingredient[], id: string): Ingredient | undefined {
  return ingredients.find((i) => i.id === id);
}

export function calculateMealCost(
  meal: Meal,
  ingredients: Ingredient[],
  servings: number
): number {
  const scale = servings / meal.servings;
  return meal.ingredients.reduce((total, ri) => {
    const ing = getIngredientById(ingredients, ri.ingredientId);
    const costPerUnit = ing?.costPerUnit ?? 0;
    return total + ri.quantity * costPerUnit * scale;
  }, 0);
}

export function calculateCostPerServing(meal: Meal, ingredients: Ingredient[]): number {
  const total = calculateMealCost(meal, ingredients, meal.servings);
  return meal.servings > 0 ? total / meal.servings : 0;
}

export interface NutritionTotals {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export function calculateMealNutrition(
  meal: Meal,
  ingredients: Ingredient[],
  servings: number = meal.servings
): { perServing: NutritionTotals; total: NutritionTotals } {
  const scale = servings / meal.servings;
  const total: NutritionTotals = meal.ingredients.reduce(
    (acc, ri) => {
      const ing = getIngredientById(ingredients, ri.ingredientId);
      const n = ing?.nutrition;
      if (!n) return acc;
      const mult = ri.quantity * scale;
      return {
        calories: acc.calories + (n.kcalPerUnit ?? 0) * mult,
        protein: acc.protein + (n.proteinPerUnit ?? 0) * mult,
        carbs: acc.carbs + (n.carbsPerUnit ?? 0) * mult,
        fat: acc.fat + (n.fatPerUnit ?? 0) * mult,
      };
    },
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );
  return {
    perServing: {
      calories: total.calories / servings,
      protein: total.protein / servings,
      carbs: total.carbs / servings,
      fat: total.fat / servings,
    },
    total,
  };
}

export interface IngredientBreakdownItem {
  ingredient: Ingredient;
  quantity: number;
  cost: number;
}

export function getIngredientBreakdown(
  meal: Meal,
  ingredients: Ingredient[],
  servings: number
): IngredientBreakdownItem[] {
  const scale = servings / meal.servings;
  return meal.ingredients.map((ri) => {
    const ing = getIngredientById(ingredients, ri.ingredientId);
    const cost = (ing?.costPerUnit ?? 0) * ri.quantity * scale;
    return {
      ingredient: ing ?? { id: ri.ingredientId, name: 'Unknown', unit: ri.unit },
      quantity: ri.quantity * scale,
      cost,
    };
  });
}
