import { useMemo, useState, useCallback, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { useRecipesList } from '../api/mealmodeAPI';
import { useIngredientStoreList } from '../api/mealmodeAPI';
import type { Recipe } from '../api/mealmodeAPI';
import {
  buildShoppingList,
  getShoppingListId,
  getBoughtSet,
  setBought,
  itemKey,
  type ShoppingListItem,
} from '../utils/shoppingList';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Skeleton } from '../components/ui/skeleton';
import { ShoppingCart, Calendar, CheckCircle2, Circle } from 'lucide-react';

function ShoppingListContent() {
  const { mealPlan } = useApp();
  const { data: recipeData, isLoading: recipesLoading } = useRecipesList();
  const { data: onHandData } = useIngredientStoreList({ limit: 500 });

  const recipes = useMemo((): Recipe[] => {
    const body =
      recipeData && typeof recipeData === 'object' && 'data' in recipeData
        ? (recipeData as { data: { results?: Recipe[] } }).data?.results
        : (recipeData as { results?: Recipe[] } | undefined)?.results;
    return Array.isArray(body) ? body : [];
  }, [recipeData]);

  const onHandList = useMemo(() => {
    const results = onHandData?.data?.results;
    return Array.isArray(results) ? results : [];
  }, [onHandData]);

  const planEntries = useMemo(
    () => mealPlan.map((e) => ({ mealId: e.mealId, servings: e.servings })),
    [mealPlan]
  );

  const listId = useMemo(() => getShoppingListId(planEntries), [planEntries]);
  const shoppingList = useMemo(
    () => buildShoppingList(planEntries, recipes, onHandList),
    [planEntries, recipes, onHandList]
  );

  const [boughtSet, setBoughtSetState] = useState<Set<string>>(() => getBoughtSet(listId));
  const [checkoutStatus, setCheckoutStatus] = useState<'idle' | 'loading' | 'success'>('idle');
  
  useEffect(() => {
    setBoughtSetState(getBoughtSet(listId));
  }, [listId]);

  const handleInstacartCheckout = useCallback(() => {
    setCheckoutStatus('loading');
    
    // In a real app with partner access, we'd hit the Instacart affiliate API here mapping ingredients to products.
    // For a hackathon demo, we'll fake the compilation time and show a magic success state.
    setTimeout(() => {
      setCheckoutStatus('success');
      // Revert back to idle after a few seconds so they could click it again if they want
      setTimeout(() => setCheckoutStatus('idle'), 3000);
    }, 1500);
  }, []);

  const toggleBought = useCallback(
    (item: ShoppingListItem, checked: boolean) => {
      const key = itemKey(item);
      setBought(listId, key, checked);
      setBoughtSetState((prev) => {
        const next = new Set(prev);
        if (checked) next.add(key);
        else next.delete(key);
        return next;
      });
    },
    [listId]
  );

  const isEmpty = planEntries.length === 0;
  const noItemsToBuy = !isEmpty && shoppingList.length === 0;

  if (recipesLoading) {
    return (
      <div>
        <div className="mb-6">
          <Skeleton className="h-8 w-64 mb-2" />
          <Skeleton className="h-4 w-96" />
        </div>
        <Card>
          <CardContent className="p-6">
            <ul className="space-y-3">
              {Array.from({ length: 8 }).map((_, i) => (
                <li key={i}>
                  <Skeleton className="h-10 w-full rounded" />
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 md:space-y-8 animate-fadeIn">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="font-brand text-2xl md:text-3xl font-semibold text-black mb-2 flex items-center gap-2 tracking-tight">
            <ShoppingCart className="h-7 w-7 text-palette-terracotta" aria-hidden />
            Shopping List
          </h1>
          <p className="text-black">
            {isEmpty
              ? 'Add meals to your meal plan, then generate your list.'
              : 'What to buy for your planned meals. On-hand quantities have been subtracted.'}
          </p>
        </div>
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:flex-wrap">
          {!isEmpty && !noItemsToBuy && (
            <Button 
              onClick={checkoutStatus === 'idle' ? handleInstacartCheckout : undefined} 
              disabled={checkoutStatus === 'loading'} 
              className={`w-full sm:w-auto flex items-center justify-center gap-2 border-0 transition-all duration-300 transform hover:-translate-y-0.5 hover:shadow-lg ${
                checkoutStatus === 'success' 
                  ? 'bg-green-600 hover:bg-green-700 text-white' 
                  : 'bg-[#0aad0a] hover:bg-[#088c08] text-white'
              }`}
            >
              {checkoutStatus === 'loading' && (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/50 border-t-white" />
              )}
              {checkoutStatus === 'idle' && <ShoppingCart className="w-4 h-4" />}
              {checkoutStatus === 'success' && <CheckCircle2 className="w-4 h-4 animate-fadeIn" />}
              
              {checkoutStatus === 'loading' ? 'Transferring Items...' 
                : checkoutStatus === 'success' ? 'Sent to Instacart!' 
                : 'Send to Instacart'}
            </Button>
          )}
          <Button asChild variant="outline" className="w-full sm:w-auto">
            <Link to="/plan" className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Edit meal plan
            </Link>
          </Button>
        </div>
      </div>

      {isEmpty ? (
        <Card>
          <CardContent className="py-12 text-center">
            <ShoppingCart className="h-12 w-12 text-palette-mist mx-auto mb-3" aria-hidden />
            <p className="text-palette-taupe font-medium mb-1">No meal plan yet</p>
            <p className="text-palette-slate text-sm mb-4">
              Add meals to your meal plan first, then come back here to generate your shopping list.
            </p>
            <Button asChild>
              <Link to="/plan">Go to meal plan</Link>
            </Button>
          </CardContent>
        </Card>
      ) : noItemsToBuy ? (
        <Card>
          <CardContent className="py-12 text-center">
            <CheckCircle2 className="h-12 w-12 text-green-600 mx-auto mb-3" aria-hidden />
            <p className="text-palette-taupe font-medium mb-1">Nothing to buy</p>
            <p className="text-palette-slate text-sm">
              You already have everything on hand for your planned meals.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">What to buy</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-1">
              {shoppingList.map((item) => {
                const key = itemKey(item);
                const bought = boughtSet.has(key);
                return (
                  <li
                    key={key}
                    className={`flex items-center gap-3 py-2 px-3 rounded-md transition-colors ${
                      bought ? 'bg-palette-mist/30' : ''
                    }`}
                  >
                    <label className="flex items-center gap-3 cursor-pointer flex-1 min-w-0">
                      <span className="flex items-center justify-center w-6 h-6 shrink-0">
                        {bought ? (
                          <CheckCircle2
                            className="w-6 h-6 text-green-600"
                            aria-hidden
                          />
                        ) : (
                          <Circle
                            className="w-6 h-6 text-palette-slate"
                            aria-hidden
                          />
                        )}
                        <input
                          type="checkbox"
                          checked={bought}
                          onChange={(e) => toggleBought(item, e.target.checked)}
                          className="sr-only"
                          aria-label={`Mark ${item.name} ${item.displayLabel} as bought`}
                        />
                      </span>
                      <span
                        className={
                          bought
                            ? 'text-palette-slate line-through'
                            : 'text-palette-taupe'
                        }
                      >
                        {item.name} {item.displayLabel}
                      </span>
                    </label>
                  </li>
                );
              })}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export function ShoppingListPage() {
  return <ShoppingListContent />;
}
