import { useState, useMemo, useRef, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { calculateRecipeNutrition, calculateRecipeCost } from '../utils/calculations';
import { Search, DollarSign, Flame, Plus, X, ChevronDown, Sparkles, Salad, BadgeDollarSign, Activity, UtensilsCrossed, Link as LinkIcon } from 'lucide-react';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { RecipeCard } from '../components/recipecard';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../components/ui/dialog';
import {
  useRecipesList,
  useTagsList,
  useRecipesCreate,
  useIngredientsList,
  useConfirmableRecipesLoadRecipeCreate,
  useConfirmableRecipesConfirmCreate,
  useConfirmableRecipesPartialUpdate,
  useConfirmableRecipeIngredientsCreate,
  useConfirmableRecipeIngredientsPartialUpdate,
  useConfirmableRecipeIngredientsDestroy,
  useConfirmableRecipeStepsCreate,
  useConfirmableRecipeStepsPartialUpdate,
  useConfirmableRecipeStepsDestroy,
} from '../api/mealmodeAPI';
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
type ReviewIngredient = {
  id?: number;
  source_text: string;
  confidence: number;
  quantity: number;
  best_guess_ingredient: number | null;
  manual_name: string;
};
type ReviewStep = {
  id?: number;
  step_number: number;
  description: string;
};
type ReviewDraft = {
  id: number;
  name: string;
  source_url: string;
  prep_time_minutes: number | null;
  cook_time_minutes: number | null;
  servings: number | null;
  ingredients: ReviewIngredient[];
  steps: ReviewStep[];
};

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
  const { data: importIngredientOptionsResponse } = useIngredientsList({ limit: 500 });
  const importIngredientOptions: Ingredient[] = importIngredientOptionsResponse?.data?.results ?? [];
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
  const [importOpen, setImportOpen] = useState(false);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [importUrl, setImportUrl] = useState('');
  const [importError, setImportError] = useState<string | null>(null);
  const [reviewError, setReviewError] = useState<string | null>(null);
  const [reviewDraft, setReviewDraft] = useState<ReviewDraft | null>(null);
  const [initialIngredientIds, setInitialIngredientIds] = useState<number[]>([]);
  const [initialStepIds, setInitialStepIds] = useState<number[]>([]);
  const [isFinalizingImport, setIsFinalizingImport] = useState(false);
  const [newMealName, setNewMealName] = useState('');
  const [newMealServings, setNewMealServings] = useState(1);
  const [newMealSteps, setNewMealSteps] = useState<string[]>([]);
  const [selectedIngredients, setSelectedIngredients] = useState<SelectedIngredient[]>([]);
  const [ingredientDropdownOpen, setIngredientDropdownOpen] = useState(false);
  const ingredientDropdownRef = useRef<HTMLDivElement>(null);
  const loadRecipe = useConfirmableRecipesLoadRecipeCreate();
  const confirmRecipe = useConfirmableRecipesConfirmCreate();
  const patchConfirmableRecipe = useConfirmableRecipesPartialUpdate();
  const createConfirmableIngredient = useConfirmableRecipeIngredientsCreate();
  const patchConfirmableIngredient = useConfirmableRecipeIngredientsPartialUpdate();
  const deleteConfirmableIngredient = useConfirmableRecipeIngredientsDestroy();
  const createConfirmableStep = useConfirmableRecipeStepsCreate();
  const patchConfirmableStep = useConfirmableRecipeStepsPartialUpdate();
  const deleteConfirmableStep = useConfirmableRecipeStepsDestroy();

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

  const recipeInsights = useMemo(() => {
    const recipes = filteredMeals ?? [];
    if (recipes.length === 0) {
      return {
        avgCost: null as number | null,
        avgCalories: null as number | null,
        quickTags: [] as string[],
      };
    }

    let totalCost = 0;
    let totalCalories = 0;
    const tagCounts = new Map<string, number>();

    recipes.forEach((recipe) => {
      const { costPerServing } = calculateRecipeCost(recipe);
      const { nutritionPerServing } = calculateRecipeNutrition(recipe);
      totalCost += Number.isFinite(costPerServing) ? costPerServing : 0;
      totalCalories += Number.isFinite(nutritionPerServing.kcal_per_unit) ? nutritionPerServing.kcal_per_unit : 0;
      recipe.tags?.forEach((tag) => {
        tagCounts.set(tag.name, (tagCounts.get(tag.name) ?? 0) + 1);
      });
    });

    const quickTags = Array.from(tagCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4)
      .map(([name]) => name);

    return {
      avgCost: totalCost / recipes.length,
      avgCalories: totalCalories / recipes.length,
      quickTags,
    };
  }, [filteredMeals]);

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

  const handleImportRecipe = async (e: React.FormEvent) => {
    e.preventDefault();
    setImportError(null);
    const url = importUrl.trim();
    if (!url) {
      setImportError('Recipe URL is required.');
      return;
    }

    try {
      const loadResponse = await loadRecipe.mutateAsync({ data: { url } });
      const confirmable = loadResponse.data;
      const draft: ReviewDraft = {
        id: confirmable.id,
        name: confirmable.name,
        source_url: confirmable.source_url ?? url,
        prep_time_minutes: confirmable.prep_time_minutes ?? null,
        cook_time_minutes: confirmable.cook_time_minutes ?? null,
        servings: confirmable.servings ?? 1,
        ingredients: (confirmable.ingredients_list ?? []).map((ingredient) => ({
          id: ingredient.id,
          source_text: ingredient.source_text,
          confidence: ingredient.confidence,
          quantity: ingredient.quantity,
          best_guess_ingredient: ingredient.best_guess_ingredient ?? null,
          manual_name: '',
        })),
        steps: (confirmable.steps_list ?? []).map((step) => ({
          id: step.id,
          step_number: step.step_number,
          description: step.description,
        })),
      };
      setReviewDraft(draft);
      setInitialIngredientIds(draft.ingredients.map((ingredient) => ingredient.id).filter((id): id is number => id != null));
      setInitialStepIds(draft.steps.map((step) => step.id).filter((id): id is number => id != null));
      setImportOpen(false);
      setReviewOpen(true);
    } catch (err) {
      const eObj = err as { response?: { data?: { error?: string } } };
      setImportError(eObj?.response?.data?.error ?? 'Failed to load recipe. Check the URL and try again.');
    }
  };

  const updateReviewDraft = (updater: (draft: ReviewDraft) => ReviewDraft) => {
    setReviewDraft((prev) => (prev ? updater(prev) : prev));
  };

  const updateReviewIngredient = (index: number, update: Partial<ReviewIngredient>) => {
    updateReviewDraft((draft) => ({
      ...draft,
      ingredients: draft.ingredients.map((ingredient, ingredientIndex) =>
        ingredientIndex === index ? { ...ingredient, ...update } : ingredient
      ),
    }));
  };

  const removeReviewIngredient = (index: number) => {
    updateReviewDraft((draft) => ({
      ...draft,
      ingredients: draft.ingredients.filter((_, ingredientIndex) => ingredientIndex !== index),
    }));
  };

  const addReviewIngredient = () => {
    updateReviewDraft((draft) => ({
      ...draft,
      ingredients: [
        ...draft.ingredients,
        {
          source_text: '',
          quantity: 0,
          confidence: 0,
          best_guess_ingredient: null,
          manual_name: '',
        },
      ],
    }));
  };

  const updateReviewStep = (index: number, description: string) => {
    updateReviewDraft((draft) => ({
      ...draft,
      steps: draft.steps.map((step, stepIndex) =>
        stepIndex === index ? { ...step, description } : step
      ),
    }));
  };

  const addReviewStep = () => {
    updateReviewDraft((draft) => ({
      ...draft,
      steps: [
        ...draft.steps,
        {
          step_number: draft.steps.length + 1,
          description: '',
        },
      ],
    }));
  };

  const removeReviewStep = (index: number) => {
    updateReviewDraft((draft) => ({
      ...draft,
      steps: draft.steps
        .filter((_, stepIndex) => stepIndex !== index)
        .map((step, stepIndex) => ({ ...step, step_number: stepIndex + 1 })),
    }));
  };

  const handleFinalizeImport = async (e: React.FormEvent) => {
    e.preventDefault();
    setReviewError(null);
    if (!reviewDraft) return;

    const normalizedSteps = reviewDraft.steps.map((step, index) => ({
      ...step,
      step_number: index + 1,
    }));

    const currentIngredientIds = new Set(
      reviewDraft.ingredients.map((ingredient) => ingredient.id).filter((id): id is number => id != null)
    );
    const currentStepIds = new Set(
      normalizedSteps.map((step) => step.id).filter((id): id is number => id != null)
    );

    setIsFinalizingImport(true);
    try {
      await patchConfirmableRecipe.mutateAsync({
        id: reviewDraft.id,
        data: {
          name: reviewDraft.name.trim(),
          source_url: reviewDraft.source_url.trim(),
          prep_time_minutes: reviewDraft.prep_time_minutes,
          cook_time_minutes: reviewDraft.cook_time_minutes,
          servings: reviewDraft.servings,
        },
      });

      for (const ingredientId of initialIngredientIds) {
        if (!currentIngredientIds.has(ingredientId)) {
          await deleteConfirmableIngredient.mutateAsync({ id: ingredientId });
        }
      }

      for (const ingredient of reviewDraft.ingredients) {
        let bestGuessIngredient = ingredient.best_guess_ingredient;
        if (bestGuessIngredient == null) {
          const manual = ingredient.manual_name.trim();
          if (!manual) {
            throw new Error('Each unmatched ingredient needs a typed ingredient name.');
          }
          const matchedOption = importIngredientOptions.find(
            (option) => option.name.trim().toLowerCase() === manual.toLowerCase()
          );
          if (!matchedOption) {
            throw new Error(`No ingredient named "${manual}" exists. Type an existing ingredient name exactly.`);
          }
          bestGuessIngredient = matchedOption.id;
        }

        const payload = {
          source_text: ingredient.source_text.trim(),
          quantity: ingredient.quantity,
          confidence: ingredient.confidence,
          best_guess_ingredient: bestGuessIngredient,
          confirmable_recipe: reviewDraft.id,
        };
        if (ingredient.id != null) {
          await patchConfirmableIngredient.mutateAsync({
            id: ingredient.id,
            data: payload,
          });
        } else {
          await createConfirmableIngredient.mutateAsync({
            data: payload,
          });
        }
      }

      for (const stepId of initialStepIds) {
        if (!currentStepIds.has(stepId)) {
          await deleteConfirmableStep.mutateAsync({ id: stepId });
        }
      }

      for (const step of normalizedSteps) {
        const payload = {
          step_number: step.step_number,
          description: step.description.trim(),
          confirmable_recipe: reviewDraft.id,
        };
        if (step.id != null) {
          await patchConfirmableStep.mutateAsync({
            id: step.id,
            data: payload,
          });
        } else {
          await createConfirmableStep.mutateAsync({
            data: payload,
          });
        }
      }

      const confirmResponse = await confirmRecipe.mutateAsync({
        id: reviewDraft.id,
        data: {} as never,
      });
      const recipeId = confirmResponse.data.recipe_id;
      queryClient.invalidateQueries({ queryKey: getRecipesListQueryKey() });
      setImportUrl('');
      setReviewOpen(false);
      setReviewDraft(null);
      setInitialIngredientIds([]);
      setInitialStepIds([]);
      if (recipeId != null) navigate(`/meal/${recipeId}`);
    } catch (err) {
      const eObj = err as { response?: { data?: { error?: string } } };
      setReviewError(eObj?.response?.data?.error ?? 'Failed to finalize import. Review fields and try again.');
    } finally {
      setIsFinalizingImport(false);
    }
  };

  return (
    <div className="space-y-6 sm:space-y-8 animate-fadeIn">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="font-brand text-2xl md:text-3xl font-semibold text-palette-taupe mb-2 flex items-center gap-2 tracking-tight">
            <UtensilsCrossed className="h-7 w-7 text-palette-terracotta" aria-hidden />
            Your Recipe Library
          </h2>
          <p className="text-palette-textMuted text-sm font-medium">Discover, manage, and plan your culinary journey.</p>
        </div>
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
          <Dialog
            open={importOpen}
            onOpenChange={(open) => {
              setImportOpen(open);
              if (!open) setImportError(null);
            }}
          >
            <DialogTrigger asChild>
              <Button variant="outline" className="w-full border-palette-primary text-palette-primary hover:bg-palette-primary/5 sm:w-auto">
                <LinkIcon className="w-4 h-4 mr-2" />
                Import Recipe
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md" overlayClassName="bg-slate-500/65 backdrop-blur-[1px]">
              <DialogHeader>
                <DialogTitle>Import recipe by URL</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleImportRecipe} className="space-y-4 mt-2">
                <div>
                  <label className="block text-sm font-bold text-palette-text mb-2">Recipe URL</label>
                  <Input
                    type="url"
                    value={importUrl}
                    onChange={(e) => setImportUrl(e.target.value)}
                    placeholder="https://www.allrecipes.com/recipe/..."
                    required
                  />
                  <p className="text-xs text-palette-textMuted mt-2">
                    We&apos;ll load a preview first, then you can edit everything before confirming import.
                  </p>
                </div>
                {importError && (
                  <p className="text-sm text-red-600">{importError}</p>
                )}
                <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end mt-8">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => {
                      setImportOpen(false);
                      setImportError(null);
                    }}
                    className="w-full px-6 text-palette-textMuted sm:w-auto"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={loadRecipe.isPending}
                    className="w-full sm:w-auto"
                  >
                    {loadRecipe.isPending ? 'Loading preview…' : 'Preview'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
          <Dialog
            open={reviewOpen}
            onOpenChange={(open) => {
              setReviewOpen(open);
              if (!open) setReviewError(null);
            }}
          >
            <DialogContent className="sm:!max-w-[1200px] sm:!w-[96vw]" overlayClassName="bg-slate-500/65 backdrop-blur-[1px]">
              <DialogHeader>
                <DialogTitle>Review imported recipe</DialogTitle>
              </DialogHeader>
              {reviewDraft && (
                <form onSubmit={handleFinalizeImport} className="space-y-5 mt-2">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="sm:col-span-2">
                      <label className="block text-sm font-bold text-palette-text mb-2">Recipe Name</label>
                      <Input
                        value={reviewDraft.name}
                        onChange={(e) => updateReviewDraft((draft) => ({ ...draft, name: e.target.value }))}
                        required
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-sm font-bold text-palette-text mb-2">Source URL</label>
                      <Input
                        type="url"
                        value={reviewDraft.source_url}
                        onChange={(e) => updateReviewDraft((draft) => ({ ...draft, source_url: e.target.value }))}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-palette-text mb-2">Servings</label>
                      <Input
                        type="number"
                        min={1}
                        value={reviewDraft.servings ?? ''}
                        onChange={(e) => {
                          const value = e.target.value;
                          updateReviewDraft((draft) => ({
                            ...draft,
                            servings: value === '' ? null : Number(value),
                          }));
                        }}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-palette-text mb-2">Prep Time (min)</label>
                      <Input
                        type="number"
                        min={0}
                        value={reviewDraft.prep_time_minutes ?? ''}
                        onChange={(e) => {
                          const value = e.target.value;
                          updateReviewDraft((draft) => ({
                            ...draft,
                            prep_time_minutes: value === '' ? null : Number(value),
                          }));
                        }}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-palette-text mb-2">Cook Time (min)</label>
                      <Input
                        type="number"
                        min={0}
                        value={reviewDraft.cook_time_minutes ?? ''}
                        onChange={(e) => {
                          const value = e.target.value;
                          updateReviewDraft((draft) => ({
                            ...draft,
                            cook_time_minutes: value === '' ? null : Number(value),
                          }));
                        }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-sm font-bold text-palette-text">Ingredients</label>
                      <Button type="button" variant="outline" onClick={addReviewIngredient}>
                        <Plus className="w-4 h-4 mr-1" />
                        Add ingredient
                      </Button>
                    </div>
                    <div className="relative">
                      <div className="absolute top-0 left-0 right-2 h-6 bg-gradient-to-b from-white to-transparent pointer-events-none z-10" />
                      <div className="space-y-2 max-h-64 overflow-y-auto pr-1 pb-4 pt-2">
                        {reviewDraft.ingredients.map((ingredient, index) => (
                        <div key={ingredient.id ?? `new-ingredient-${index}`} className="grid grid-cols-1 sm:grid-cols-12 gap-2 rounded-xl border border-palette-border p-3 bg-[#F5F4F1]/40">
                          <div className="sm:col-span-4">
                            <label className="block text-xs font-semibold text-palette-textMuted mb-1">Original text</label>
                            <Input
                              value={ingredient.source_text}
                              readOnly
                              className="bg-black/5 text-palette-textMuted cursor-not-allowed border-transparent"
                            />
                          </div>
                          <div className="sm:col-span-2">
                            <label className="block text-xs font-semibold text-palette-textMuted mb-1">Quantity</label>
                            <Input
                              type="number"
                              step="any"
                              min={0}
                              value={ingredient.quantity}
                              onChange={(e) => updateReviewIngredient(index, { quantity: Number(e.target.value) })}
                            />
                          </div>
                          <div className="sm:col-span-2">
                            <label className="block text-xs font-semibold text-palette-textMuted mb-1">Confidence</label>
                            <Input
                              type="number"
                              step="0.01"
                              min={0}
                              max={1}
                              value={ingredient.confidence}
                              onChange={(e) => updateReviewIngredient(index, { confidence: Number(e.target.value) })}
                            />
                          </div>
                          <div className="sm:col-span-3">
                            <label className="block text-xs font-semibold text-palette-textMuted mb-1">
                              {ingredient.best_guess_ingredient == null ? 'Type ingredient name' : 'Matched ingredient'}
                            </label>
                            {ingredient.best_guess_ingredient == null ? (
                              <>
                                <Input
                                  value={ingredient.manual_name}
                                  onChange={(e) => updateReviewIngredient(index, { manual_name: e.target.value })}
                                  placeholder="Type existing ingredient name"
                                  list={`ingredient-suggestions-${index}`}
                                  required
                                />
                                <datalist id={`ingredient-suggestions-${index}`}>
                                  {importIngredientOptions.map((option) => (
                                    <option key={option.id} value={option.name} />
                                  ))}
                                </datalist>
                                <p className="mt-1 text-[11px] text-palette-textMuted">
                                  Unmatched rows must be typed manually using an existing ingredient name.
                                </p>
                              </>
                            ) : (
                              <div className="flex gap-2">
                                <select
                                  value={ingredient.best_guess_ingredient ?? ''}
                                  onChange={(e) =>
                                    updateReviewIngredient(index, {
                                      best_guess_ingredient: e.target.value ? Number(e.target.value) : null,
                                    })
                                  }
                                  className="h-11 w-full rounded-xl border border-palette-border bg-white px-3 text-sm text-palette-text"
                                >
                                  {importIngredientOptions.map((option) => (
                                    <option key={option.id} value={option.id}>
                                      {option.name}
                                    </option>
                                  ))}
                                </select>
                                <Button
                                  type="button"
                                  variant="outline"
                                  onClick={() => updateReviewIngredient(index, { best_guess_ingredient: null, manual_name: '' })}
                                  className="shrink-0"
                                >
                                  Unmatch
                                </Button>
                              </div>
                            )}
                          </div>
                          <div className="sm:col-span-1 flex items-end">
                            <Button type="button" variant="ghost" onClick={() => removeReviewIngredient(index)} className="w-full sm:w-auto">
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                      </div>
                      <div className="absolute bottom-0 left-0 right-2 h-8 bg-gradient-to-t from-white to-transparent pointer-events-none z-10" />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-sm font-bold text-palette-text">Steps</label>
                      <Button type="button" variant="outline" onClick={addReviewStep}>
                        <Plus className="w-4 h-4 mr-1" />
                        Add step
                      </Button>
                    </div>
                    <div className="relative">
                      <div className="absolute top-0 left-0 right-2 h-6 bg-gradient-to-b from-white to-transparent pointer-events-none z-10" />
                      <div className="space-y-2 max-h-64 overflow-y-auto pr-1 pb-4 pt-2">
                        {reviewDraft.steps.map((step, index) => (
                        <div key={step.id ?? `new-step-${index}`} className="flex items-start gap-2 rounded-xl border border-palette-border p-3 bg-[#F5F4F1]/40">
                          <span className="pt-2 w-6 text-sm font-bold text-palette-textMuted">{index + 1}.</span>
                          <Input
                            value={step.description}
                            onChange={(e) => updateReviewStep(index, e.target.value)}
                            placeholder={`Step ${index + 1}`}
                            className="flex-1"
                          />
                          <Button type="button" variant="ghost" onClick={() => removeReviewStep(index)}>
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                      </div>
                      <div className="absolute bottom-0 left-0 right-2 h-8 bg-gradient-to-t from-white to-transparent pointer-events-none z-10" />
                    </div>
                  </div>

                  {reviewError && (
                    <p className="text-sm text-red-600">{reviewError}</p>
                  )}
                  <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end mt-8">
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => {
                        setReviewOpen(false);
                        setReviewError(null);
                      }}
                      className="w-full px-6 text-palette-textMuted sm:w-auto"
                    >
                      Cancel
                    </Button>
                    <Button type="submit" disabled={isFinalizingImport} className="w-full sm:w-auto">
                      {isFinalizingImport ? 'Finalizing…' : 'Confirm Import'}
                    </Button>
                  </div>
                </form>
              )}
            </DialogContent>
          </Dialog>
          <Dialog open={addMealOpen} onOpenChange={setAddMealOpen}>
            <DialogTrigger asChild>
              <Button className="w-full bg-palette-primary hover:bg-palette-primaryDark text-white px-6 shadow-soft transition-all hover:shadow-md sm:w-auto">
                <Plus className="w-4 h-4 mr-2" />
                Add Recipe
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md" overlayClassName="bg-slate-500/65 backdrop-blur-[1px]">
            <DialogHeader>
              <DialogTitle>Add meal</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleAddMeal} className="space-y-4 mt-2">
              <div>
                <label className="block text-sm font-bold text-palette-text mb-2">Recipe Name</label>
                <Input
                  value={newMealName}
                  onChange={(e) => setNewMealName(e.target.value)}
                  placeholder="e.g. Greek salad"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-palette-text mb-2">Servings</label>
                <Input
                  type="number"
                  min={1}
                  value={newMealServings}
                  onChange={(e) => setNewMealServings(Number(e.target.value))}
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-palette-text mb-2">Ingredients</label>
                {selectedIngredients.length > 0 && (
                  <ul className="space-y-2 mb-4 p-4 border border-palette-border rounded-2xl bg-[#F5F4F1]/50">
                    {selectedIngredients.map((sel) => (
                      <li key={sel.ingredientId} className="flex items-center gap-2 text-sm">
                        <span className="flex-1 truncate text-palette-text">{sel.name}</span>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <div className="w-20 shrink-0">
                            <Input
                              type="number"
                              min={0}
                              step="any"
                              value={sel.quantity}
                              onChange={(e) => setIngredientQuantity(sel.ingredientId, Number(e.target.value))}
                              className="h-10 py-1 px-2 text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none rounded-xl border-2 border-transparent transition-all"
                            />
                          </div>
                          <span className="text-palette-textMuted text-xs w-6">{sel.unit}</span>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-10 w-10 shrink-0 p-0 text-[#8A8A86]"
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
                    className="w-full justify-between h-12 rounded-2xl font-medium text-[#A3A3A0] border-2 border-palette-border bg-[#F5F4F1] hover:bg-white"
                    onClick={() => setIngredientDropdownOpen((o) => !o)}
                    aria-expanded={ingredientDropdownOpen}
                    aria-haspopup="listbox"
                  >
                    <span>Add ingredient...</span>
                    <ChevronDown className={`w-4 h-4 shrink-0 transition-transform ${ingredientDropdownOpen ? 'rotate-180' : ''}`} />
                  </Button>
                  {ingredientDropdownOpen && (
                    <div className="absolute z-10 top-full left-0 right-0 mt-2 border-2 border-palette-border rounded-2xl bg-white shadow-glass overflow-hidden">
                      <div className="p-3 border-b border-palette-border bg-[#F5F4F1]">
                        <Input
                          placeholder="Search ingredients..."
                          value={ingredientSearch}
                          onChange={(e) => setIngredientSearch(e.target.value)}
                          className="h-10 rounded-xl"
                          autoFocus
                        />
                      </div>
                      <ul className="max-h-48 overflow-y-auto p-1" role="listbox">
                        {ingredientsList.length === 0 ? (
                          <li className="px-2 py-2 text-sm text-palette-textMuted">
                            {ingredientSearch.trim() ? 'No ingredients found' : 'Type to search ingredients'}
                          </li>
                        ) : (
                          ingredientsList.map((ing) => (
                            <li key={ing.id} role="option">
                              <button
                                type="button"
                                onClick={() => addIngredient(ing)}
                                disabled={selectedIngredients.some((s) => s.ingredientId === ing.id)}
                                className="w-full text-left px-2 py-1.5 text-sm rounded hover:bg-palette-border disabled:opacity-50 disabled:cursor-not-allowed"
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
                <label className="block text-sm font-bold text-palette-text mb-2">Steps</label>
                {newMealSteps.length > 0 && (
                  <ul className="space-y-3 mb-4 p-4 border border-palette-border rounded-2xl bg-[#F5F4F1]/50">
                    {newMealSteps.map((step, index) => (
                      <li key={index} className="flex items-center gap-2 text-sm">
                        <span className="shrink-0 w-5 text-palette-textMuted font-bold">{index + 1}.</span>
                        <Input
                          value={step}
                          onChange={(e) => setStep(index, e.target.value)}
                          placeholder={`Step ${index + 1}`}
                          className="flex-1 h-10 rounded-xl"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-10 w-10 shrink-0 p-0 text-[#8A8A86]"
                          onClick={() => removeStep(index)}
                          aria-label="Remove step"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </li>
                    ))}
                  </ul>
                )}
                <Button type="button" variant="outline" onClick={addStep} className="w-full justify-center h-12 rounded-2xl bg-[#F5F4F1] border-2 border-palette-border text-palette-text hover:bg-white hover:border-palette-primary/30 transition-all font-bold">
                  <Plus className="w-4 h-4 mr-2 text-palette-primary" />
                  Add step
                </Button>
              </div>
              {createRecipe.isError && (
                <p className="text-sm text-red-600">Failed to create meal. Try again.</p>
              )}
              <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end mt-8">
                <Button type="button" variant="ghost" onClick={() => setAddMealOpen(false)} className="w-full px-6 text-palette-textMuted sm:w-auto">
                  Cancel
                </Button>
                <Button type="submit" disabled={createRecipe.isPending} className="w-full sm:w-auto">
                  {createRecipe.isPending ? 'Creating…' : 'Create'}
                </Button>
              </div>
            </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Search & Filter Container */}
      <div className="flex flex-col gap-5 p-4 sm:gap-6 sm:p-6 md:p-8 bg-white rounded-3xl shadow-sm border border-palette-border/60">
        
        {/* Helper Context (Visual Structure) */}
        <div className="flex flex-col mb-2">
            <h3 className="text-lg font-bold text-palette-text mb-1">Find & Filter</h3>
            <p className="text-sm text-[#8A8A86] font-medium">Quickly locate meals by name, cost, or dietary tags.</p>
        </div>
        
        {/* Main Search */}
        <div className="relative w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-[#A3A3A0] sm:left-6 sm:h-6 sm:w-6" />
          <input
            type="text"
            placeholder="Search recipes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full h-12 rounded-2xl border-2 border-transparent bg-[#F5F4F1] pl-12 pr-4 text-base font-medium text-palette-text placeholder:text-[#A3A3A0] outline-none transition-all sm:h-16 sm:pl-16 sm:pr-6 sm:text-lg"
          />
        </div>

        {/* Sub-Filters */}
        <div className="flex flex-wrap gap-3 items-center">
          <div className="flex w-full items-center gap-2 rounded-2xl border-2 border-transparent bg-[#F5F4F1] py-1.5 pl-4 pr-2 transition-all sm:w-auto sm:pl-5">
            <DollarSign className="w-5 h-5 text-palette-amber" />
            <input
              type="number"
              placeholder="Max cost"
              value={maxCost ?? ''}
              onChange={(e) => setMaxCost(e.target.value ? Number(e.target.value) : null)}
              className="h-10 w-full border-none bg-transparent px-1 text-base font-medium placeholder:text-[#A3A3A0] shadow-none outline-none focus:outline-none focus:ring-0 sm:w-28"
              step="0.5"
            />
          </div>
          <div className="flex w-full items-center gap-2 rounded-2xl border-2 border-transparent bg-[#F5F4F1] py-1.5 pl-4 pr-2 transition-all sm:w-auto sm:pl-5">
            <Flame className="w-5 h-5 text-palette-emerald" />
            <input
              type="number"
              placeholder="Max cal"
              value={maxCalories ?? ''}
              onChange={(e) => setMaxCalories(e.target.value ? Number(e.target.value) : null)}
              className="h-10 w-full border-none bg-transparent px-1 text-base font-medium placeholder:text-[#A3A3A0] shadow-none outline-none focus:outline-none focus:ring-0 sm:w-28"
            />
          </div>
          {selectedTags.length > 0 && (
            <button
              type="button"
              onClick={() => setSelectedTags([])}
              className="h-11 w-full rounded-2xl bg-[#F5F4F1] px-6 text-sm font-bold text-[#8A8A86] transition-colors hover:bg-palette-border/50 focus:outline-none sm:h-12 sm:w-auto"
            >
              Clear filters
            </button>
          )}
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-2 pt-3">
          {tagData?.data.results?.map((tag) => (
            <button
              key={tag.id}
              type="button"
              className={`cursor-pointer rounded-2xl px-5 py-2 text-sm font-bold m-0 outline-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-palette-primary/20 shadow-none transition-colors border-2 ${selectedTags.includes(tag) ? 'bg-palette-text border-palette-text text-white' : 'bg-[#F5F4F1] border-transparent text-[#8A8A86] hover:bg-white hover:border-palette-primary/20'}`}
              onClick={() => toggleTag(tag)}
            >
              {tag.name}
            </button>
          ))}
        </div>
      </div>

      {!recipeIsError && !recipeIsLoading && filteredMeals && (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <div className="rounded-2xl border border-palette-border/70 bg-white px-5 py-4 shadow-sm">
            <div className="mb-1 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-palette-textMuted">
              <Salad className="h-4 w-4 text-palette-primary" />
              Total Results
            </div>
            <div className="text-2xl font-extrabold text-palette-text">{filteredMeals.length}</div>
          </div>
          <div className="rounded-2xl border border-palette-border/70 bg-white px-5 py-4 shadow-sm">
            <div className="mb-1 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-palette-textMuted">
              <BadgeDollarSign className="h-4 w-4 text-palette-amber" />
              Avg Cost / Serving
            </div>
            <div className="text-2xl font-extrabold text-palette-text">
              {recipeInsights.avgCost !== null ? `$${recipeInsights.avgCost.toFixed(2)}` : '—'}
            </div>
          </div>
          <div className="rounded-2xl border border-palette-border/70 bg-white px-5 py-4 shadow-sm">
            <div className="mb-1 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-palette-textMuted">
              <Activity className="h-4 w-4 text-palette-emerald" />
              Avg Calories
            </div>
            <div className="text-2xl font-extrabold text-palette-text">
              {recipeInsights.avgCalories !== null ? `${Math.round(recipeInsights.avgCalories)} kcal` : '—'}
            </div>
          </div>
          <div className="rounded-2xl border border-palette-border/70 bg-white px-5 py-4 shadow-sm">
            <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-palette-textMuted">
              <Sparkles className="h-4 w-4 text-palette-primaryDark" />
              Popular Tags
            </div>
            <div className="flex flex-wrap gap-2">
              {recipeInsights.quickTags.length > 0 ? (
                recipeInsights.quickTags.map((tag) => (
                  <span key={tag} className="rounded-full bg-[#F5F4F1] px-3 py-1 text-xs font-semibold text-palette-textMuted">
                    {tag}
                  </span>
                ))
              ) : (
                <span className="text-sm text-palette-textMuted">No tags in current results</span>
              )}
            </div>
          </div>
        </div>
      )}

      {!recipeIsError && !recipeIsLoading && filteredMeals && (
        <div className="pt-2">
          <div className="mb-6 flex items-center gap-3">
            <div className="h-px bg-palette-border flex-1" />
            <span className="text-xs font-bold uppercase tracking-wider text-palette-textMuted">
              {filteredMeals.length} {filteredMeals.length === 1 ? 'Recipe' : 'Recipes'}
            </span>
            <div className="h-px bg-palette-border flex-1" />
          </div>
          {
            filteredMeals.length === 0 && (
              <div className="text-center py-16 text-palette-textMuted bg-white rounded-3xl border border-palette-border shadow-sm border-dashed">
                <p className="text-lg font-medium">No recipes found matching your criteria.</p>
                <p className="text-sm mt-1">Try adjusting your filters or search term.</p>
              </div>
            )
          }
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
            {
              filteredMeals.map((recipe) => { return (<RecipeCard recipe={recipe} key={recipe.id} />) })
            }
          </div>
        </div>
      )}

    </div>
  );
}
