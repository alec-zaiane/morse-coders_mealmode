# MealMode

Plan your week's meals, set servings per slot, and get one shopping list scaled to your plan and pantry.

## Features

- **Meals** — Add and manage recipes with ingredients, steps, tags, prep/cook time, and optional notes. View cost and nutrition per serving.
- **Weekly plan** — Fill breakfast, lunch, and dinner (and snack) slots for each day. Edit servings per slot for families and meal prep.
- **Shopping list** — Generate a single list from your plan: ingredients are scaled by \(\frac{\text{plan servings}}{\text{recipe servings}}\) and on-hand quantities are subtracted.
- **Pantry** — Track ingredients and “on hand” quantities so the shopping list only shows what you need to buy.
- **Filters** — Filter meals by tags, max cost per serving, and max calories. Import and review recipes from external sources.

## Tech stack

| Layer    | Stack |
|----------|--------|
| Frontend | React 19, TypeScript, Vite, Tailwind CSS, TanStack Query, React Router, Lucide icons |
| Backend  | Django 6, Django REST Framework, drf-spectacular (OpenAPI), PostgreSQL (production) |
| API      | REST; frontend client generated with Orval from OpenAPI schema |

## Project structure

```
mealmode/
├── pyproject.toml          # Python/uv project (backend deps)
├── src/
│   ├── backend/            # Django app (api, migrations, manage.py)
│   └── frontend/           # React app (Vite, src/components, pages, api)
└── README.md
```

## Setup

### Prerequisites

- **Python 3.13+** and [uv](https://docs.astral.sh/uv/) (or pip)
- **Node.js 18+** and npm

### Backend

1. From the repo root, install and run the backend:

   ```bash
   uv sync
   uv run python src/backend/manage.py migrate
   uv run python src/backend/manage.py runserver
   ```

   The API will be at **http://localhost:8000**. Optional: create a superuser with `uv run python src/backend/manage.py createsuperuser`.

2. For a fresh DB, use SQLite (default). For PostgreSQL, set `DATABASE_URL` and use the `psycopg` dependency already in `pyproject.toml`.

### Frontend

1. Install and start the dev server:

   ```bash
   cd src/frontend
   npm install
   npm run dev
   ```

   The app will be at **http://localhost:5173** and will talk to the backend at `http://localhost:8000`.

2. **Regenerate API client** (after backend schema changes):

   ```bash
   npm run gen-api
   ```

   This runs the backend’s `spectacular` schema export and then Orval to generate `src/api/mealmodeAPI.ts`.

## Scripts

| Command | Where | Description |
|--------|--------|-------------|
| `uv run python src/backend/manage.py runserver` | root | Run Django dev server (port 8000) |
| `npm run dev` | src/frontend | Run Vite dev server (port 5173) |
| `npm run build` | src/frontend | TypeScript check + production build |
| `npm run gen-api` | src/frontend | Export OpenAPI schema and generate API client |

## About the project

### What inspired me

I wanted an app that actually matched how I cook: a small set of recipes, a weekly plan, and one list for the shop—without re-typing ingredients or doing mental math when cooking for more people. Existing tools were either too heavy or didn’t handle “this recipe is for 4, but I’m planning it for 2” in a simple way. So I built **MealMode** to focus on that: plan the week, set servings per slot (great for families and meal prep), and get a single shopping list that scales to your plan and subtracts what you already have.

### How I built it

- **Frontend:** React (Vite), TypeScript, Tailwind CSS, and TanStack Query for server state. The UI is built around a weekly grid (breakfast / lunch / dinner), recipe cards with cost and nutrition per serving, and a shopping list that updates when the plan or servings change.
- **Backend:** Django REST Framework with models for recipes, ingredients, tags, meal-plan entries (day, slot, servings), and an ingredient store for “on hand” quantities. The shopping list is computed by scaling recipe ingredients by \(\frac{\text{plan servings}}{\text{recipe servings}}\) and then subtracting on-hand amounts.
- **Flow:** Users add or pick recipes, fill the weekly plan, optionally edit servings per slot, then generate the list. Filters (tags, max cost, max calories) and an “on hand” pantry keep the list relevant.

### What I learned

- **Scaling and aggregation:** Making the shopping list correct for multiple recipes and different serving sizes—and merging the same ingredient across meals—required clear scaling logic and consistent units (e.g. kg, L, pc).
- **API design:** Exposing meal-plan entries with PATCH for servings (so the plan and list stay in sync) and keeping the frontend simple with a small set of endpoints.
- **UX details:** Editable servings in the plan grid, “Filter by tags” with an “All” default, and a visible “X servings” so the plan and list never feel disconnected.

### Challenges I faced

- **Shopping list vs plan mismatch:** The list was initially computed as if every planned meal were 1 serving. Fixing it meant passing each plan entry’s servings into the aggregation and using the scale factor above so the list matches what you actually planned.
- **Keeping the plan and list in sync:** Letting users edit servings in the plan (for families or meal prep) meant adding PATCH support on the backend and wiring it through the app context so the list recomputes as soon as the plan changes.
- **Scope:** Balancing “enough features to be useful” (filters, nutrition, cost, on-hand) with “simple enough to build and maintain” led to a focused feature set: meals, plan, and list first.
