import { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { useToast } from '../context/ToastContext';
import { useRecipesList } from '../api/mealmodeAPI';
import type { Recipe } from '../api/mealmodeAPI';
import { useNavigate } from 'react-router-dom';
import { X, Plus, Search, Calendar, ShoppingCart } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../components/ui/dialog';
import { Skeleton } from '../components/ui/skeleton';

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
const SLOTS = ['breakfast', 'lunch', 'dinner'];

interface MealCardProps {
  mealId: string;
  mealName: string;
  servings: number;
  selected: boolean;
  onSelect: () => void;
}

function SelectableMeal({ mealName, servings, selected, onSelect }: MealCardProps) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`w-full p-2 rounded text-xs text-left transition-colors ${
        selected
          ? 'bg-palette-terracotta/20 border-2 border-palette-terracotta ring-2 ring-palette-terracotta/30'
          : 'bg-palette-cream border border-palette-terracotta hover:bg-palette-terracotta/10'
      }`}
    >
      <div className="font-semibold truncate">{mealName}</div>
      <div className="text-palette-slate">{servings} servings</div>
    </button>
  );
}

interface PlanSlotProps {
  day: string;
  slot: string;
  planEntry?: { id: string; mealId: string; mealName: string; servings: number };
  selectedMealId: string | null;
  onPlace: (day: string, slot: string) => void;
  onUpdateServings: (entryId: string, servings: number) => void;
  onRemoveRequest: (entry: { id: string; mealName: string }) => void;
  onViewMeal: (mealId: string) => void;
}

function PlanSlot({ day, slot, planEntry, selectedMealId, onPlace, onUpdateServings, onRemoveRequest, onViewMeal }: PlanSlotProps) {
  const isEmpty = !planEntry;
  const canPlace = selectedMealId && isEmpty;

  const handleSlotClick = () => {
    if (canPlace) {
      onPlace(day, slot);
    }
  };

  const handleServingsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!planEntry) return;
    const v = parseInt(e.target.value, 10);
    if (!Number.isNaN(v) && v >= 1) onUpdateServings(planEntry.id, v);
  };

  return (
    <div
      className={`min-h-20 p-2 border-2 rounded transition-colors ${
        canPlace
          ? 'border-palette-terracotta border-dashed bg-palette-cream cursor-pointer hover:bg-palette-terracotta/10'
          : planEntry
          ? 'border-palette-taupe bg-white'
          : 'border-dashed border-palette-mist bg-palette-mist'
      }`}
      onClick = {canPlace ? handleSlotClick: undefined}
      role = {canPlace ? 'button': undefined}
      tabIndex = {canPlace ? 0 : undefined}
      onKeyDown = {canPlace ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleSlotClick(); } } : undefined}
    >
      {planEntry ? (
        <div className="relative group">
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onRemoveRequest({ id: planEntry.id, mealName: planEntry.mealName }); }}
            className="absolute -top-1 -right-1 w-5 h-5 bg-palette-slate text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-DEFAULT hover:bg-palette-slate/90 shadow-card"
            aria-label="Remove from plan"
          >
            <X className="w-3 h-3" />
          </button>
          <div
            className="p-2 bg-white border rounded cursor-pointer hover:bg-palette-mist/40 transition-colors"
            onClick={(e) => { e.stopPropagation(); onViewMeal(planEntry.mealId); }}
          >
            <div className="font-semibold text-sm truncate">{planEntry.mealName}</div>
            <div className="flex items-center gap-1.5 mt-1 text-xs text-palette-slate" onClick={(e) => e.stopPropagation()}>
              <label className="sr-only" htmlFor={`servings-${planEntry.id}`}>Servings</label>
              <input
                id={`servings-${planEntry.id}`}
                type="number"
                min={1}
                value={planEntry.servings}
                onChange={handleServingsChange}
                className="w-11 rounded border border-palette-mist/80 bg-white px-1.5 py-0.5 text-center text-xs [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                aria-label="Number of servings"
              />
              <span>servings</span>
            </div>
          </div>
        </div>
      ) : (
        <div className="h-full flex items-center justify-center text-palette-slate text-xs">
          {selectedMealId ? 'Click to add meal' : '—'}
        </div>
      )}
    </div>
  );
}

