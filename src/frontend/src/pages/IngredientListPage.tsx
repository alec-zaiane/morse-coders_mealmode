import { useState, useMemo, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useIngredientsList, useIngredientsCreate, getIngredientsListQueryKey, type Ingredient } from "../api/mealmodeAPI";
import { Input } from "../components/ui/input";
import { IngredientCard } from "../components/ingredientCard";
import { Refrigerator, Search, SlidersHorizontal, Plus } from "lucide-react";
import { Button } from "../components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "../components/ui/dialog";

export function IngredientListPage() {
    const queryClient = useQueryClient();
    const [searchTerm, setSearchTerm] = useState('');
    const [showNIngredients, setShowNIngredients] = useState(50);
    const [onHandOnly, setOnHandOnly] = useState(false);
    const [addIngredientOpen, setAddIngredientOpen] = useState(false);
    const [newIngredientName, setNewIngredientName] = useState('');
    const { data: ingredients, isLoading, error } = useIngredientsList({
        limit: 100,
        ...(searchTerm.trim() && { search: searchTerm.trim() }),
        ...(onHandOnly && { on_hand__isnull: false }),
    });
    const createIngredient = useIngredientsCreate({
        mutation: {
            onSuccess: () => {
                queryClient.invalidateQueries({ queryKey: getIngredientsListQueryKey() });
                setNewIngredientName('');
                setAddIngredientOpen(false);
            },
        },
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
        return <div className="p-8 text-center text-rose-500 font-medium">Error loading ingredients: {error?.message ?? "Could not filter ingredients"}</div>;
    }

    const handleAddIngredient = (e: React.FormEvent) => {
        e.preventDefault();
        const name = newIngredientName.trim();
        if (!name) return;
        createIngredient.mutate({ data: { name } });
    };

    return (<div className="space-y-8 animate-[fadeIn_0.5s_ease-out]">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
                <h1 className="text-4xl font-brand font-extrabold text-palette-text mb-1 tracking-tight">Pantry & Cost Intelligence</h1>
                <p className="text-palette-textMuted text-sm font-medium">Track your ingredients, costs, and nutritional baselines.</p>
            </div>
            <Dialog open={addIngredientOpen} onOpenChange={setAddIngredientOpen}>
                <DialogTrigger asChild>
                    <Button className="bg-palette-primary hover:bg-palette-primaryDark text-white px-6 shadow-soft transition-all hover:shadow-md">
                        <Plus className="w-4 h-4 mr-2" />
                        Add Ingredient
                    </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>Add ingredient</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleAddIngredient} className="space-y-4 mt-2">
                        <div>
                            <label className="block text-sm font-bold text-palette-text mb-2">Ingredient Name</label>
                            <Input
                                value={newIngredientName}
                                onChange={e => setNewIngredientName(e.target.value)}
                                placeholder="e.g. Olive oil"
                                required
                            />
                        </div>
                        {createIngredient.isError && (
                            <p className="text-sm text-red-600">Failed to create ingredient. Try again.</p>
                        )}
                        <div className="flex gap-3 justify-end mt-8">
                            <Button type="button" variant="ghost" onClick={() => setAddIngredientOpen(false)} className="px-6 text-palette-textMuted">
                                Cancel
                            </Button>
                            <Button type="submit" disabled={createIngredient.isPending}>
                                {createIngredient.isPending ? 'Creating…' : 'Create'}
                            </Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>
        </div>

        <div className="flex flex-col md:flex-row gap-4 p-5 bg-white rounded-3xl shadow-soft border border-palette-border items-center">
            <div className="relative group flex-1 w-full">
                <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-palette-textMuted transition-colors" />
                <Input
                    type="text"
                    placeholder="Search pantry..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="pl-12 bg-gray-50 border-transparent hover:border-palette-border rounded-2xl h-12 text-base transition-all w-full"
                />
            </div>
            <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
                <div className="flex items-center gap-2 bg-gray-50 rounded-2xl px-4 h-12 border border-palette-border w-full sm:w-auto transition-all">
                    <SlidersHorizontal className="w-4 h-4 text-palette-textMuted" />
                    <label htmlFor="showN" className="text-sm font-semibold text-palette-text whitespace-nowrap">Show</label>
                    <Input
                        id="showN"
                        type="number"
                        min={1}
                        value={showNIngredients}
                        onChange={e => setShowNIngredients(Number(e.target.value))}
                        className="w-16 h-8 border-transparent bg-transparent outline-none shadow-none p-0 text-center font-bold focus-visible:ring-0 text-palette-primary"
                    />
                </div>
                <Button
                    onClick={() => setOnHandOnly(v => !v)}
                    variant={onHandOnly ? "default" : "outline"}
                    className={`w-full sm:w-auto rounded-2xl h-12 px-6 font-bold transition-all flex-shrink-0 ${onHandOnly ? "shadow-md" : "shadow-none"}`}
                >
                    <Refrigerator size={18} className="mr-2" />
                    In Stock Only
                </Button>
            </div>
        </div>

        <div>
            <div className="mb-6 flex items-center gap-3">
                <div className="h-px bg-palette-border flex-1" />
                <span className="text-xs font-bold uppercase tracking-wider text-palette-textMuted">
                    Showing {filteredIngredients?.slice(0, showNIngredients).length} ingredients
                </span>
                <div className="h-px bg-palette-border flex-1" />
            </div>
            {filteredIngredients?.length === 0 && (
              <div className="text-center py-16 text-palette-textMuted bg-white rounded-3xl border border-palette-border shadow-sm border-dashed">
                <p className="text-lg font-medium">No ingredients found matching your search.</p>
              </div>
            )}
            <ul className="space-y-4">
                {filteredIngredients?.slice(0, showNIngredients).map(ingredient => (
                    <IngredientCard key={ingredient.id} ingredient={ingredient} />
                ))}
            </ul>
        </div>
    </div>);
}
