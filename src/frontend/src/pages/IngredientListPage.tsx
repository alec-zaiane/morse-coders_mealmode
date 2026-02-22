import { useState, useMemo, useRef } from "react";
import { useIngredientsList, type Ingredient } from "../api/mealmodeAPI";
import { Input } from "../components/ui/input";
import { IngredientCard } from "../components/ingredientCard";
import { Refrigerator, Warehouse, Settings } from "lucide-react";
import { Button } from "../components/ui/button";
import { Skeleton } from "../components/ui/skeleton";

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
        const result = ingredients.data.results?.filter(ingredient => {
            if (!ingredient.name.toLowerCase().includes(searchTerm.toLowerCase())) { return false; }
            if (onHandOnly && ingredient.on_hand === null) { return false; }
            return true;
        });
        lastFiltered.current = result;
        return result;
    }, [ingredients, searchTerm, onHandOnly]);

    if (error || !ingredients && !isLoading) {
        return <div className="text-center py-12 text-palette-slate">Error loading ingredients: {error?.message ?? "Could not filter ingredients"}</div>;
    }

    const isEmpty = !isLoading && Array.isArray(filteredIngredients) && filteredIngredients.length === 0;

    return (<div>
        <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
                <Warehouse className="h-7 w-7 text-palette-terracotta shrink-0" aria-hidden />
                <h2 className="text-2xl font-semibold text-palette-taupe">Ingredients</h2>
            </div>
            <p className="text-palette-slate">View and manage your pantry items, nutrition, and what’s on hand.</p>
        </div>
        <div className="mb-6 flex items-center gap-4">
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
        {isLoading ? (
            <ul className="space-y-2 mt-2">
                {Array.from({ length: 8 }).map((_, i) => (
                    <li key={i}>
                        <Skeleton className="h-16 w-full rounded-lg" />
                    </li>
                ))}
            </ul>
        ) : isEmpty ? (
            <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
                <Warehouse className="h-14 w-14 text-palette-mist mb-4" aria-hidden />
                <p className="text-lg font-medium text-palette-taupe mb-1">No ingredients yet</p>
                <p className="text-palette-slate text-sm mb-6 max-w-sm">
                    Add ingredients in the admin, or they’ll appear when you add meals.
                </p>
                <a
                    href="/admin"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center rounded-md font-medium h-10 px-4 py-2 border border-palette-taupe bg-white hover:bg-palette-mist transition-colors"
                >
                    <Settings className="w-4 h-4 mr-2" />
                    Open Admin
                </a>
            </div>
        ) : (
            <ul className="space-y-2 mt-2">
                {filteredIngredients?.slice(0, showNIngredients).map(ingredient => (
                    <IngredientCard key={ingredient.id} ingredient={ingredient} />
                ))}
            </ul>
        )}
    </div>);

}