from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routes import auth, exercises, progress, workouts

app = FastAPI(title="Workout traker API", version="0.1.0")


app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_headers=["*"],
    allow_methods=["*"],
                   )

@app.get("/health")
def get_health():
    return {'status':'ok'}


app.include_router(auth.router, prefix="/auth", tags=["auth"])
app.include_router(workouts.router, prefix="/workouts", tags=["workouts"])
app.include_router(exercises.router, prefix="/exercises", tags=["exercises"])
app.include_router(progress.router, prefix="/progress", tags=["progress"])
