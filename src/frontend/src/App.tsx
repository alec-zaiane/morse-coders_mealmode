import { BrowserRouter, Routes, Route, NavLink, Outlet } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import { MealPlanPage } from './pages/MealPlanPage';
import { MealListPage } from './pages/MealListPage';
import { MealDetailPage } from './pages/MealDetailPage';
import { IngredientPage } from './pages/IngredientPage';
import { IngredientListPage } from './pages/IngredientListPage';
import { ShoppingListPage } from './pages/ShoppingListPage';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ChefHat, UtensilsCrossed, Calendar, Warehouse, ShoppingCart } from 'lucide-react';

function Layout() {
  return (
    <div className="min-h-screen bg-palette-background font-sans text-palette-text">
      <nav className="sticky top-0 z-50 bg-palette-background/95 backdrop-blur-sm transition-all duration-300">
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
              <div className="flex w-full max-w-full items-center gap-1 overflow-x-auto rounded-full bg-white p-1 shadow-sm ring-1 ring-palette-border/80 whitespace-nowrap sm:w-auto">
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
              <Route path="shopping" element={<ShoppingListPage />} />
            </Route>
          </Routes>
        </AppProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