function MealPlanContent() {
  const navigate = useNavigate();
  const toast = useToast();
  const { mealPlan, isLoading: planLoading, addMealToPlan, updateMealPlanEntry, removeMealFromPlan } = useApp();
  const { data: recipeData, isLoading } = useRecipesList();
  const [confirmRemove, setConfirmRemove] = useState<{ id: string; mealName: string } | null>(null);
  const recipes = useMemo((): Recipe[] => {
    const body =
      recipeData && typeof recipeData === 'object' && 'data' in recipeData
        ? (recipeData as { data: { results?: Recipe[] } }).data?.results
        : (recipeData as { results?: Recipe[] } | undefined)?.results;
    return Array.isArray(body) ? body : [];
  }, [recipeData]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedMealId, setSelectedMealId] = useState<string | null>(null);
  const [viewAllSearchTerm, setViewAllSearchTerm] = useState('');

  const filteredRecipesForDialog = useMemo(() => {
    if (!viewAllSearchTerm.trim()) return recipes;
    const q = viewAllSearchTerm.toLowerCase();
    return recipes.filter((r) => r.name.toLowerCase().includes(q));
  }, [recipes, viewAllSearchTerm]);
  
  const handlePlace = (day: string, slot: string) => {
    if (!selectedMealId) return;
    const existingEntry = mealPlan.find((entry) => entry.day === day && entry.slot === slot);
    if (existingEntry) removeMealFromPlan(existingEntry.id);
    const recipe = recipes.find((r) => String(r.id) === selectedMealId);
    if (recipe) {
      addMealToPlan({ mealId: selectedMealId, day, slot, servings: recipe.servings ?? 1 });
      toast('Added to plan');
    }
    setSelectedMealId(null);
  };

  const handleRemoveRequest = (entry: { id: string; mealName: string }) => setConfirmRemove(entry);
  const handleConfirmRemove = () => {
    if (!confirmRemove) return;
    const fullEntry = enrichedPlan.find((e) => e.id === confirmRemove.id);
    const entryToRestore = fullEntry
      ? { mealId: fullEntry.mealId, day: fullEntry.day, slot: fullEntry.slot, servings: fullEntry.servings }
      : null;
    removeMealFromPlan(confirmRemove.id);
    toast('Removed from plan', {
      undo: entryToRestore
        ? () => addMealToPlan(entryToRestore)
        : undefined,
    });
    setConfirmRemove(null);
  };
  const handleViewMeal = (mealId: string) => navigate(`/meal/${mealId}`);

  const enrichedPlan = mealPlan.map((entry) => {
    const recipe = recipes.find((r) => String(r.id) === entry.mealId);
    return {
      ...entry,
      mealName: recipe?.name ?? 'Unknown',
    };
  });

  return (
    <div>
      <div className="mb-8 flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="font-brand text-2xl font-semibold text-palette-taupe mb-2 tracking-tight">Meal Plan</h1>
          <p className="text-palette-slate">Click a meal, then click a slot to add it to your plan</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => {
              toast('Shopping list ready');
              navigate('/shopping');
            }}
          >
            <ShoppingCart className="w-4 h-4 mr-2" />
            Generate shopping list
          </Button>
          <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) setViewAllSearchTerm(''); }}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                View All Meals
              </Button>
            </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Pick a Meal for Your Plan</DialogTitle>
            </DialogHeader>
            <div className="relative mt-4 mb-3">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-palette-slate" />
              <Input
                type="text"
                placeholder="Search meals..."
                value={viewAllSearchTerm}
                onChange={(e) => setViewAllSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
              {isLoading ? (
                <>
                  {Array.from({ length: 6 }).map((_, i) => (
                    <Skeleton key={i} className="h-16 rounded-md" />
                  ))}
                </>
              ) : (
                filteredRecipesForDialog.map((recipe) => (
                  <SelectableMeal
                    key={recipe.id}
                    mealId={String(recipe.id)}
                    mealName={recipe.name}
                    servings={recipe.servings ?? 1}
                    selected={selectedMealId === String(recipe.id)}
                    onSelect={() => {
                      const id = String(recipe.id);
                      setSelectedMealId((prev) => (prev === id ? null : id));
                      if (selectedMealId !== id) setIsDialogOpen(false);
                    }}
                  />
                ))
              )}
            </div>
          </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card>
        <CardContent className="p-4">
          {planLoading ? (
            <div className="overflow-x-auto py-4">
              <div className="min-w-[800px]">
                <div className="grid grid-cols-8 gap-2 mb-2">
                  <div />
                  {DAYS.map((d) => (
                    <Skeleton key={d} className="h-4 rounded" />
                  ))}
                </div>
                {SLOTS.map((slot) => (
                  <div key={slot} className="grid grid-cols-8 gap-2 mb-2">
                    <Skeleton className="h-4 w-16" />
                    {DAYS.map((day) => (
                      <Skeleton key={day} className="min-h-20 rounded" />
                    ))}
                  </div>
                ))}
              </div>
            </div>
          ) : (
          <div className="overflow-x-auto">
            {mealPlan.length === 0 && (
              <div className="flex flex-col items-center justify-center py-10 px-4 mb-4 rounded-lg bg-palette-cream/20 border border-palette-mist">
                <Calendar className="h-12 w-12 text-palette-mist mb-3" aria-hidden />
                <p className="text-lg font-medium text-palette-taupe mb-1">Plan your first week</p>
                <p className="text-palette-slate text-sm mb-4 text-center">Add meals to each slot, then generate your shopping list.</p>
                <Button onClick={() => setIsDialogOpen(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  View All Meals
                </Button>
              </div>
            )}
            {/* Desktop: wide table */}
            <div className="hidden lg:block overflow-x-auto">
            <div className="min-w-[800px]">
              <div className="grid grid-cols-8 gap-2 mb-2">
                <div className="font-semibold text-sm text-palette-slate" />
                {DAYS.map((day) => (
                  <div key={day} className="font-semibold text-sm text-palette-slate capitalize text-center">
                    {day.slice(0, 3)}
                  </div>
                ))}
              </div>
              {SLOTS.map((slot) => (
                <div key={slot} className="grid grid-cols-8 gap-2 mb-2">
                  <div className="font-semibold text-sm text-palette-slate capitalize flex items-center">
                    {slot}
                  </div>
                  {DAYS.map((day) => {
                    const planEntry = enrichedPlan.find(
                      (entry) => entry.day === day && entry.slot === slot
                    );
                    return (
                      <PlanSlot
                        key={`${day}-${slot}`}
                        day={day}
                        slot={slot}
                        planEntry={planEntry}
                        selectedMealId={selectedMealId}
                        onPlace={handlePlace}
                        onUpdateServings={(entryId, servings) => updateMealPlanEntry(entryId, { servings })}
                        onRemoveRequest={handleRemoveRequest}
                        onViewMeal={handleViewMeal}
                      />
                    );
                  })}
                </div>
              ))}
            </div>
            </div>
            {mealPlan.length > 0 && (
              <div className="lg:hidden space-y-4 mt-4">
                {DAYS.map((day) => (
                  <div key={day} className="border border-palette-mist rounded-lg p-3 bg-white">
                    <div className="font-semibold text-palette-taupe capitalize mb-2">{day}</div>
                    {SLOTS.map((slot) => {
                      const planEntry = enrichedPlan.find((e) => e.day === day && e.slot === slot);
                      return (
                        <div
                          key={slot}
                          className="flex items-center justify-between gap-2 py-2 border-t border-palette-mist/50 first:border-t-0"
                        >
                          <span className="text-sm text-palette-slate capitalize shrink-0 w-20">{slot}</span>
                          {planEntry ? (
                            <div className="flex items-center gap-2 min-w-0 flex-1">
                              <button
                                type="button"
                                onClick={() => handleViewMeal(planEntry.mealId)}
                                className="font-medium text-palette-taupe text-sm truncate text-left hover:underline"
                              >
                                {planEntry.mealName}
                              </button>
                              <label className="sr-only" htmlFor={`mobile-servings-${planEntry.id}`}>Servings</label>
                              <input
                                id={`mobile-servings-${planEntry.id}`}
                                type="number"
                                min={1}
                                value={planEntry.servings}
                                onChange={(e) => {
                                  const v = parseInt(e.target.value, 10);
                                  if (!Number.isNaN(v) && v >= 1) updateMealPlanEntry(planEntry.id, { servings: v });
                                }}
                                className="w-11 rounded border border-palette-mist/80 bg-white px-1.5 py-0.5 text-center text-xs [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                aria-label="Servings"
                              />
                              <span className="text-xs text-palette-slate shrink-0">sv</span>
                              <button
                                type="button"
                                onClick={() => handleRemoveRequest({ id: planEntry.id, mealName: planEntry.mealName })}
                                className="shrink-0 p-1 rounded text-palette-slate hover:bg-palette-mist/40"
                                aria-label="Remove from plan"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          ) : selectedMealId ? (
                            <button
                              type="button"
                              onClick={() => handlePlace(day, slot)}
                              className="text-sm text-palette-terracotta font-medium hover:underline"
                            >
                              Tap to add meal
                            </button>
                          ) : (
                            <span className="text-palette-slate text-sm">—</span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            )}
          </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!confirmRemove} onOpenChange={(open) => !open && setConfirmRemove(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Remove from plan?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-palette-slate">
            {confirmRemove ? `“${confirmRemove.mealName}” will be removed from this slot.` : ''}
          </p>
          <div className="flex gap-2 justify-end pt-4">
            <Button variant="outline" onClick={() => setConfirmRemove(null)}>
              Cancel
            </Button>
            <Button
              variant="default"
              className="bg-red-600 hover:bg-red-700 text-white"
              onClick={handleConfirmRemove}
            >
              Remove
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-lg">Quick Add Meals</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {isLoading ? (
              Array.from({ length: 10 }).map((_, i) => (
                <Skeleton key={i} className="h-14 rounded-md" />
              ))
            ) : (
              recipes.slice(0, 10).map((recipe) => (
                <SelectableMeal
                  key={recipe.id}
                  mealId={String(recipe.id)}
                  mealName={recipe.name}
                  servings={recipe.servings ?? 1}
                  selected={selectedMealId === String(recipe.id)}
                  onSelect={() => setSelectedMealId((id) => (id === String(recipe.id) ? null : String(recipe.id)))}
                />
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export function MealPlanPage() {
  return <MealPlanContent />;
}
