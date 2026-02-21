import { useState, useMemo } from 'react';
import { Search } from 'lucide-react';
import { Input } from '../components/ui/input';
import { RecipeCard } from '../components/recipecard';
import { useRecipesList } from '../api/mealmodeAPI';
import type { Recipe } from '../api/mealmodeAPI';

export function MealListPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const { data: recipeData, isLoading } = useRecipesList();

  const recipes = useMemo((): Recipe[] => {
    const body = recipeData && typeof recipeData === 'object' && 'data' in recipeData
      ? (recipeData as { data: { results?: Recipe[] } }).data?.results
      : (recipeData as { results?: Recipe[] } | undefined)?.results;
    return Array.isArray(body) ? body : [];
  }, [recipeData]);

  const filteredRecipes = useMemo(() => {
    if (!searchTerm.trim()) return recipes;
    const term = searchTerm.toLowerCase();
    return recipes.filter((r) => r.name.toLowerCase().includes(term));
  }, [recipes, searchTerm]);

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-2xl font-semibold text-palette-taupe mb-2">Meals</h2>
        <p className="text-palette-slate">Browse and search your meal collection</p>
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
      </div>

      <div className="mb-4 text-sm text-palette-slate">
        Showing {filteredRecipes.length} of {recipes.length} meals
      </div>

      {isLoading && (
        <div className="text-center py-12 text-palette-slate">Loading…</div>
      )}

      {!isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredRecipes.map((recipe) => (
            <RecipeCard recipe={recipe} key={recipe.id} />
          ))}
        </div>
      )}

      {!isLoading && filteredRecipes.length === 0 && (
        <div className="text-center py-12 text-palette-taupe">
          No meals found
        </div>
      )}
    </div>
  );
}
