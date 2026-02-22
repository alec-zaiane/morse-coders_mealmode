import { useState, useMemo, useRef, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { calculateRecipeNutrition, calculateRecipeCost } from '../utils/calculations';
import { Search, DollarSign, Flame, Plus, X, ChevronDown } from 'lucide-react';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { RecipeCard } from '../components/recipecard';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../components/ui/dialog';
import { useRecipesList, useTagsList, useRecipesCreate, useIngredientsList } from '../api/mealmodeAPI';
import { getRecipesListQueryKey } from '../api/mealmodeAPI';
import type { Tag, Ingredient } from '../api/mealmodeAPI';

function ingredientUnitLabel(ing: Ingredient): string {
  const u = ing.nutrition_stats?.base_unit;
  if (u === 'kg') return 'kg';
  if (u === 'L') return 'L';
  if (u === 'pc') return 'pc';
  return '—';
}

type SelectedIngredient = { ingredientId: number; quantity: number; name: string; unit: string };

export function MealListPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [ingredientSearch, setIngredientSearch] = useState('');
  const { data: recipeData, isError: recipeIsError, isLoading: recipeIsLoading } = useRecipesList();
  const { data: tagData } = useTagsList();
  const { data: ingredientsResponse } = useIngredientsList({
    limit: 50,
    ...(ingredientSearch.trim() && { search: ingredientSearch.trim() }),
  });
  const ingredientsList: Ingredient[] = ingredientsResponse?.data?.results ?? [];
  const createRecipe = useRecipesCreate({
    mutation: {
      onSuccess: (response) => {
        queryClient.invalidateQueries({ queryKey: getRecipesListQueryKey() });
        const res = response as { data?: { id?: number } };
        const id = res?.data?.id ?? (res as { id?: number })?.id;
        if (id != null) navigate(`/meal/${id}`);
      },
    },
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTags, setSelectedTags] = useState<Tag[]>([]);
  const [maxCost, setMaxCost] = useState<number | null>(null);
  const [maxCalories, setMaxCalories] = useState<number | null>(null);
  const [addMealOpen, setAddMealOpen] = useState(false);
  const [newMealName, setNewMealName] = useState('');
  const [newMealServings, setNewMealServings] = useState(1);
  const [newMealSteps, setNewMealSteps] = useState<string[]>([]);
  const [selectedIngredients, setSelectedIngredients] = useState<SelectedIngredient[]>([]);
  const [ingredientDropdownOpen, setIngredientDropdownOpen] = useState(false);
  const ingredientDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ingredientDropdownOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (ingredientDropdownRef.current && !ingredientDropdownRef.current.contains(e.target as Node)) {
        setIngredientDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [ingredientDropdownOpen]);

  const filteredMeals = useMemo(() => {
    return recipeData?.data.results?.filter((recipe) => {
      if (searchTerm && !recipe.name.toLowerCase().includes(searchTerm.toLowerCase())) return false;
      if (selectedTags.length > 0 && !selectedTags.some((tag) => recipe.tags?.some((t) => t.id === tag.id))) return false;
      if (maxCost !== null) {
        const { costPerServing } = calculateRecipeCost(recipe);
        if (costPerServing > maxCost) return false;
      }
      if (maxCalories !== null) {
        const { nutritionPerServing } = calculateRecipeNutrition(recipe);
        if (nutritionPerServing.kcal_per_unit > maxCalories) return false;
      }
      return true;
    });
  }, [recipeData, searchTerm, selectedTags, maxCost, maxCalories]);

  const toggleTag = (tag: Tag) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const addIngredient = (ing: Ingredient, quantity = 1) => {
    if (selectedIngredients.some((s) => s.ingredientId === ing.id)) return;
    setSelectedIngredients((prev) => [
      ...prev,
      { ingredientId: ing.id, quantity, name: ing.name, unit: ingredientUnitLabel(ing) },
    ]);
  };

  const removeIngredient = (ingredientId: number) => {
    setSelectedIngredients((prev) => prev.filter((s) => s.ingredientId !== ingredientId));
  };

  const setIngredientQuantity = (ingredientId: number, quantity: number) => {
    setSelectedIngredients((prev) =>
      prev.map((s) => (s.ingredientId === ingredientId ? { ...s, quantity } : s))
    );
  };

  const addStep = () => setNewMealSteps((prev) => [...prev, '']);
  const removeStep = (index: number) => setNewMealSteps((prev) => prev.filter((_, i) => i !== index));
  const setStep = (index: number, value: string) =>
    setNewMealSteps((prev) => prev.map((s, i) => (i === index ? value : s)));

  const handleAddMeal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMealName.trim()) return;
    const stepsFiltered = newMealSteps.map((s) => s.trim()).filter(Boolean);
    const payload = {
      name: newMealName.trim(),
      servings: newMealServings,
      ...(selectedIngredients.length > 0 && {
        recipe_ingredients: selectedIngredients.map(({ ingredientId, quantity }) => ({
          ingredient: ingredientId,
          quantity,
        })),
      }),
      ...(stepsFiltered.length > 0 && {
        recipe_steps: stepsFiltered.map((description, i) => ({
          step_number: i + 1,
          description,
        })),
      }),
    };
    createRecipe.mutate({ data: payload });
    setNewMealName('');
    setNewMealServings(1);
    setNewMealSteps([]);
    setSelectedIngredients([]);
    setIngredientSearch('');
    setAddMealOpen(false);
  };

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-palette-taupe mb-2">Meals</h2>
          <p className="text-palette-slate">Browse and search your meal collection</p>
        </div>
        <Dialog open={addMealOpen} onOpenChange={setAddMealOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Add meal
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Add meal</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleAddMeal} className="space-y-4 mt-2">
              <div>
                <label className="block text-sm font-medium text-palette-slate mb-1">Name</label>
                <Input
                  value={newMealName}
                  onChange={(e) => setNewMealName(e.target.value)}
                  placeholder="e.g. Greek salad"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-palette-slate mb-1">Servings</label>
                <Input
                  type="number"
                  min={1}
                  value={newMealServings}
                  onChange={(e) => setNewMealServings(Number(e.target.value))}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-palette-slate mb-1">Ingredients</label>
                {selectedIngredients.length > 0 && (
                  <ul className="space-y-2 mb-3 p-3 border border-palette-mist rounded-md bg-palette-cream/30">
                    {selectedIngredients.map((sel) => (
                      <li key={sel.ingredientId} className="flex items-center gap-2 text-sm">
                        <span className="flex-1 truncate text-palette-taupe">{sel.name}</span>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <Input
                            type="number"
                            min={0}
                            step="any"
                            value={sel.quantity}
                            onChange={(e) => setIngredientQuantity(sel.ingredientId, Number(e.target.value))}
                            className="w-20 h-8 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                          />
                          <span className="text-palette-slate text-xs w-6">{sel.unit}</span>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 shrink-0 p-0"
                          onClick={() => removeIngredient(sel.ingredientId)}
                          aria-label="Remove"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </li>
                    ))}
                  </ul>
                )}
                <div className="relative" ref={ingredientDropdownRef}>
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full justify-between h-10 font-normal text-palette-slate"
                    onClick={() => setIngredientDropdownOpen((o) => !o)}
                    aria-expanded={ingredientDropdownOpen}
                    aria-haspopup="listbox"
                  >
                    <span>Add ingredient...</span>
                    <ChevronDown className={`w-4 h-4 shrink-0 transition-transform ${ingredientDropdownOpen ? 'rotate-180' : ''}`} />
                  </Button>
                  {ingredientDropdownOpen && (
                    <div className="absolute z-10 top-full left-0 right-0 mt-1 border border-palette-mist rounded-md bg-white shadow-lg">
                      <div className="p-2 border-b border-palette-mist">
                        <Input
                          placeholder="Search ingredients..."
                          value={ingredientSearch}
                          onChange={(e) => setIngredientSearch(e.target.value)}
                          className="h-9"
                          autoFocus
                        />
                      </div>
                      <ul className="max-h-48 overflow-y-auto p-1" role="listbox">
                        {ingredientsList.length === 0 ? (
                          <li className="px-2 py-2 text-sm text-palette-slate">
                            {ingredientSearch.trim() ? 'No ingredients found' : 'Type to search ingredients'}
                          </li>
                        ) : (
                          ingredientsList.map((ing) => (
                            <li key={ing.id} role="option">
                              <button
                                type="button"
                                onClick={() => addIngredient(ing)}
                                disabled={selectedIngredients.some((s) => s.ingredientId === ing.id)}
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
                {newMealSteps.length > 0 && (
                  <ul className="space-y-2 mb-3 p-3 border border-palette-mist rounded-md bg-palette-cream/30">
                    {newMealSteps.map((step, index) => (
                      <li key={index} className="flex items-center gap-2 text-sm">
                        <span className="shrink-0 w-5 text-palette-slate font-medium">{index + 1}.</span>
                        <Input
                          value={step}
                          onChange={(e) => setStep(index, e.target.value)}
                          placeholder={`Step ${index + 1}`}
                          className="flex-1 h-8"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 shrink-0 p-0"
                          onClick={() => removeStep(index)}
                          aria-label="Remove step"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </li>
                    ))}
                  </ul>
                )}
                <Button type="button" variant="outline" size="sm" onClick={addStep} className="w-full justify-center">
                  <Plus className="w-4 h-4 mr-2" />
                  Add step
                </Button>
              </div>
              {createRecipe.isError && (
                <p className="text-sm text-red-600">Failed to create meal. Try again.</p>
              )}
              <div className="flex gap-2 justify-end">
                <Button type="button" variant="outline" onClick={() => setAddMealOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createRecipe.isPending}>
                  {createRecipe.isPending ? 'Creating…' : 'Create'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-palette-slate" />
          <Input
            type="text"
            placeholder="Search meals..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        <div className="flex flex-wrap gap-3 items-center">
          <div className="flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-palette-slate" />
            <Input
              type="number"
              placeholder="Max cost/serving"
              value={maxCost ?? ''}
              onChange={(e) => setMaxCost(e.target.value ? Number(e.target.value) : null)}
              className="w-40"
              step="0.5"
            />
          </div>
          <div className="flex items-center gap-2">
            <Flame className="w-4 h-4 text-palette-slate" />
            <Input
              type="number"
              placeholder="Max calories"
              value={maxCalories ?? ''}
              onChange={(e) => setMaxCalories(e.target.value ? Number(e.target.value) : null)}
              className="w-40"
            />
          </div>
          {selectedTags.length > 0 && (
            <Button variant="outline" size="sm" onClick={() => setSelectedTags([])}>
              Clear filters
            </Button>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          {tagData?.data.results?.map((tag) => (
            <Badge
              key={tag.id}
              variant={selectedTags.includes(tag) ? 'default' : 'outline'}
              className="cursor-pointer"
              onClick={() => toggleTag(tag)}
            >
              {tag.name}
            </Badge>
          ))}
        </div>
      </div>
      {!recipeIsError && !recipeIsLoading && filteredMeals && (
        <div>
          <div className="mb-4 text-sm text-palette-slate">
            Showing {filteredMeals.length} of {recipeData?.data.count ?? "unknown"} meals
          </div>
          {
            filteredMeals.length === 0 && (
              <div className="text-center py-12 text-palette-taupe">
                No meals found matching your criteria
              </div>
            )
          }
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {
              filteredMeals.map((recipe) => { return (<RecipeCard recipe={recipe} key={recipe.id} />) })
            }
          </div>
        </div>
      )}

    </div>
  );
}
