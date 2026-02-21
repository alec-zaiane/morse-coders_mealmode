import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '../components/ui/button';
import { useIngredientsRetrieve } from '../api/mealmodeAPI';

export function IngredientPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const numericId = id != null ? Number(id) : NaN;
  const { data, isLoading, isError } = useIngredientsRetrieve(
    Number.isNaN(numericId) ? 0 : numericId,
    { query: { enabled: !Number.isNaN(numericId) && numericId > 0 } }
  );
  const ingredient = data?.data;

  if (Number.isNaN(numericId) || numericId < 1) {
    return (
      <div className="text-center py-12">
        <p className="text-palette-taupe">Invalid ingredient</p>
        <Button onClick={() => navigate(-1)} className="mt-4">Go back</Button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="text-center py-12 text-palette-slate">Loading…</div>
    );
  }

  if (isError || !ingredient) {
    return (
      <div className="text-center py-12">
        <p className="text-palette-taupe">Ingredient not found</p>
        <Button onClick={() => navigate(-1)} className="mt-4">Go back</Button>
      </div>
    );
  }

  const stats = ingredient.nutrition_stats;
  const unit = stats?.base_unit ?? '—';

  return (
    <div>
      <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4">
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back
      </Button>
      <h2 className="text-2xl font-semibold text-palette-taupe">{ingredient.name}</h2>
      <p className="text-palette-slate mt-2">Unit: {unit}</p>
      {stats && (
        <div className="mt-4 p-4 bg-palette-cream rounded-lg text-sm text-palette-slate">
          <div>Calories per unit: {stats.kcal_per_unit ?? '—'}</div>
          <div>Protein per unit: {stats.protein_grams_per_unit ?? '—'}g</div>
          <div>Carbs (fiber): {stats.carbohydrate_fiber_grams_per_unit ?? '—'}g · Sugars: {stats.carbohydrate_sugar_grams_per_unit ?? '—'}g</div>
          <div>Fat (saturated): {stats.fat_saturated_grams_per_unit ?? '—'}g</div>
        </div>
      )}
    </div>
  );
}
