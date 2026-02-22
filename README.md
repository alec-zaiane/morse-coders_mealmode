# MealMode

MealMode is a weekly meal planning app that turns recipes into a serving-aware shopping list after subtracting pantry inventory.

## Problem

Meal planning tools often miss practical kitchen workflows:
- Recipe servings rarely match planned servings for each meal slot.
- Shopping lists usually do not account for what is already on hand.
- Planning, pantry tracking, and grocery prep are split across different tools.

## Solution

MealMode combines recipes, a weekly planner, pantry tracking, and list generation in one flow:
- Plan meals across breakfast, lunch, dinner, and snacks.
- Adjust servings per slot (not just per recipe).
- Auto-calculate a consolidated shopping list by scaling ingredient quantities and subtracting pantry amounts.

## Key Features

- Recipe management: ingredients, steps, prep/cook time, tags, nutrition, and estimated cost.
- Weekly planning grid: assign recipes by day and meal slot.
- Serving-aware scaling: ingredient quantities are scaled by `planned_servings / recipe_servings`.
- Pantry-aware shopping list: on-hand inventory is deducted from required totals.
- Smart filtering: find meals by tags, max calories, and max cost.
- Recipe import + review flow: load external recipes and confirm before saving.

## Tech Stack

| Layer | Stack |
|---|---|
| Frontend | React 19, TypeScript, Vite, Tailwind CSS, TanStack Query, React Router |
| Backend | Django 6, Django REST Framework, django-filter, drf-spectacular |
| Data | PostgreSQL (Docker/prod), SQLite (local dev default) |
| API Tooling | OpenAPI + Orval-generated React Query client |
| Deployment | Docker Compose, Caddy (frontend + reverse proxy), Gunicorn |

## Architecture (High-Level)

- `frontend` (Vite build served by Caddy) calls `/api/*`.
- `caddy` reverse-proxies API/admin/static requests to `backend`.
- `backend` (Django + Gunicorn) serves REST endpoints and admin.
- `db` (Postgres) stores recipes, plan entries, pantry state, and generated list inputs.

## Project Structure

```text
mealmode/
├── compose.yml
├── docker/
│   ├── dockerfile.backend
│   ├── dockerfile.frontend
│   └── Caddyfile
├── src/
│   ├── backend/
│   └── frontend/
├── pyproject.toml
└── README.md
```

## Local Development Setup (Without Docker)

### Prerequisites

- Python 3.13+
- [uv](https://docs.astral.sh/uv/) (recommended) or pip
- Node.js 18+ and npm

### Backend

```bash
uv sync
uv run python src/backend/manage.py migrate
uv run python src/backend/manage.py runserver
```

Backend runs at `http://localhost:8000`.

### Frontend

```bash
cd src/frontend
npm install
npm run dev
```

Frontend runs at `http://localhost:5173`.

### Regenerate API Client (after backend schema changes)

```bash
cd src/frontend
npm run gen-api
```

## Docker Setup (Reproducible with One Command)

### Prerequisites

- Docker Desktop (or Docker Engine + Compose v2)

### 1) Configure environment

```bash
cp .env.example .env
```

Optional: edit `.env` values (at minimum, change passwords outside hackathon/demo use).

### 2) Build and run everything

```bash
docker compose up --build
```

That single command will:
- Build backend and frontend images.
- Start Postgres.
- Wait for DB health.
- Run Django migrations automatically on backend startup.
- Serve the web app through Caddy.

### 3) Access the app

- App: `http://localhost:8080` by default (or your `APP_HTTP_PORT` value)
- Django admin (proxied): `http://localhost:8080/admin` by default
- API (proxied): `http://localhost:8080/api` by default

### Useful Docker commands

```bash
# Start in detached mode
docker compose up --build -d

# Stop services
docker compose down

# Stop services and remove volumes (resets DB)
docker compose down -v

# Follow logs
docker compose logs -f

# Create admin user
docker compose exec backend uv run python manage.py createsuperuser
```

### Environment variables used by Docker

| Variable | Purpose | Default |
|---|---|---|
| `APP_HTTP_PORT` | Host port mapped to Caddy HTTP | `8080` |
| `APP_HTTPS_PORT` | Host port mapped to Caddy HTTPS | `8443` |
| `POSTGRES_DB` | Postgres database name | `mealmode` |
| `POSTGRES_USER` | Postgres username | `mealmode` |
| `POSTGRES_PASSWORD` | Postgres password | `change-me` |
| `USE_POSTGRES` | Enables Postgres settings in Django | `true` |
| `DB_HOST` | Django DB host | `db` |
| `DB_PORT` | Django DB port | `5432` |
| `DB_NAME` | Django DB name | `mealmode` |
| `DB_USER` | Django DB user | `mealmode` |
| `DB_PASSWORD` | Django DB password | `change-me` |
| `GUNICORN_WORKERS` | Gunicorn worker count | `4` |

## Hackathon Demo Flow (Suggested)

1. Open app and show empty/initial state.
2. Add or import 2-3 recipes with different base servings.
3. Build a weekly plan across multiple meal slots.
4. Change servings per slot (example: dinner from 2 to 5 servings).
5. Add pantry inventory for a few shared ingredients.
6. Generate shopping list and highlight:
   - scaled ingredient totals,
   - cross-recipe consolidation,
   - pantry subtraction.
7. Apply filters (tag/calories/cost) and show how plans update quickly.
8. End on final shopping list as the practical output.

## Why This Matters

MealMode reduces planning friction and grocery waste by keeping recipe scaling, pantry inventory, and shopping output in sync.
