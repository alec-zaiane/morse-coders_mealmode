import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Plus, X } from 'lucide-react';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { IngredientSearchSelect } from '../components/IngredientSearchSelect';
import {
  getRecipesListQueryKey,
  useConfirmableRecipesConfirmCreate,
  useConfirmableRecipesPartialUpdate,
  useConfirmableRecipeIngredientsCreate,
  useConfirmableRecipeIngredientsPartialUpdate,
  useConfirmableRecipeIngredientsDestroy,
  useConfirmableRecipeStepsCreate,
  useConfirmableRecipeStepsPartialUpdate,
  useConfirmableRecipeStepsDestroy,
} from '../api/mealmodeAPI';
import type {
  ConfirmableRecipe,
  ConfirmableRecipeIngredient,
} from '../api/mealmodeAPI';

type ReviewImportLocationState = {
  draft: ConfirmableRecipe;
  ingredientNameById?: Record<number, string>;
};

export function ReviewImportedRecipePage() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const location = useLocation();
  const locationState = location.state as ReviewImportLocationState | null;

  const [reviewError, setReviewError] = useState<string | null>(null);
  const [reviewDraft, setReviewDraft] = useState<ConfirmableRecipe | null>(locationState?.draft ?? null);
  const [ingredientNameById, setIngredientNameById] = useState<Record<number, string>>(
    locationState?.ingredientNameById ?? {}
  );
  const [nextTempIngredientId, setNextTempIngredientId] = useState(-1);
  const [nextTempStepId, setNextTempStepId] = useState(-1);
  const [initialIngredientIds] = useState<number[]>(
    locationState?.draft ? locationState.draft.ingredients_list.map((ingredient) => ingredient.id) : []
  );
  const [initialStepIds] = useState<number[]>(
    locationState?.draft ? locationState.draft.steps_list.map((step) => step.id) : []
  );
  const [isFinalizingImport, setIsFinalizingImport] = useState(false);

  const confirmRecipe = useConfirmableRecipesConfirmCreate();
  const patchConfirmableRecipe = useConfirmableRecipesPartialUpdate();
  const createConfirmableIngredient = useConfirmableRecipeIngredientsCreate();
  const patchConfirmableIngredient = useConfirmableRecipeIngredientsPartialUpdate();
  const deleteConfirmableIngredient = useConfirmableRecipeIngredientsDestroy();
  const createConfirmableStep = useConfirmableRecipeStepsCreate();
  const patchConfirmableStep = useConfirmableRecipeStepsPartialUpdate();
  const deleteConfirmableStep = useConfirmableRecipeStepsDestroy();

  const updateReviewDraft = (updater: (draft: ConfirmableRecipe) => ConfirmableRecipe) => {
    setReviewDraft((prev) => (prev ? updater(prev) : prev));
  };

  const updateReviewIngredient = (
    index: number,
    update: Partial<Omit<ConfirmableRecipeIngredient, 'id' | 'confirmable_recipe'>>
  ) => {
    updateReviewDraft((draft) => ({
      ...draft,
      ingredients_list: draft.ingredients_list.map((ingredient, ingredientIndex) =>
        ingredientIndex === index ? { ...ingredient, ...update } : ingredient
      ),
    }));
  };

  const removeReviewIngredient = (index: number) => {
    updateReviewDraft((draft) => ({
      ...draft,
      ingredients_list: draft.ingredients_list.filter((_, ingredientIndex) => ingredientIndex !== index),
    }));
  };

  const addReviewIngredient = () => {
    const newIngredientId = nextTempIngredientId;
    setNextTempIngredientId((prev) => prev - 1);
    updateReviewDraft((draft) => ({
      ...draft,
      ingredients_list: [
        ...draft.ingredients_list,
        {
          id: newIngredientId,
          source_text: '',
          quantity: 0,
          confidence: 0,
          best_guess_ingredient: null,
          confirmable_recipe: draft.id,
        },
      ],
    }));
  };

  const updateReviewStep = (index: number, description: string) => {
    updateReviewDraft((draft) => ({
      ...draft,
      steps_list: draft.steps_list.map((step, stepIndex) =>
        stepIndex === index ? { ...step, description } : step
      ),
    }));
  };

  const addReviewStep = () => {
    const newStepId = nextTempStepId;
    setNextTempStepId((prev) => prev - 1);
    updateReviewDraft((draft) => ({
      ...draft,
      steps_list: [
        ...draft.steps_list,
        {
          id: newStepId,
          step_number: draft.steps_list.length + 1,
          description: '',
          confirmable_recipe: draft.id,
        },
      ],
    }));
  };

  const removeReviewStep = (index: number) => {
    updateReviewDraft((draft) => ({
      ...draft,
      steps_list: draft.steps_list
        .filter((_, stepIndex) => stepIndex !== index)
        .map((step, stepIndex) => ({ ...step, step_number: stepIndex + 1 })),
    }));
  };

  const handleFinalizeImport = async (e: React.FormEvent) => {
    e.preventDefault();
    setReviewError(null);
    if (!reviewDraft) return;

    const normalizedSteps = reviewDraft.steps_list.map((step, index) => ({
      ...step,
      step_number: index + 1,
    }));

    const currentIngredientIds = new Set(
      reviewDraft.ingredients_list.map((ingredient) => ingredient.id).filter((id) => id > 0)
    );
    const currentStepIds = new Set(
      normalizedSteps.map((step) => step.id).filter((id) => id > 0)
    );

    setIsFinalizingImport(true);
    try {
      await patchConfirmableRecipe.mutateAsync({
        id: reviewDraft.id,
        data: {
          name: reviewDraft.name.trim(),
          source_url: (reviewDraft.source_url ?? '').trim(),
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

      for (const ingredient of reviewDraft.ingredients_list) {
        const bestGuessIngredient = ingredient.best_guess_ingredient;
        if (bestGuessIngredient == null) {
          throw new Error('Each unmatched ingredient must be selected with Search ingredients.');
        }

        const payload = {
          source_text: ingredient.source_text.trim(),
          quantity: ingredient.quantity,
          confidence: ingredient.confidence,
          best_guess_ingredient: bestGuessIngredient,
          confirmable_recipe: reviewDraft.id,
        };
        if (ingredient.id > 0) {
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
        if (step.id > 0) {
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
      if (recipeId != null) navigate(`/meal/${recipeId}`);
    } catch (err) {
      const eObj = err as { response?: { data?: { error?: string } } };
      setReviewError(eObj?.response?.data?.error ?? 'Failed to finalize import. Review fields and try again.');
    } finally {
      setIsFinalizingImport(false);
    }
  };

  if (!reviewDraft) {
    return (
      <div className="mx-auto max-w-3xl animate-fadeIn">
        <div className="rounded-3xl border border-palette-border bg-white p-6 shadow-sm sm:p-8">
          <h2 className="font-brand text-2xl font-semibold text-black tracking-tight">Review imported recipe</h2>
          <p className="mt-3 text-sm text-black">
            No import preview was found. Start from Import Recipe to load a recipe first.
          </p>
          <Button type="button" onClick={() => navigate('/')} className="mt-6">
            Back to meals
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6 animate-fadeIn">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="font-brand text-2xl md:text-3xl font-semibold text-black tracking-tight">
            Review imported recipe
          </h2>
          <p className="mt-1 text-sm text-black">
            Verify fields and matched ingredients before finalizing import.
          </p>
        </div>
        <Button type="button" variant="ghost" onClick={() => navigate('/') } className="shrink-0">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
      </div>

      <form onSubmit={handleFinalizeImport} className="space-y-5 rounded-3xl border border-palette-border bg-white p-4 shadow-sm sm:p-6">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="mb-2 block text-sm font-bold text-palette-text">Recipe Name</label>
            <Input
              value={reviewDraft.name}
              onChange={(e) => updateReviewDraft((draft) => ({ ...draft, name: e.target.value }))}
              required
            />
          </div>
          <div className="sm:col-span-2">
            <label className="mb-2 block text-sm font-bold text-palette-text">Source URL</label>
            <Input
              type="url"
              value={reviewDraft.source_url}
              onChange={(e) => updateReviewDraft((draft) => ({ ...draft, source_url: e.target.value }))}
            />
          </div>
          <div className="grid grid-cols-1 gap-3 sm:col-span-2 lg:grid-cols-3">
            <div>
              <label className="mb-2 block text-sm font-bold text-palette-text">Servings</label>
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
              <label className="mb-2 block text-sm font-bold text-palette-text">Prep Time (min)</label>
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
              <label className="mb-2 block text-sm font-bold text-palette-text">Cook Time (min)</label>
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
        </div>

        <div>
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
            <label className="block text-sm font-bold text-palette-text">Ingredients</label>
            <Button type="button" variant="outline" onClick={addReviewIngredient}>
              <Plus className="mr-1 h-4 w-4" />
              Add ingredient
            </Button>
          </div>
          <div className="relative">
            <div className="pointer-events-none absolute left-0 right-1 top-0 z-10 h-4 rounded-t-xl bg-gradient-to-b from-white/85 to-transparent backdrop-blur-[1px]" />
            <div className="pointer-events-none absolute bottom-0 left-0 right-1 z-10 h-4 rounded-b-xl bg-gradient-to-t from-white/85 to-transparent backdrop-blur-[1px]" />
            <div className="max-h-[38dvh] space-y-2 overflow-y-auto overflow-x-hidden pr-1">
              {reviewDraft.ingredients_list.map((ingredient, index) => (
                <div
                  key={ingredient.id}
                  className="flex min-w-0 items-start gap-3 rounded-xl border border-palette-border bg-[#F5F4F1]/40 p-3"
                >
                  <div className="min-w-0 flex-1 space-y-3">
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-11">
                    <div className="md:col-span-9">
                      <label className="mb-1 block text-xs font-semibold text-palette-textMuted">Original text</label>
                      <Input
                        value={ingredient.source_text}
                        readOnly
                        className="cursor-not-allowed border-transparent bg-black/5 text-palette-textMuted"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="mb-1 block text-xs font-semibold text-palette-textMuted">Quantity</label>
                      <Input
                        type="number"
                        step="any"
                        min={0}
                        value={ingredient.quantity}
                        onChange={(e) => updateReviewIngredient(index, { quantity: Number(e.target.value) })}
                        className="h-10"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-3 md:grid-cols-11">
                    <div className="md:col-span-2">
                      <label className="mb-1 block text-xs font-semibold text-palette-textMuted">Confidence</label>
                      <Input
                        type="number"
                        step="0.01"
                        min={0}
                        max={1}
                        value={ingredient.confidence}
                        readOnly
                        className="h-10 cursor-not-allowed border-transparent bg-black/5 text-palette-textMuted"
                      />
                    </div>
                    <div className="md:col-span-9">
                      <label className="mb-1 block text-xs font-semibold text-palette-textMuted">
                        {ingredient.best_guess_ingredient == null ? 'Search ingredient' : 'Matched ingredient'}
                      </label>
                      <div className="flex min-w-0 flex-col gap-2 md:flex-row">
                        <div className="min-w-0 flex-1">
                          <IngredientSearchSelect
                            triggerLabel={
                              ingredient.best_guess_ingredient == null
                                ? 'Search ingredients...'
                                : 'Change ingredient...'
                            }
                            selectedIngredientName={
                              ingredient.best_guess_ingredient != null
                                ? ingredientNameById[ingredient.best_guess_ingredient]
                                : undefined
                            }
                            onSelect={(selectedIngredient) => {
                              updateReviewIngredient(index, {
                                best_guess_ingredient: selectedIngredient.id,
                              });
                              setIngredientNameById((prev) => ({
                                ...prev,
                                [selectedIngredient.id]: selectedIngredient.name,
                              }));
                            }}
                          />
                        </div>
                        {ingredient.best_guess_ingredient != null && (
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => updateReviewIngredient(index, { best_guess_ingredient: null })}
                            className="h-12 md:h-auto"
                          >
                            Unmatch
                          </Button>
                        )}
                      </div>
                      {ingredient.best_guess_ingredient == null && (
                        <p className="mt-1 text-[11px] text-palette-textMuted">
                          Select an existing ingredient before confirming import.
                        </p>
                      )}
                    </div>
                  </div>
                  </div>

                  <div className="flex shrink-0 self-stretch items-start pt-0.5">
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => removeReviewIngredient(index)}
                      className="h-10 w-10 border-palette-border bg-white p-0 text-palette-textMuted hover:bg-palette-background hover:text-palette-text"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div>
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
            <label className="block text-sm font-bold text-palette-text">Steps</label>
            <Button type="button" variant="outline" onClick={addReviewStep}>
              <Plus className="mr-1 h-4 w-4" />
              Add step
            </Button>
          </div>
          <div className="relative">
            <div className="pointer-events-none absolute left-0 right-1 top-0 z-10 h-4 rounded-t-xl bg-gradient-to-b from-white/85 to-transparent backdrop-blur-[1px]" />
            <div className="pointer-events-none absolute bottom-0 left-0 right-1 z-10 h-4 rounded-b-xl bg-gradient-to-t from-white/85 to-transparent backdrop-blur-[1px]" />
            <div className="max-h-[34dvh] space-y-2 overflow-y-auto overflow-x-hidden pr-1">
              {reviewDraft.steps_list.map((step, index) => (
                <div
                  key={step.id}
                  className="grid min-w-0 grid-cols-[auto,minmax(0,1fr),auto] items-start gap-2 rounded-xl border border-palette-border bg-[#F5F4F1]/40 p-3"
                >
                  <span className="w-6 shrink-0 pt-2 text-sm font-bold text-palette-textMuted">{index + 1}.</span>
                  <textarea
                    value={step.description}
                    onChange={(e) => updateReviewStep(index, e.target.value)}
                    placeholder={`Step ${index + 1}`}
                    rows={2}
                    className="min-w-0 w-full resize-y rounded-2xl border-2 border-palette-border bg-[#F5F4F1] px-4 py-2 text-base font-medium text-palette-text outline-none transition-all placeholder:text-[#A3A3A0] whitespace-pre-wrap break-words [overflow-wrap:anywhere]"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => removeReviewStep(index)}
                    className="mt-1 h-10 w-10 shrink-0 p-0"
                    aria-label={`Remove step ${index + 1}`}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {reviewError && <p className="text-sm text-red-600">{reviewError}</p>}

        <div className="mt-8 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="ghost"
            onClick={() => navigate('/')}
            className="w-full px-6 text-palette-textMuted sm:w-auto"
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isFinalizingImport} className="w-full sm:w-auto">
            {isFinalizingImport ? 'Finalizing…' : 'Confirm Import'}
          </Button>
        </div>
      </form>
    </div>
  );
}
