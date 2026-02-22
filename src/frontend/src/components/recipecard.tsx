import type { Recipe } from "../api/mealmodeAPI";
import { Card, CardHeader, CardContent, CardTitle } from "./ui/card";
import { useNavigate } from "react-router-dom";
import { DollarSign, Flame, Clock, UtensilsCrossed } from 'lucide-react';
import { Badge } from "./ui/badge";
import { calculateRecipeCost, calculateRecipeNutrition } from "../utils/calculations";

// Helper to generate a deterministic flat color based on a string
function getFlatColorFromName(name: string) {
  const colors = [
    "bg-rose-300",
    "bg-sky-300",
    "bg-amber-300",
    "bg-emerald-300",
    "bg-indigo-300",
    "bg-orange-300",
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % colors.length;
  return colors[index];
}

export function RecipeCard({ recipe, compact = false }: { recipe: Recipe; compact?: boolean }) {
    const navigate = useNavigate();
    const { costPerServing, costPartiallyUnknown } = calculateRecipeCost(recipe);
    const { nutritionPerServing } = calculateRecipeNutrition(recipe);
    const coverColor = getFlatColorFromName(recipe.name);

    return (
        <Card
            key={recipe.id}
            className={`flex flex-col overflow-hidden border border-palette-border bg-white shadow-soft cursor-pointer rounded-2xl ${compact ? '' : 'h-full'}`}
            onClick={() => navigate(`/meal/${recipe.id}`)}
        >
            {/* "Cover Image" Gradient Area */}
            <div className={`w-full ${coverColor} ${compact ? 'h-20 p-3' : 'h-40 p-4'} flex flex-col justify-between`}>
                <div className="flex justify-end gap-2">
                    {/* Cost Badge */}
                    <div className="bg-white/95 backdrop-blur-sm rounded-xl px-2.5 py-1.5 flex items-center gap-1 shadow-sm">
                        <DollarSign className="w-3.5 h-3.5 text-palette-amber" />
                        <span className="text-xs font-bold text-palette-text">
                            {costPerServing.toFixed(2)}{costPartiallyUnknown && "?"}
                        </span>
                    </div>
                    {/* Calories Badge */}
                    <div className="bg-white/95 backdrop-blur-sm rounded-xl px-2.5 py-1.5 flex items-center gap-1 shadow-sm">
                        <Flame className="w-3.5 h-3.5 text-palette-emerald" />
                        <span className="text-xs font-bold text-palette-text">
                            {Math.round(nutritionPerServing.kcal_per_unit)}
                        </span>
                    </div>
                </div>
            </div>
            
            <CardHeader className={compact ? 'pt-3 pb-1 px-4' : 'pt-5 pb-2 px-5'}>
                <CardTitle className={`${compact ? 'text-lg' : 'text-xl'} font-brand font-bold text-palette-text leading-tight line-clamp-2`}>
                    {recipe.name}
                </CardTitle>
            </CardHeader>
            <CardContent className={`${compact ? 'pb-3 px-4' : 'flex flex-col flex-1 pb-5 px-5'}`}>
                <div className={`flex flex-wrap items-center gap-x-4 gap-y-2 text-xs font-semibold text-palette-textMuted ${compact ? 'mb-2' : 'mb-4'}`}>
                    <span className="flex items-center gap-1.5">
                        <UtensilsCrossed className="w-4 h-4 text-palette-primary/80" />
                        {recipe.servings} serving{recipe.servings === 1 ? '' : 's'}
                    </span>
                    {(recipe.prep_time_minutes || recipe.cook_time_minutes) ? (
                        <span className="flex items-center gap-1.5">
                            <Clock className="w-4 h-4 text-palette-primary/80" />
                            {(recipe.prep_time_minutes || 0) + (recipe.cook_time_minutes || 0)} min
                        </span>
                    ) : null}
                </div>
                
                <div className={`${compact ? 'pt-1' : 'mt-auto pt-3'} flex flex-wrap gap-1.5`}>
                    {recipe.tags.slice(0, 3).map((tag) => (
                        <Badge key={tag.id} variant="secondary" className="text-[10px] px-2.5 py-0.5 bg-palette-background text-palette-textMuted border border-palette-border font-semibold hover:bg-gray-100 transition-colors">
                            {tag.name}
                        </Badge>
                    ))}
                    {recipe.tags.length > 3 && (
                        <Badge variant="secondary" className="text-[10px] px-2.5 py-0.5 bg-palette-background text-palette-textMuted border border-palette-border font-semibold">
                            +{recipe.tags.length - 3}
                        </Badge>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
