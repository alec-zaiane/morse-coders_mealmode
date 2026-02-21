import type { NutritionStatsAggregated } from "../utils/calculations";

export function NutritionLabel({ nutritionStats, per_unit }: { nutritionStats: NutritionStatsAggregated, per_unit: string }) {

    return (
        <div className="bg-white p-4">
            <div className="border-b-2 border-black mb-2">
                <div className="text-left text-2xl font-bold">Nutrition Facts</div>
                <div className="text-left text-md font-medium">Per {per_unit}</div>
            </div>
            <div className="border-b-2 border-black mb-1">

                <div className="flex justify-between">
                    <div className="text-left font-bold">Calories</div>
                    <div className="text-right font-bold">{Math.round(nutritionStats.kcal_per_unit)}</div>
                </div>
                <div className="flex justify-between">
                    <div className="text-left font-bold">Fat</div>
                    <div className="text-right font-bold">{Math.round(nutritionStats.fat_saturated_grams_per_unit + nutritionStats.fat_trans_grams_per_unit)}g</div>
                </div>
                <div className="text-small ml-2">
                    <div className="text-small ml-2 flex justify-between">
                        <div className="text-left">Saturated</div>
                        <div className="text-right ml-1">{Math.round(nutritionStats.fat_saturated_grams_per_unit)}g</div>
                    </div>
                    <div className="text-small ml-2 flex justify-between">
                        <div className="text-left">+ Trans</div>
                        <div className="text-right ml-1">{Math.round(nutritionStats.fat_trans_grams_per_unit)}g</div>
                    </div>
                </div>
            </div>
            <div className="border-b-2 border-black mb-1">
                <div className="flex justify-between">
                    <div className="text-left font-bold">Carbohydrates</div>
                    <div className="text-right font-bold">{Math.round(nutritionStats.carbohydrate_sugar_grams_per_unit + nutritionStats.carbohydrate_fiber_grams_per_unit)}g</div>
                </div>
                <div className="text-small ml-2">
                    <div className="text-small ml-2 flex justify-between">
                        <div className="text-left">Fibres</div>
                        <div className="text-right ml-1">{Math.round(nutritionStats.carbohydrate_fiber_grams_per_unit)}g</div>
                    </div>
                    <div className="text-small ml-2 flex justify-between">
                        <div className="text-left">Sugar</div>
                        <div className="text-right ml-1">{Math.round(nutritionStats.carbohydrate_sugar_grams_per_unit)}g</div>
                    </div>
                </div>
            </div>
            <div className="border-b-2 border-black mb-1">
                <div className="flex justify-between">
                    <div className="text-left font-bold">Protein</div>
                    <div className="text-right font-bold">{Math.round(nutritionStats.protein_grams_per_unit)}g</div>
                </div>
            </div>
            <div className="border-b-2 border-black mb-1">
                <div className="flex justify-between">
                    <div className="text-left font-bold">Cholesterol</div>
                    <div className="text-right font-bold">{Math.round(nutritionStats.cholesterol_milligrams_per_unit)}mg</div>
                </div>
            </div>
            <div className="border-b-4 border-black mb-2">
                <div className="flex justify-between">
                    <div className="text-left font-bold">Sodium</div>
                    <div className="text-right font-bold">{Math.round(nutritionStats.sodium_milligrams_per_unit)}mg</div>
                </div>
            </div>
            <div className="border-b-2 border-black mb-1">
                <div className="flex justify-between">
                    <div className="text-left font-bold">Potassium</div>
                    <div className="text-right font-bold">{Math.round(nutritionStats.potassium_milligrams_per_unit)}mg</div>
                </div>
            </div>
            <div className="border-b-2 border-black mb-1">
                <div className="flex justify-between">
                    <div className="text-left font-bold">Calcium</div>
                    <div className="text-right font-bold">{Math.round(nutritionStats.calcium_milligrams_per_unit)}mg</div>
                </div>
            </div>
            <div className="border-b-4 border-black mb-2">
                <div className="flex justify-between">
                    <div className="text-left font-bold">Iron</div>
                    <div className="text-right font-bold">{Math.round(nutritionStats.iron_milligrams_per_unit)}mg</div>
                </div>
            </div>

        </div>
    )

}