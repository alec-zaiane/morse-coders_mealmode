import { useNavigate } from "react-router-dom";
import type { Ingredient } from "../api/mealmodeAPI";
import { Card } from "./ui/card";
import { ChevronsRight, CircleAlert } from "lucide-react";
import { Button } from "./ui/button";


export function IngredientCard({ ingredient }: { ingredient: Ingredient }) {
    const navigate = useNavigate();
    const unit = ingredient.nutrition_stats?.base_unit ?? "units";

    return (<Card
        key={ingredient.id}
        role="button"
        tabIndex={0}
        className="transition-all p-4 cursor-pointer hover:bg-palette-lightblue/90 hover:shadow-md"
        onClick={() => navigate(`/ingredient/${ingredient.id}`)}
        onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                navigate(`/ingredient/${ingredient.id}`);
            }
        }}
    >
        <div className="flex items-center justify-between">
            <div>
                <h2 className="text-lg font-semibold">{ingredient.name}</h2>
            </div>
            <div className="flex items-center gap-4">
                {ingredient.on_hand && (

                    <p className="text-sm text-gray-500">
                        {ingredient.on_hand.desired_quantity && ingredient.on_hand.quantity && ingredient.on_hand.quantity < ingredient.on_hand.desired_quantity &&
                            <span className="text-orange-500 flex items-center gap-1">
                                <CircleAlert className="w-4 h-4" />
                                Low on hand
                            </span>
                        }
                        {ingredient.on_hand.quantity && !ingredient.on_hand.desired_quantity && `On hand: ${ingredient.on_hand.quantity} ${unit}`}
                        {ingredient.on_hand.desired_quantity && `On hand: ${ingredient.on_hand.quantity ?? "?"} / ${ingredient.on_hand.desired_quantity} ${unit}`}
                        {ingredient.on_hand.notes && ` (${ingredient.on_hand.notes})`}
                    </p>
                )}
                <span className="text-palette-mist shrink-0" aria-hidden>
                    <ChevronsRight size={16} />
                </span>
            </div>
        </div>
    </Card>
    )
}