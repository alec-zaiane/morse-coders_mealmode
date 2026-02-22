import type { NutritionStats, Recipe, Ingredient } from '../api/mealmodeAPI';

type NonNullableFields<T> = { [K in keyof T]: NonNullable<T[K]> };

export type NutritionStatsAggregated = NonNullableFields<Required<Omit<NutritionStats, "id" | "base_unit" | "ingredient">>>;

const NUTRITION_KEYS: (keyof NutritionStatsAggregated)[] = [
  "kcal_per_unit",
  "fat_saturated_grams_per_unit",
  "fat_trans_grams_per_unit",
  "carbohydrate_fiber_grams_per_unit",
  "carbohydrate_sugar_grams_per_unit",
  "protein_grams_per_unit",
  "cholesterol_milligrams_per_unit",
  "sodium_milligrams_per_unit",
  "potassium_milligrams_per_unit",
  "calcium_milligrams_per_unit",
  "iron_milligrams_per_unit",
  "vitamin_a_milligrams_per_unit",
  "vitamin_c_milligrams_per_unit",
  "vitamin_d_milligrams_per_unit",
];

export function addNutritionStats(
  stat1: Partial<NutritionStatsAggregated>,
  stat2: Partial<NutritionStatsAggregated>
): NutritionStatsAggregated {
  return Object.fromEntries(
    NUTRITION_KEYS.map((key) => [key, (stat1[key] ?? 0) + (stat2[key] ?? 0)])
  ) as NutritionStatsAggregated;
}

export function multiplyNutritionStats(
  stat: Partial<NutritionStats>,
  coefficient: number
): NutritionStatsAggregated {
  return Object.fromEntries(
    NUTRITION_KEYS.map((key) => [key, ((stat[key] ?? 0) * coefficient)])
  ) as NutritionStatsAggregated
}

function getIngredientCost(ingredient: Ingredient): number | null {
  /// get cost per unit, return null if unknown
  if (ingredient.scraper?.cached_price != null) {
    return ingredient.scraper.cached_price;
  }
  return ingredient.estimated_cost ?? null;
}

export function calculateRecipeCost(recipe: Recipe): { costPerServing: number, costTotal: number, costPartiallyUnknown: boolean } {

  let total = recipe.ingredients_list.reduce((acc, ri) => {
    const costPerUnit = getIngredientCost(ri.ingredient) ?? 0;
    return acc + ri.quantity * costPerUnit;
  }, 0)

  let partiallyUnknown = recipe.ingredients_list.some(ri => getIngredientCost(ri.ingredient) === null);

  return {
    costTotal: total,
    costPerServing: (recipe.servings && recipe.servings > 0) ? total / recipe.servings : 0,
    costPartiallyUnknown: partiallyUnknown,
  }
}


export function calculateRecipeNutrition(
  recipe: Recipe,
): { nutritionPerServing: NutritionStatsAggregated, nutritionTotal: NutritionStatsAggregated } {
  let total = recipe.ingredients_list.map(ri => multiplyNutritionStats(ri.ingredient.nutrition_stats, ri.quantity)
  ).reduce((acc, nutritionStats) => addNutritionStats(acc, nutritionStats ?? {}), {} as NutritionStatsAggregated)

  return {
    nutritionTotal: total,
    nutritionPerServing: multiplyNutritionStats(total, 1 / (recipe.servings ?? 1)),
  }
}
