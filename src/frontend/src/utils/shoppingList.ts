import type { Recipe, RecipeIngredient, Ingredient, OnHandIngredient } from '../api/mealmodeAPI';

export interface MealPlanEntryForShopping {
  mealId: string;
  servings: number;
}

export interface ShoppingListItem {
  ingredientId: number;
  name: string;
  quantity: number;
  unit: 'kg' | 'L' | 'pc';
  /** Human-readable label e.g. "400g", "1.5 L", "3 pc" */
  displayLabel: string;
}

/**
 * Format quantity for display (e.g. 0.4 kg → "400g", 1.5 L → "1.5 L").
 */
export function formatQuantityForDisplay(quantity: number, unit: 'kg' | 'L' | 'pc'): string {
  if (unit === 'kg') {
    const g = quantity * 1000;
    return g >= 1000 ? `${(quantity).toFixed(1)} kg` : `${Math.round(g)}g`;
  }
  if (unit === 'L') return `${quantity.toFixed(2)} L`;
  return `${Math.round(quantity)} pc`;
}

/**
 * Aggregate recipe ingredients for planned meals: scale by servings, merge same ingredient,
 * subtract on-hand quantities. Returns only items with quantity > 0 (what to buy).
 */
export function buildShoppingList(
  planEntries: MealPlanEntryForShopping[],
  recipes: Recipe[],
  onHandList: OnHandIngredient[]
): ShoppingListItem[] {
  const byIngredientId = new Map<number, { quantity: number; name: string; unit: 'kg' | 'L' | 'pc' }>();

  for (const entry of planEntries) {
    const recipe = recipes.find((r) => String(r.id) === entry.mealId);
    if (!recipe?.ingredients_list?.length) continue;
    const recipeServings = recipe.servings ?? 1;
    const scale = entry.servings / recipeServings;

    for (const ri of recipe.ingredients_list as RecipeIngredient[]) {
      const ing = ri.ingredient;
      if (!ing) continue;
      const unit = (ing.nutrition_stats?.base_unit as 'kg' | 'L' | 'pc') ?? 'kg';
      const q = (ri.quantity ?? 0) * scale;
      const existing = byIngredientId.get(ing.id);
      if (existing) {
        existing.quantity += q;
      } else {
        byIngredientId.set(ing.id, { quantity: q, name: ing.name, unit });
      }
    }
  }

  const onHandByIngredientId = new Map<number, number>();
  for (const oh of onHandList) {
    const q = oh.quantity ?? 0;
    if (q > 0) onHandByIngredientId.set(oh.ingredient, (onHandByIngredientId.get(oh.ingredient) ?? 0) + q);
  }

  const result: ShoppingListItem[] = [];
  for (const [ingredientId, { quantity, name, unit }] of byIngredientId) {
    const onHand = onHandByIngredientId.get(ingredientId) ?? 0;
    const toBuy = Math.max(0, quantity - onHand);
    if (toBuy <= 0) continue;
    result.push({
      ingredientId,
      name,
      quantity: toBuy,
      unit,
      displayLabel: formatQuantityForDisplay(toBuy, unit),
    });
  }

  return result.sort((a, b) => a.name.localeCompare(b.name));
}

/** Stable id for the current plan so we can persist "bought" state per list. */
export function getShoppingListId(planEntries: MealPlanEntryForShopping[]): string {
  const payload = planEntries
    .slice()
    .sort((a, b) => a.mealId.localeCompare(b.mealId) || a.servings - b.servings)
    .map((e) => `${e.mealId}:${e.servings}`)
    .join('|');
  let h = 0;
  for (let i = 0; i < payload.length; i++) h = (Math.imul(31, h) + payload.charCodeAt(i)) | 0;
  return `shopping_${h}`;
}

const STORAGE_KEY = 'mealmode_shopping_bought';

export function getBoughtSet(listId: string): Set<string> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return new Set();
    const data = JSON.parse(raw) as Record<string, string[]>;
    const arr = data[listId];
    return Array.isArray(arr) ? new Set(arr) : new Set();
  } catch {
    return new Set();
  }
}

export function setBought(listId: string, itemKey: string, bought: boolean): void {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const data: Record<string, string[]> = raw ? JSON.parse(raw) : {};
    const set = new Set(Array.isArray(data[listId]) ? data[listId] : []);
    if (bought) set.add(itemKey);
    else set.delete(itemKey);
    data[listId] = Array.from(set);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // ignore
  }
}

export function itemKey(item: ShoppingListItem): string {
  return `${item.ingredientId}_${item.quantity}_${item.unit}`;
}
