import { BrowserRouter, Routes, Route, NavLink, Outlet } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import { MealListPage } from './pages/MealListPage';
import { MealDetailPage } from './pages/MealDetailPage';
import { IngredientPage } from './pages/IngredientPage';
import { UtensilsCrossed } from 'lucide-react';

function Layout() {
  return (
    <div className="min-h-screen bg-palette-mist">
      <nav className="border-b border-palette-mist bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-14 items-center gap-6">
            <NavLink
              to="/"
              className={({ isActive }) =>
                `flex items-center gap-2 text-sm font-medium ${isActive ? 'text-palette-terracotta' : 'text-palette-slate hover:text-palette-taupe'}`
              }
            >
              <UtensilsCrossed className="w-5 h-5" />
              Meals
            </NavLink>
          </div>
        </div>
      </nav>
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <Outlet />
      </main>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppProvider>
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<MealListPage />} />
            <Route path="meal/:id" element={<MealDetailPage />} />
            <Route path="ingredient/:id" element={<IngredientPage />} />
          </Route>
        </Routes>
      </AppProvider>
    </BrowserRouter>
  );
}
