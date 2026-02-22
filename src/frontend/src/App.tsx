import { BrowserRouter, Routes, Route, NavLink, Outlet } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import { MealPlanPage } from './pages/MealPlanPage';
import { MealListPage } from './pages/MealListPage';
import { MealDetailPage } from './pages/MealDetailPage';
import { IngredientPage } from './pages/IngredientPage';
import { IngredientListPage } from './pages/IngredientListPage';
import { ShoppingListPage } from './pages/ShoppingListPage';
import { ReviewImportedRecipePage } from './pages/ReviewImportedRecipePage';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ChefHat, UtensilsCrossed, Calendar, Warehouse, ShoppingCart } from 'lucide-react';

function Layout() {
  return (
    <div className="min-h-screen bg-palette-background font-sans text-palette-text">
      <nav className="!fixed !top-0 !left-0 !right-0 z-[100] w-full bg-palette-background/95 backdrop-blur-sm transition-all duration-300">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex min-h-20 flex-col items-center justify-center gap-3 py-4">
            <NavLink
              to="/"
              end
              className="flex items-center gap-2 font-brand text-2xl font-bold tracking-tight text-palette-text transition-opacity hover:opacity-80"
            >
              <div className="rounded-lg bg-palette-primary p-2">
                <ChefHat className="h-5 w-5 shrink-0 text-white" aria-hidden />
              </div>
              <span>MealMode</span>
            </NavLink>

            {/* Primary Nav */}
            <div className="hidden w-full max-w-full items-center gap-1 overflow-x-auto rounded-full bg-white p-1 shadow-sm ring-1 ring-palette-border/80 whitespace-nowrap sm:flex sm:w-auto">
              <NavLink
                to="/"
                end
                className={({ isActive }) =>
                  `flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors ${isActive ? 'bg-palette-primary text-white' : 'text-palette-textMuted hover:bg-gray-100 hover:text-palette-text'}`
                }
              >
                <UtensilsCrossed className="w-4 h-4" />
                Meals
              </NavLink>
              <NavLink
                to="/plan"
                className={({ isActive }) =>
                  `flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors ${isActive ? 'bg-palette-primary text-white' : 'text-palette-textMuted hover:bg-gray-100 hover:text-palette-text'}`
                }
              >
                <Calendar className="w-4 h-4" />
                Weekly Plan
              </NavLink>
              <NavLink
                to="/ingredients"
                className={({ isActive }) =>
                  `flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors ${isActive ? 'bg-palette-primary text-white' : 'text-palette-textMuted hover:bg-gray-100 hover:text-palette-text'}`
                }
              >
                <Warehouse className="w-4 h-4" />
                Pantry
              </NavLink>
              <NavLink
                to="/shopping"
                className={({ isActive }) =>
                  `flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors ${isActive ? 'bg-palette-primary text-white' : 'text-palette-textMuted hover:bg-gray-100 hover:text-palette-text'}`
                }
              >
                <ShoppingCart className="w-4 h-4" />
                Shopping
              </NavLink>
            </div>
          </div>
        </div>
      </nav>
      <main className="mx-auto max-w-7xl px-4 pb-24 pt-28 sm:px-6 sm:pb-8 sm:pt-40 lg:px-8">
        <Outlet />
      </main>

      <div className="fixed inset-x-0 bottom-0 z-50 border-t border-palette-border/70 bg-white/95 px-2 pb-[calc(env(safe-area-inset-bottom)+0.5rem)] pt-2 backdrop-blur-sm sm:hidden">
        <div className="mx-auto flex max-w-md items-center justify-between gap-1">
          <NavLink
            to="/"
            end
            className={({ isActive }) =>
              `flex min-w-0 flex-1 flex-col items-center gap-1 rounded-2xl px-2 py-2 text-[11px] font-semibold ${
                isActive ? 'bg-palette-primary/10 text-palette-primaryDark' : 'text-palette-textMuted'
              }`
            }
          >
            <UtensilsCrossed className="h-5 w-5" />
            <span>Meals</span>
          </NavLink>
          <NavLink
            to="/plan"
            className={({ isActive }) =>
              `flex min-w-0 flex-1 flex-col items-center gap-1 rounded-2xl px-2 py-2 text-[11px] font-semibold ${
                isActive ? 'bg-palette-primary/10 text-palette-primaryDark' : 'text-palette-textMuted'
              }`
            }
          >
            <Calendar className="h-5 w-5" />
            <span>Plan</span>
          </NavLink>
          <NavLink
            to="/ingredients"
            className={({ isActive }) =>
              `flex min-w-0 flex-1 flex-col items-center gap-1 rounded-2xl px-2 py-2 text-[11px] font-semibold ${
                isActive ? 'bg-palette-primary/10 text-palette-primaryDark' : 'text-palette-textMuted'
              }`
            }
          >
            <Warehouse className="h-5 w-5" />
            <span>Pantry</span>
          </NavLink>
          <NavLink
            to="/shopping"
            className={({ isActive }) =>
              `flex min-w-0 flex-1 flex-col items-center gap-1 rounded-2xl px-2 py-2 text-[11px] font-semibold ${
                isActive ? 'bg-palette-primary/10 text-palette-primaryDark' : 'text-palette-textMuted'
              }`
            }
          >
            <ShoppingCart className="h-5 w-5" />
            <span>Shop</span>
          </NavLink>
        </div>
      </div>
    </div>
  );
}

const queryClient = new QueryClient();

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AppProvider>
          <Routes>
            <Route element={<Layout />}>
              <Route index element={<MealListPage />} />
              <Route path="meal/:id" element={<MealDetailPage />} />
              <Route path="ingredient/:id" element={<IngredientPage />} />
              <Route path="plan" element={<MealPlanPage />} />
              <Route path="ingredients" element={<IngredientListPage />} />
              <Route path="shopping" element={<ShoppingListPage />} />
              <Route path="import/review" element={<ReviewImportedRecipePage />} />
            </Route>
          </Routes>
        </AppProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
