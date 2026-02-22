import { BrowserRouter, Routes, Route, NavLink, Outlet } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import { MealPlanPage } from './pages/MealPlanPage';
import { MealListPage } from './pages/MealListPage';
import { MealDetailPage } from './pages/MealDetailPage';
import { IngredientPage } from './pages/IngredientPage';
import { IngredientListPage } from './pages/IngredientListPage';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ChefHat, UtensilsCrossed, Calendar, Warehouse } from 'lucide-react';

function Layout() {
  return (
    <div className="min-h-screen bg-palette-mist">
      <nav className="border-b border-palette-mist bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-14 items-center gap-6">
            <NavLink
              to="/"
              end
              className={({ isActive }) =>
                `flex items-center gap-2 font-brand text-xl font-semibold tracking-tight ${isActive ? 'text-palette-terracotta' : 'text-palette-slate hover:text-palette-terracotta'}`
              }
            >
              <ChefHat className="h-6 w-6 shrink-0 text-palette-terracotta" aria-hidden />
              <span>MealMode</span>
            </NavLink>
            <span className="h-5 w-px bg-palette-mist/60" aria-hidden />
            <div className="ml-auto flex items-center gap-6">
              <NavLink
                to="/"
                end
                className={({ isActive }) =>
                  `flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium ${isActive ? 'bg-palette-cream/20 text-palette-terracotta' : 'text-palette-slate hover:bg-palette-cream/10 hover:text-palette-mist'}`
                }
              >
                <UtensilsCrossed className="w-5 h-5" />
                Meals
              </NavLink>
              <NavLink
                to="/plan"
                className={({ isActive }) =>
                  `flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium ${isActive ? 'bg-palette-cream/20 text-palette-terracotta' : 'text-palette-slate hover:bg-palette-cream/10 hover:text-palette-mist'}`
                }
              >
                <Calendar className="w-5 h-5" />
                Meal Plan
              </NavLink>
              <NavLink
                to="/ingredients"
                className={({ isActive }) =>
                  `flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium ${isActive ? 'bg-palette-cream/20 text-palette-terracotta' : 'text-palette-slate hover:bg-palette-cream/10 hover:text-palette-mist'}`
                }
              >
                <Warehouse className="w-5 h-5" />
                Ingredients
              </NavLink>
            </div>
          </div>
        </div>
      </nav>
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <Outlet />
      </main>
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
            </Route>
          </Routes>
        </AppProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
