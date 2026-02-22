import type { Recipe } from "../api/mealmodeAPI";
import { Card, CardHeader, CardContent, CardTitle } from "./ui/card";
import { useNavigate } from "react-router-dom";
import { DollarSign, Flame } from 'lucide-react';
import { Badge } from "./ui/badge";
import { calculateRecipeCost, calculateRecipeNutrition } from "../utils/calculations";

export function RecipeCard({ recipe }: { recipe: Recipe }) {
    const navigate = useNavigate();
    const { costPerServing, costPartiallyUnknown } = calculateRecipeCost(recipe);
    const { nutritionPerServing } = calculateRecipeNutrition(recipe);

    return (<Card
        key={recipe.id}
        className="relative overflow-hidden group border-2 border-palette-taupe hover:shadow-xl transition-all hover:scale-[1.02] cursor-pointer h-full hover:bg-palette-lightblue/90"
        onClick={() => navigate(`/meal/${recipe.id}`)}
    >
        <div className="absolute top-0 right-0 w-24 h-24 bg-palette-cream/30 rounded-bl-full transform translate-x-12 -translate-y-12 group-hover:translate-x-8 group-hover:-translate-y-8 transition-transform" aria-hidden />
        <CardHeader className="relative z-10 pb-2">
            <CardTitle className="text-xl">{recipe.name}</CardTitle>
        </CardHeader>
        <CardContent className="relative z-10 pt-0">
            <div className="space-y-4">
                <div className="flex justify-between items-center text-sm">
                    <div className="flex items-center gap-1 text-palette-slate">
                        <DollarSign className="w-4 h-4" />
                        <span>{costPerServing.toFixed(2)}/serving{costPartiallyUnknown && "?"}</span>
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
                <div className="text-xs text-palette-taupe flex gap-2">
                    {recipe.prep_time_minutes && (<div>Prep time: {recipe.prep_time_minutes}m</div>)}
                    {recipe.cook_time_minutes && (<div>Cook time: {recipe.cook_time_minutes}m</div>)}
                </div>
            </div>
        </CardContent>
    </Card>)
}