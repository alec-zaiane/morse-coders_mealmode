import { useState, useMemo, useRef } from "react";
import { useIngredientsList, type Ingredient } from "../api/mealmodeAPI";
import { Input } from "../components/ui/input";
import { IngredientCard } from "../components/ingredientCard";
import { Refrigerator } from "lucide-react";
import { Button } from "../components/ui/button";

export function IngredientListPage() {
    const [searchTerm, setSearchTerm] = useState('');
    const [showNIngredients, setShowNIngredients] = useState(50);
    const [onHandOnly, setOnHandOnly] = useState(false);
    const { data: ingredients, isLoading, error } = useIngredientsList({
        limit: 100,
        ...(searchTerm.trim() && { search: searchTerm.trim() }),
        ...(onHandOnly && { on_hand__isnull: false }),
    });


    const lastFiltered = useRef<typeof filteredIngredients>([]);
    const filteredIngredients: Ingredient[] = useMemo(() => {
        if (!ingredients) return lastFiltered.current;
        const result = ingredients.data.results.filter(ingredient => {
            if (!ingredient.name.toLowerCase().includes(searchTerm.toLowerCase())) { return false; }
            if (onHandOnly && ingredient.on_hand === null) { return false; }
            return true;
        });
        lastFiltered.current = result;
        return result;
    }, [ingredients, searchTerm, onHandOnly]);

    if (error || !ingredients && !isLoading) {
        return <div>Error loading ingredients: {error?.message ?? "Could not filter ingredients"}</div>;
    }

    return (<div>
        <h1 className="text-2xl font-bold mb-4">Ingredients</h1>
        <div className="mb-4 flex items-center gap-4">
            <Input
                type="text"
                placeholder="Search ingredients..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="flex-1"
            />
            <div className="flex items-center gap-2 shrink-0">
                <label htmlFor="showN" className="text-sm font-medium whitespace-nowrap">Show</label>
                <Input
                    id="showN"
                    type="number"
                    min={1}
                    value={showNIngredients}
                    onChange={e => setShowNIngredients(Number(e.target.value))}
                    className="w-20"
                />
            </div>
            <Button
                onClick={() => setOnHandOnly(v => !v)}
                variant={onHandOnly ? "default" : "outline"}
            >
                <Refrigerator size={16} className="mr-1" />
                On hand
            </Button>
        </div>
        <ul className="space-y-2">
            {filteredIngredients?.slice(0, showNIngredients).map(ingredient => (
                <IngredientCard key={ingredient.id} ingredient={ingredient} />
            ))}
        </ul>
    </div>);

}