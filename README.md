# Workout Tracker

Log workouts and track progress over time.

| Folder | What |
|---|---|
| `backend/` | FastAPI + SQLAlchemy + Alembic, PostgreSQL |
| `frontend/` | React + TypeScript + Vite + Tailwind ([README](frontend/README.md)) |

## Docker

Each app has its own image. `docker-compose.yml` runs the full stack from
**prebuilt images** (it has no `build:` sections), so build and push first.

| Image | Built from | Serves |
|---|---|---|
| `workout-tracker-backend` | `backend/Dockerfile` | API on `:8000`; also runs migrations (`alembic upgrade head`) |
| `workout-tracker-frontend` | `frontend/Dockerfile` | App on `:8080` via nginx, proxying `/api/*` to `BACKEND_URL` (default `http://backend:8000`) |

### Build and push

Replace the registry/user and tag with your own. These commands build for both
Intel/AMD and ARM servers (`docker buildx` ships with Docker Desktop):

```bash
docker login ghcr.io
docker buildx build --platform linux/amd64,linux/arm64 -t ghcr.io/rancidwhale/workout-tracker-backend:latest --push backend/
docker buildx build --platform linux/amd64,linux/arm64 -t ghcr.io/rancidwhale/workout-tracker-frontend:latest --push frontend/
```

For a local-only build, use `docker build -t <name> backend/` (and `frontend/`).

### Run

```bash
cp .env.example .env    # set SECRET_KEY (openssl rand -hex 32) and the image names
docker compose up -d
```

- App: http://localhost:8080
- API docs: http://localhost:8000/docs

Start-up order: `postgres` becomes healthy → `migrate` applies migrations and
exits → `backend` starts → `frontend` starts. Data lives in the
`postgres_data` volume. `docker compose down` keeps it; `down -v` deletes it.

To pick up new images: `docker compose pull && docker compose up -d`
(migrations run again automatically; already-applied ones are skipped).

### Local development

Run only Postgres in Docker and the apps on your machine:

```bash
docker compose up -d postgres                                  # needs .env with SECRET_KEY
cd backend && alembic upgrade head && uvicorn app.main:app --reload
cd frontend && npm install && npm run dev                      # http://localhost:5173
```
