import { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { useRecipesList } from '../api/mealmodeAPI';
import type { Recipe } from '../api/mealmodeAPI';
import { useNavigate } from 'react-router-dom';
import { X, Plus, Search } from 'lucide-react';
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
  onRemove: (entryId: string) => void;
  onViewMeal: (mealId: string) => void;
}

function PlanSlot({ day, slot, planEntry, selectedMealId, onPlace, onRemove, onViewMeal }: PlanSlotProps) {
  const isEmpty = !planEntry;
  const canPlace = selectedMealId && isEmpty;

  const handleSlotClick = () => {
    if (canPlace) {
      onPlace(day, slot);
    }
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
            onClick={(e) => { e.stopPropagation(); onRemove(planEntry.id); }}
            className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <X className="w-3 h-3" />
          </button>
          <div
            className="p-2 bg-white border rounded cursor-pointer hover:bg-palette-mist transition-colors"
            onClick={(e) => { e.stopPropagation(); onViewMeal(planEntry.mealId); }}
          >
            <div className="font-semibold text-sm truncate">{planEntry.mealName}</div>
            <div className="text-xs text-palette-slate">{planEntry.servings} servings</div>
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
  const { mealPlan, isLoading: planLoading, addMealToPlan, removeMealFromPlan } = useApp();
  const { data: recipeData, isLoading } = useRecipesList();
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
    if (recipe) addMealToPlan({ mealId: selectedMealId, day, slot, servings: recipe.servings ?? 1 });
    setSelectedMealId(null);
  };

  const handleRemove = (entryId: string) => removeMealFromPlan(entryId);
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
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-palette-taupe mb-2">Meal Plan</h2>
          <p className="text-palette-slate">Click a meal, then click a slot to add it to your plan</p>
        </div>
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
                <p className="text-palette-slate col-span-2">Loading meals…</p>
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

      <Card>
        <CardContent className="p-4">
          {planLoading ? (
            <p className="text-palette-slate py-4">Loading plan…</p>
          ) : (
          <div className="overflow-x-auto">
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
                        onRemove={handleRemove}
                        onViewMeal={handleViewMeal}
                      />
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
          )}
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-lg">Quick Add Meals</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {isLoading ? (
              <p className="text-palette-slate">Loading…</p>
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
