import { useState, useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { calculateRecipeNutrition, calculateRecipeCost } from '../utils/calculations';
import { Search, DollarSign, Flame, Plus } from 'lucide-react';
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
import { useRecipesList, useTagsList, useRecipesCreate } from '../api/mealmodeAPI';
import { getRecipesListQueryKey } from '../api/mealmodeAPI';
import type { Tag } from '../api/mealmodeAPI';

export function MealListPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: recipeData, isError: recipeIsError, isLoading: recipeIsLoading } = useRecipesList();
  const { data: tagData } = useTagsList();
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
  const [newMealServings, setNewMealServings] = useState(4);

  const filteredMeals = useMemo(() => {
    return recipeData?.data.results.filter((recipe) => {
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

  const handleAddMeal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMealName.trim()) return;
    createRecipe.mutate({
      data: {
        name: newMealName.trim(),
        servings: newMealServings,
      },
    });
    setNewMealName('');
    setNewMealServings(4);
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
                  onChange={(e) => setNewMealServings(Number(e.target.value) || 4)}
                />
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
          {tagData?.data.results.map((tag) => (
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {
              filteredMeals.map((recipe) => { return (<RecipeCard recipe={recipe} key={recipe.id} />) })
            }
          </div>
        </div>
      )}

    </div>
  );
}
