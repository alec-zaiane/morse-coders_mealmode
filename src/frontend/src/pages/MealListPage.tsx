import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { calculateCostPerServing, calculateMealNutrition } from '../utils/calculations';
import { Search, DollarSign, Flame } from 'lucide-react';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { RecipeCard } from '../components/recipecard';
import { useRecipesList } from '../api/mealmodeAPI';

export function MealListPage() {
  const navigate = useNavigate();
  const { meals, ingredients } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [maxCost, setMaxCost] = useState<number | null>(null);
  const [maxCalories, setMaxCalories] = useState<number | null>(null);
  const { data: recipeData, isError, isLoading } = useRecipesList();

  const allTags = useMemo(() => {
    const tags = new Set<string>();
    meals.forEach((meal) => meal.tags.forEach((tag) => tags.add(tag)));
    return Array.from(tags).sort();
  }, [meals]);

  const filteredMeals = useMemo(() => {
    return meals.filter((meal) => {
      if (searchTerm && !meal.name.toLowerCase().includes(searchTerm.toLowerCase())) return false;
      if (selectedTags.length > 0 && !selectedTags.some((tag) => meal.tags.includes(tag))) return false;
      if (maxCost !== null) {
        const costPerServing = calculateCostPerServing(meal, ingredients);
        if (costPerServing > maxCost) return false;
      }
      if (maxCalories !== null) {
        const nutrition = calculateMealNutrition(meal, ingredients);
        if (nutrition.perServing.calories > maxCalories) return false;
      }
      return true;
    });
  }, [meals, searchTerm, selectedTags, maxCost, maxCalories, ingredients]);

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-2xl font-semibold text-palette-taupe mb-2">Meals</h2>
        <p className="text-palette-slate">Browse and search your meal collection</p>
      </div>

      <div className="mb-6 space-y-4">
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
          {allTags.map((tag) => (
            <Badge
              key={tag}
              variant={selectedTags.includes(tag) ? 'default' : 'outline'}
              className="cursor-pointer"
              onClick={() => toggleTag(tag)}
            >
              {tag}
            </Badge>
          ))}
        </div>
      </div>

      <div className="mb-4 text-sm text-palette-slate">
        Showing {filteredMeals.length} of {meals.length} meals
      </div>

      {!isLoading && recipeData && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {
            recipeData.data.results.map((recipe) => { return (<RecipeCard recipe={recipe} key={recipe.id} />) })
          }
        </div>

      )}

      {filteredMeals.length === 0 && (
        <div className="text-center py-12 text-palette-taupe">
          No meals found matching your criteria
        </div>
      )}
    </div>
  );
}
