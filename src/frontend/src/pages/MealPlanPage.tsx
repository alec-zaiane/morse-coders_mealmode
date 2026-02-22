import { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { useRecipesList } from '../api/mealmodeAPI';
import type { Recipe } from '../api/mealmodeAPI';
import { useNavigate } from 'react-router-dom';
import { X, Plus, Search } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
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
      className={`w-full p-3 rounded-2xl text-left transition-all duration-300 border ${
        selected
          ? 'bg-palette-primary/10 border-palette-primary shadow-sm scale-[0.98]'
          : 'bg-white border-palette-border hover:border-palette-primary/50 hover:shadow-soft'
      }`}
    >
      <div className={`font-brand font-bold truncate line-clamp-2 leading-tight ${selected ? 'text-palette-primaryDark' : 'text-palette-text'}`}>
        {mealName}
      </div>
      <div className={`text-xs font-semibold mt-1 ${selected ? 'text-palette-primary/80' : 'text-palette-textMuted'}`}>
        {servings} serving{servings !== 1 ? 's' : ''}
      </div>
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
      className={`min-h-24 p-2 border rounded-2xl transition-all duration-300 ${
        canPlace
          ? 'border-palette-primary border-dashed bg-palette-primary/5 cursor-pointer hover:bg-palette-primary/10 scale-[1.02]'
          : planEntry
          ? 'border-transparent bg-transparent'
          : 'border-dashed border-palette-border bg-gray-50/50'
      }`}
      onClick={canPlace ? handleSlotClick : undefined}
      role={canPlace ? 'button' : undefined}
      tabIndex={canPlace ? 0 : undefined}
      onKeyDown={canPlace ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleSlotClick(); } } : undefined}
    >
      {planEntry ? (
        <div className="relative group h-full">
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onRemove(planEntry.id); }}
            className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-md z-10 hover:bg-red-600 scale-90 group-hover:scale-100"
          >
            <X className="w-3.5 h-3.5" />
          </button>
          <div
            className="p-3 h-full bg-white border border-palette-border rounded-xl cursor-pointer hover:border-palette-primary/40 hover:shadow-soft transition-all transform group-hover:-translate-y-0.5"
            onClick={(e) => { e.stopPropagation(); onViewMeal(planEntry.mealId); }}
          >
            <div className="font-brand font-bold text-sm text-palette-text line-clamp-2 leading-tight mb-1">{planEntry.mealName}</div>
            <div className="text-xs font-semibold text-palette-textMuted bg-gray-100 w-fit px-1.5 py-0.5 rounded-md">
              {planEntry.servings} serving{planEntry.servings === 1 ? '' : 's'}
            </div>
          </div>
        </div>
      ) : (
        <div className="h-full flex items-center justify-center">
          {canPlace ? (
            <div className="flex flex-col items-center justify-center text-palette-primary">
              <Plus className="w-5 h-5 mb-1" />
              <span className="text-xs font-bold">Place Meal</span>
            </div>
          ) : (
            <span className="text-palette-border">—</span>
          )}
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
    <div className="space-y-8 animate-[fadeIn_0.5s_ease-out]">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-4xl font-brand font-extrabold text-palette-text mb-1 tracking-tight">Weekly Planner</h2>
          <p className="text-palette-textMuted text-sm font-medium">Select a meal from below, then tap a slot to schedule it.</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) setViewAllSearchTerm(''); }}>
          <DialogTrigger asChild>
            <Button variant="outline" className="px-6 border-palette-border hover:bg-gray-50 text-palette-text shadow-sm">
              <Search className="w-4 h-4 mr-2 text-palette-textMuted" />
              Find specific meal
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[85vh] overflow-hidden flex flex-col rounded-3xl p-6">
            <DialogHeader className="mb-4 shrink-0">
              <DialogTitle className="font-brand text-2xl font-bold">Pick a Meal</DialogTitle>
            </DialogHeader>
            <div className="relative mb-4 shrink-0 group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-palette-textMuted transition-colors" />
              <Input
                type="text"
                placeholder="Search recipes..."
                value={viewAllSearchTerm}
                onChange={(e) => setViewAllSearchTerm(e.target.value)}
                className="pl-12 bg-gray-50 border-transparent hover:border-palette-border rounded-2xl h-12 text-base transition-all"
              />
            </div>
            <div className="overflow-y-auto overflow-x-hidden pr-2 flex-1 pb-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {isLoading ? (
                  <p className="text-palette-textMuted col-span-full py-4 text-center font-medium">Loading your recipes…</p>
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
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="bg-white rounded-3xl shadow-soft border border-palette-border overflow-hidden">
        {/* Quick Add Tray */}
        <div className="bg-gray-50 border-b border-palette-border p-5">
            <div className="flex items-center gap-2 mb-3">
                <div className="w-1.5 h-4 bg-palette-primary rounded-full"></div>
                <h3 className="text-sm font-bold text-palette-text uppercase tracking-wider">Quick Action Tray</h3>
            </div>
            
            <div className="flex overflow-x-auto pb-4 pt-1 gap-3 snap-x hide-scrollbar mask-edges">
                {isLoading ? (
                    <div className="text-sm font-medium text-palette-textMuted py-2">Loading tray...</div>
                ) : (
                    recipes.slice(0, 10).map((recipe) => (
                        <div key={recipe.id} className="min-w-[200px] w-[200px] shrink-0 snap-start">
                            <SelectableMeal
                            key={recipe.id}
                            mealId={String(recipe.id)}
                            mealName={recipe.name}
                            servings={recipe.servings ?? 1}
                            selected={selectedMealId === String(recipe.id)}
                            onSelect={() => setSelectedMealId((id) => (id === String(recipe.id) ? null : String(recipe.id)))}
                            />
                        </div>
                    ))
                )}
                {recipes.length > 10 && (
                    <div className="min-w-[150px] shrink-0 flex items-center justify-center p-2 rounded-2xl border border-dashed border-palette-border hover:bg-gray-100 cursor-pointer transition-colors" onClick={() => setIsDialogOpen(true)}>
                        <span className="text-sm font-bold text-palette-textMuted flex items-center gap-1"><Plus className="w-4 h-4"/> View All</span>
                    </div>
                )}
            </div>
        </div>

        {/* Planner Grid */}
        <div className="p-6">
          {planLoading ? (
            <p className="text-palette-textMuted font-medium text-center py-12">Loading your planner…</p>
          ) : (
          <div className="overflow-x-auto pb-2">
            <div className="min-w-[900px]">
              <div className="grid grid-cols-8 gap-4 mb-4">
                <div className="font-semibold text-sm text-palette-textMuted" />
                {DAYS.map((day) => (
                  <div key={day} className="font-bold text-sm text-palette-text capitalize text-center mb-2">
                    {day}
                  </div>
                ))}
              </div>
              {SLOTS.map((slot) => (
                <div key={slot} className="grid grid-cols-8 gap-4 mb-4">
                  <div className="font-bold text-xs uppercase tracking-wider text-palette-textMuted flex items-center justify-end pr-4">
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
        </div>
      </div>
    </div>
  );
}

export function MealPlanPage() {
  return <MealPlanContent />;
}
