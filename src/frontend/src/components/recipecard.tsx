import type { Recipe } from "../api/mealmodeAPI";
import { Card, CardHeader, CardContent, CardTitle } from "./ui/card";
import { useNavigate } from "react-router-dom";
import { DollarSign, Flame } from 'lucide-react';
import { Badge } from "./ui/badge";
import { calculateRecipeCost, calculateRecipeNutrition } from "../utils/calculations";

export function RecipeCard({ recipe }: { recipe: Recipe }) {
    const navigate = useNavigate();
    const { costPerServing, costTotal, costPartiallyUnknown } = calculateRecipeCost(recipe);
    const { nutritionPerServing, nutritionTotal } = calculateRecipeNutrition(recipe);

    return (<Card
        key={recipe.id}
        className="hover:shadow-lg transition-shadow cursor-pointer"
        onClick={() => navigate(`/meal/${recipe.id}`)}
    >
        <CardHeader>
            <CardTitle className="text-lg">{recipe.name}</CardTitle>
        </CardHeader>
        <CardContent>
            <div className="space-y-3">
                <div className="flex justify-between items-center text-sm">
                    <div className="flex items-center gap-1 text-palette-slate">
                        <DollarSign className="w-4 h-4" />
                        <span>{costPerServing.toFixed(2)}/serving</span>
                    </div>
                    <div className="flex items-center gap-1 text-palette-terracotta">
                        <Flame className="w-4 h-4" />
                        <span>{Math.round(nutritionPerServing.kcal_per_unit)} Kcal/serving</span>
                    </div>
                </div>
                <div className="text-sm text-palette-slate">{recipe.servings} servings</div>
                <div className="flex flex-wrap gap-1">
                    {recipe.tags.map((tag) => (
                        <Badge key={tag.id} variant="secondary" className="text-xs">
                            {tag.name}
                        </Badge>
                    ))}
                </div>
                <div className="text-xs text-palette-taupe">
                    {/* Prep: {meal.prepTime}m • Cook: {meal.cookTime}m */}
                </div>
            </div>
        </CardContent>
    </Card>)
}