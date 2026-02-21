import { useState, useMemo, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useRecipesRetrieve } from '../api/mealmodeAPI';
import type { Recipe, RecipeIngredient } from '../api/mealmodeAPI';
import { ArrowLeft, Users, DollarSign } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
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

export function MealDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
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
  }, [recipe, servings])


  if (Number.isNaN(numericId) || numericId < 1) {
    return (
      <div className="text-center py-12">
        <p className="text-palette-taupe">Invalid recipe</p>
        <Button onClick={() => navigate('/')} className="mt-4">Back to Meals</Button>
      </div>
    );
  }

  if (isLoading) {
    return <div className="text-center py-12 text-palette-slate">Loading…</div>;
  }

  if (isError || !recipe) {
    return (
      <div className="text-center py-12">
        <p className="text-palette-taupe">Meal not found</p>
        <Button onClick={() => navigate('/')} className="mt-4">Back to Meals</Button>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <Button variant="ghost" onClick={() => navigate('/')} className="mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Meals
        </Button>

        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-3xl font-semibold text-palette-taupe mb-2">{recipe.name}</h2>
          </div>
          <div className="text-right">
            {costData && (
              <div className="flex items-center gap-2 text-palette-slate text-xl">
                <DollarSign className="w-6 h-6" />
                <span>{costData.costPerServing.toFixed(2)}/serving{costData.costPartiallyUnknown && "?"}</span >
              </div>
            )}
          </div>
        </div>
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
            <CardContent className="py-2">
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
                  min={1}
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setServings(servings + 1)}
                  className="h-8 w-8 p-0 shrink-0"
                >
                  +
                </Button>
                <span className="text-xs text-palette-taupe">(Original: {baseServings})</span>
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
                <ol className="list-decimal list-inside space-y-2">
                  {recipe.steps.map((step) => (
                    <li key={step.step_number} className="text-sm text-palette-slate">
                      {step.description}
                    </li>
                  ))}
                </ol>
              ) : (
                // TODO a click to edit instructions
                <p className="text-sm text-palette-slate">No instructions in database.</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
