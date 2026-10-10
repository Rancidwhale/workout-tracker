# Workout Tracker – Frontend

React 19 + TypeScript + Vite, styled with Tailwind CSS v4. Server state is
handled by TanStack Query, routing by React Router, charts by Recharts.

## Running locally

The backend must be running on `http://localhost:8000` (see `../backend`).

```bash
npm install
npm run dev
```

Open http://localhost:5173. The dev server proxies `/api/*` to the backend, so
there's no CORS setup to do. To point the proxy elsewhere:

```bash
VITE_PROXY_TARGET=http://localhost:8001 npm run dev
```

For a production build served from a different origin than the API, set
`VITE_API_URL` (see `.env.example`) and run `npm run build`.

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Dev server with hot reload |
| `npm run build` | Type-check and build to `dist/` |
| `npm run lint` | Lint with oxlint |
| `npm run preview` | Serve the production build |

## Structure

```
src/
  api/          client.ts (fetch wrapper + token refresh), types.ts (API schemas)
  hooks/        useAuth, useWorkouts, useExercises, useProgress (React Query)
  components/   AuthForms, ProtectedRoute, Layout, WorkoutForm,
                VolumeChart, PRList, StreakCard, ui primitives
  pages/        Dashboard, Workouts list, Workout detail, New/Edit workout
  lib/          date and number formatting
```

## Auth

Tokens are kept in `localStorage`. On a 401 the client exchanges the refresh
token for a new pair and retries once. The backend rotates refresh tokens and
revokes every session if an old one is reused, so concurrent 401s share a
single refresh request. If the refresh fails, the user is sent to `/login` and
returned to the page they were on after logging in.

Weights are shown in kg (`WEIGHT_UNIT` in `src/lib/format.ts`); the backend
stores plain numbers.
