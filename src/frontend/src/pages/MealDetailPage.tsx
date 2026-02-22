import { useState, useMemo, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { useRecipesRetrieve, useRecipesPartialUpdate, useIngredientsList, getRecipesRetrieveQueryKey, getRecipesListQueryKey } from '../api/mealmodeAPI';
import type { Recipe, RecipeIngredient } from '../api/mealmodeAPI';
import type { Ingredient } from '../api/mealmodeAPI';
import { Users, DollarSign, Pencil, Plus, X, ChevronDown } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '../components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../components/ui/table';
import { calculateRecipeCost, calculateRecipeNutrition } from '../utils/calculations';

import { NutritionLabel } from '../components/nutritionLabel';
import { Breadcrumbs } from '../components/Breadcrumbs';

function ingredientUnitLabel(ing: Ingredient): string {
  const u = ing.nutrition_stats?.base_unit;
  if (u === 'kg') return 'kg';
  if (u === 'L') return 'L';
  if (u === 'pc') return 'pc';
  return '—';
}

type SelectedIngredient = { ingredientId: number; quantity: number; name: string; unit: string };

export function MealDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const numericId = id != null ? Number(id) : NaN;
  const { data, isLoading, isError } = useRecipesRetrieve(
    Number.isNaN(numericId) ? 0 : numericId,
    { query: { enabled: !Number.isNaN(numericId) && numericId > 0 } }
  );
  // API client may return unwrapped body (Recipe) or AxiosResponse (data.data = Recipe)
  const recipe = data && typeof data === 'object' && 'data' in data && (data as { data?: Recipe }).data !== undefined
    ? (data as { data: Recipe }).data
    : (data as Recipe | undefined);
  const baseServings = recipe?.servings ?? 1;
  const [servings, setServings] = useState(baseServings);
  const [showNutritionLabel, setShowNutritionLabel] = useState(false);
  useEffect(() => {
    if (recipe?.servings != null) setServings(recipe.servings);
  }, [recipe?.servings]);

  const scaledIngredients = useMemo(() => {
    if (!recipe?.ingredients_list) return [];
    const scale = servings / baseServings;
    return recipe.ingredients_list.map((ri: RecipeIngredient) => ({
      ingredient: ri.ingredient,
      quantity: ri.quantity * scale,
      unit: ri.ingredient?.nutrition_stats?.base_unit ?? '',
    }));
  }, [recipe, servings, baseServings]);

  const costData = useMemo(() => {
    if (!recipe) return null;
    return calculateRecipeCost(recipe);
  }, [recipe, servings])

  const nutritionData = useMemo(() => {
    if (!recipe) return null;
    return calculateRecipeNutrition(recipe);
  }, [recipe, servings]);

  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editName, setEditName] = useState('');
  const [editServings, setEditServings] = useState(1);
  const [editSteps, setEditSteps] = useState<string[]>([]);
  const [editIngredients, setEditIngredients] = useState<SelectedIngredient[]>([]);
  const [editIngredientSearch, setEditIngredientSearch] = useState('');
  const [editIngredientDropdownOpen, setEditIngredientDropdownOpen] = useState(false);
  const editIngredientDropdownRef = useRef<HTMLDivElement>(null);

  const { data: editIngredientsResponse } = useIngredientsList({
    limit: 50,
    ...(editIngredientSearch.trim() && { search: editIngredientSearch.trim() }),
  }, { query: { enabled: editDialogOpen } });
  const editIngredientsList: Ingredient[] = editIngredientsResponse?.data?.results ?? [];

  useEffect(() => {
    if (!editIngredientDropdownOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (editIngredientDropdownRef.current && !editIngredientDropdownRef.current.contains(e.target as Node)) {
        setEditIngredientDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [editIngredientDropdownOpen]);

  const updateRecipe = useRecipesPartialUpdate({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getRecipesRetrieveQueryKey(numericId) });
        queryClient.invalidateQueries({ queryKey: getRecipesListQueryKey() });
        setEditDialogOpen(false);
      },
    },
  });

  const openEditDialog = () => {
    if (!recipe) return;
    setEditName(recipe.name);
    setEditServings(recipe.servings ?? 1);
    setEditSteps(recipe.steps?.length ? recipe.steps.map((s) => s.description) : []);
    setEditIngredients(
      recipe.ingredients_list?.length
        ? recipe.ingredients_list.map((ri) => ({
            ingredientId: ri.ingredient.id,
            quantity: ri.quantity,
            name: ri.ingredient.name,
            unit: ingredientUnitLabel(ri.ingredient),
          }))
        : []
    );
    setEditIngredientSearch('');
    setEditDialogOpen(true);
  };

  const addEditIngredient = (ing: Ingredient, quantity = 1) => {
    if (editIngredients.some((s) => s.ingredientId === ing.id)) return;
    setEditIngredients((prev) => [
      ...prev,
      { ingredientId: ing.id, quantity, name: ing.name, unit: ingredientUnitLabel(ing) },
    ]);
  };
  const removeEditIngredient = (ingredientId: number) => {
    setEditIngredients((prev) => prev.filter((s) => s.ingredientId !== ingredientId));
  };
  const setEditIngredientQuantity = (ingredientId: number, quantity: number) => {
    setEditIngredients((prev) =>
      prev.map((s) => (s.ingredientId === ingredientId ? { ...s, quantity } : s))
    );
  };

  const addEditStep = () => setEditSteps((prev) => [...prev, '']);
  const removeEditStep = (index: number) => setEditSteps((prev) => prev.filter((_, i) => i !== index));
  const setEditStep = (index: number, value: string) =>
    setEditSteps((prev) => prev.map((s, i) => (i === index ? value : s)));

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editName.trim()) return;
    const stepsFiltered = editSteps.map((s) => s.trim()).filter(Boolean);
    updateRecipe.mutate({
      id: numericId,
      data: {
        name: editName.trim(),
        servings: editServings,
        recipe_ingredients: editIngredients.map(({ ingredientId, quantity }) => ({
          ingredient: ingredientId,
          quantity,
        })),
        recipe_steps: stepsFiltered.map((description, i) => ({ step_number: i + 1, description })),
      },
    });
  };

  if (Number.isNaN(numericId) || numericId < 1) {
    return (
      <div className="space-y-4">
        <Breadcrumbs items={[{ label: 'Meals', href: '/' }]} />
        <div className="text-center py-12">
          <p className="text-palette-taupe">Invalid recipe</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return <div className="text-center py-12 text-palette-slate">Loading…</div>;
  }

  if (isError || !recipe) {
    return (
      <div className="space-y-4">
        <Breadcrumbs items={[{ label: 'Meals', href: '/' }]} />
        <div className="text-center py-12">
          <p className="text-palette-taupe">Meal not found</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <Breadcrumbs
          items={[
            { label: 'Meals', href: '/' },
            { label: recipe.name },
          ]}
        />
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-3xl font-semibold text-palette-taupe mb-2">{recipe.name}</h2>
          </div>
          <div className="text-right flex flex-col items-end gap-2">
            <Button onClick={openEditDialog}>
              <Pencil className="w-4 h-4 mr-2" />
              Edit meal
            </Button>
            {costData && (
              <div className="flex items-center gap-2 text-palette-slate text-xl">
                <DollarSign className="w-6 h-6" />
                <span>{costData.costPerServing.toFixed(2)}/serving{costData.costPartiallyUnknown && "?"}</span>
              </div>
            )}
          </div>
        </div>

        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit meal</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSaveEdit} className="space-y-4 mt-2">
              <div>
                <label className="block text-sm font-medium text-palette-slate mb-1">Name</label>
                <Input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder="e.g. Greek salad"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-palette-slate mb-1">Servings</label>
                <Input
                  type="number"
                  min={1}
                  value={editServings}
                  onChange={(e) => setEditServings(Number(e.target.value) || 1)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-palette-slate mb-1">Ingredients</label>
                {editIngredients.length > 0 && (
                  <ul className="space-y-2 mb-3 p-3 border border-palette-mist rounded-md bg-palette-cream/30">
                    {editIngredients.map((sel) => (
                      <li key={sel.ingredientId} className="flex items-center gap-2 text-sm">
                        <span className="flex-1 truncate text-palette-taupe">{sel.name}</span>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <Input
                            type="number"
                            min={0}
                            step="any"
                            value={sel.quantity}
                            onChange={(e) => setEditIngredientQuantity(sel.ingredientId, Number(e.target.value) || 0)}
                            className="w-20 h-8 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                          />
                          <span className="text-palette-slate text-xs w-6">{sel.unit}</span>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 shrink-0 p-0"
                          onClick={() => removeEditIngredient(sel.ingredientId)}
                          aria-label="Remove"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </li>
                    ))}
                  </ul>
                )}
                <div className="relative" ref={editIngredientDropdownRef}>
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full justify-between h-10 font-normal text-palette-slate"
                    onClick={() => setEditIngredientDropdownOpen((o) => !o)}
                    aria-expanded={editIngredientDropdownOpen}
                    aria-haspopup="listbox"
                  >
                    <span>Add ingredient...</span>
                    <ChevronDown className={`w-4 h-4 shrink-0 transition-transform ${editIngredientDropdownOpen ? 'rotate-180' : ''}`} />
                  </Button>
                  {editIngredientDropdownOpen && (
                    <div className="absolute z-10 top-full left-0 right-0 mt-1 border border-palette-mist rounded-md bg-white shadow-lg">
                      <div className="p-2 border-b border-palette-mist">
                        <Input
                          placeholder="Search ingredients..."
                          value={editIngredientSearch}
                          onChange={(e) => setEditIngredientSearch(e.target.value)}
                          className="h-9"
                          autoFocus
                        />
                      </div>
                      <ul className="max-h-48 overflow-y-auto p-1" role="listbox">
                        {editIngredientsList.length === 0 ? (
                          <li className="px-2 py-2 text-sm text-palette-slate">
                            {editIngredientSearch.trim() ? 'No ingredients found' : 'Type to search ingredients'}
                          </li>
                        ) : (
                          editIngredientsList.map((ing) => (
                            <li key={ing.id} role="option">
                              <button
                                type="button"
                                onClick={() => addEditIngredient(ing)}
                                disabled={editIngredients.some((s) => s.ingredientId === ing.id)}
                                className="w-full text-left px-2 py-1.5 text-sm rounded hover:bg-palette-mist disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                {ing.name}
                              </button>
                            </li>
                          ))
                        )}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-palette-slate mb-1">Steps</label>
                {editSteps.length > 0 && (
                  <ul className="space-y-2 mb-3 p-3 border border-palette-mist rounded-md bg-palette-cream/30">
                    {editSteps.map((step, index) => (
                      <li key={index} className="flex items-center gap-2 text-sm">
                        <span className="shrink-0 w-5 text-palette-slate font-medium">{index + 1}.</span>
                        <Input
                          value={step}
                          onChange={(e) => setEditStep(index, e.target.value)}
                          placeholder={`Step ${index + 1}`}
                          className="flex-1 h-8"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 shrink-0 p-0"
                          onClick={() => removeEditStep(index)}
                          aria-label="Remove step"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </li>
                    ))}
                  </ul>
                )}
                <Button type="button" variant="outline" size="sm" onClick={addEditStep} className="w-full justify-center">
                  <Plus className="w-4 h-4 mr-2" />
                  Add step
                </Button>
              </div>
              {updateRecipe.isError && (
                <p className="text-sm text-red-600">Failed to save changes. Try again.</p>
              )}
              <div className="flex gap-2 justify-end">
                <Button type="button" variant="outline" onClick={() => setEditDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={updateRecipe.isPending}>
                  {updateRecipe.isPending ? 'Saving…' : 'Save'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Servings
              </CardTitle>
            </CardHeader>
            <CardContent className="py-2 mb-2">
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setServings(Math.max(1, servings - 1))}
                  className="h-8 w-8 p-0 shrink-0"
                >
                  -
                </Button>
                <Input
                  type="number"
                  value={servings}
                  onChange={(e) => setServings(Math.max(1, Number(e.target.value)))}
                  className="w-14 h-8 text-center text-sm py-1"
                  min={0}
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setServings(servings + 1)}
                  className="h-8 w-8 p-0 shrink-0"
                >
                  +
                </Button>
                <Button className="text-xs shrink-0 h-8" onClick={() => setServings(baseServings)}>{baseServings} (Original)</Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Ingredients</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Ingredient</TableHead>
                    <TableHead className="text-right">Quantity</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {scaledIngredients.length === 0 ? (
                    <TableRow>
                      <TableCell className="text-palette-taupe text-center py-4">
                        No ingredients in database for this recipe.
                      </TableCell>
                      <TableCell className="text-palette-taupe text-center py-4" />
                    </TableRow>
                  ) : (
                    scaledIngredients.map((item, index) => (
                      <TableRow
                        key={item.ingredient?.id ?? index}
                        className="cursor-pointer hover:bg-palette-mist"
                        onClick={() => navigate(`/ingredient/${item.ingredient?.id}`)}
                      >
                        <TableCell>{item.ingredient?.name ?? '—'}</TableCell>
                        <TableCell className="text-right">
                          {item.quantity.toFixed(2)} {item.unit}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          {nutritionData && (
            <Card>
              <CardHeader onClick={() => setShowNutritionLabel(!showNutritionLabel)}>
                <div className="flex items-center gap-2 cursor-pointer justify-content">
                  <CardTitle>Nutrition</CardTitle>
                  <Button variant="outline" size="sm" className="ml-auto">
                    {showNutritionLabel ? 'See Summary' : 'See Label'}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {showNutritionLabel ? (
                  <NutritionLabel nutritionStats={nutritionData.nutritionPerServing} per_unit="Serving" />
                ) :
                  <div className="space-y-3">
                    <div className="text-center py-4 bg-palette-cream rounded-lg">
                      <div className="text-3xl font-semibold text-palette-terracotta">
                        {Math.round(nutritionData.nutritionPerServing.kcal_per_unit)}
                      </div>
                      <div className="text-sm text-palette-slate">Calories per serving</div>
                    </div>
                    <div className="grid grid-cols-3 gap-4 pt-4 border-t border-palette-mist">
                      <div className="text-center">
                        <div className="text-lg font-semibold text-palette-slate">
                          {Math.round(nutritionData.nutritionPerServing.protein_grams_per_unit)}g
                        </div>
                        <div className="text-xs text-palette-slate">Protein</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-semibold text-palette-taupe">
                          {Math.round(nutritionData.nutritionPerServing.carbohydrate_sugar_grams_per_unit + nutritionData.nutritionPerServing.carbohydrate_fiber_grams_per_unit)}g
                        </div>
                        <div className="text-xs text-palette-slate">Carbs</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-semibold text-palette-terracotta">
                          {Math.round(nutritionData.nutritionPerServing.fat_saturated_grams_per_unit + nutritionData.nutritionPerServing.fat_trans_grams_per_unit)}g
                        </div>
                        <div className="text-xs text-palette-slate">Fat</div>
                      </div>
                    </div>
                    <div className="pt-3 border-t border-palette-mist text-xs text-palette-taupe">
                      <div className="flex justify-between">
                        <span>Total for {servings} servings:</span>
                        <span>{Math.round(nutritionData.nutritionPerServing.kcal_per_unit * servings)} cal</span>
                      </div>
                    </div>
                  </div>
                }
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Cooking Instructions</CardTitle>
            </CardHeader>
            <CardContent>
              {recipe.steps.length ? (
                <ol className="space-y-3">
                  {recipe.steps.map((step) => (
                    <li key={step.step_number} className="flex gap-3">
                      <span className="flex-shrink-0 w-6 h-6 rounded-full bg-palette-terracotta text-palette-cream flex items-center justify-center text-sm font-medium">
                        {step.step_number}
                      </span>
                      <span className="text-sm text-palette-slate pt-0.5">{step.description}</span>
                    </li>
                  ))}
                </ol>
              ) : (
                <p className="text-sm text-palette-slate">No instructions in database.</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
