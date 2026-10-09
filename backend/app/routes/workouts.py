"""
Workout routes. Every route is scoped to the authenticated user: another
user's workout is reported as 404, never 403, so IDs can't be probed.

POST   /workouts       - create a workout with nested exercises + sets
GET    /workouts       - paginated list, optional date range filter
GET    /workouts/{id}  - full nested workout
PUT    /workouts/{id}  - full replace (including exercises + sets)
DELETE /workouts/{id}  - delete (exercises + sets cascade)
"""
import uuid
from datetime import date
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from sqlalchemy.orm import Session, selectinload

from app.database import get_db
from app.dependencies import get_current_user
from app.models.excercise import Exercise
from app.models.user import User
from app.models.workout import Workout
from app.models.workout_excercise import WorkoutExercise
from app.models.workout_set import WorkoutSet
from app.routes.exercises import visible_to
from app.schemas.workout import (
    SetOut,
    WorkoutDetail,
    WorkoutExerciseIn,
    WorkoutExerciseOut,
    WorkoutIn,
    WorkoutPage,
    WorkoutSummary,
)

router = APIRouter()


# --- Helpers ------------------------------------------------------------------

def _get_owned_workout(db: Session, workout_id: uuid.UUID, user: User) -> Workout:
    workout = (
        db.query(Workout)
        .options(
            selectinload(Workout.workout_exercises).selectinload(WorkoutExercise.exercise),
            selectinload(Workout.workout_exercises).selectinload(WorkoutExercise.sets),
        )
        .filter(Workout.id == workout_id, Workout.user_id == user.id)
        .first()
    )
    if workout is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Workout not found")
    return workout


def _validate_exercise_ids(db: Session, exercises: List[WorkoutExerciseIn], user: User) -> None:
    requested = {e.exercise_id for e in exercises}
    if not requested:
        return
    found = {
        row.id
        for row in db.query(Exercise.id).filter(Exercise.id.in_(requested), visible_to(user))
    }
    missing = requested - found
    if missing:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Unknown exercise_id(s): {', '.join(sorted(str(m) for m in missing))}",
        )


def _build_children(exercises: List[WorkoutExerciseIn]) -> List[WorkoutExercise]:
    return [
        WorkoutExercise(
            exercise_id=item.exercise_id,
            order_index=i,
            sets=[
                WorkoutSet(set_number=n, weight=s.weight, reps=s.reps, rpe=s.rpe)
                for n, s in enumerate(item.sets, start=1)
            ],
        )
        for i, item in enumerate(exercises)
    ]


def _to_detail(workout: Workout) -> WorkoutDetail:
    return WorkoutDetail(
        **WorkoutSummary.model_validate(workout).model_dump(),
        exercises=[
            WorkoutExerciseOut(
                id=we.id,
                exercise_id=we.exercise_id,
                exercise_name=we.exercise.name,
                order_index=we.order_index,
                sets=[SetOut.model_validate(s) for s in we.sets],
            )
            for we in workout.workout_exercises
        ],
    )


# --- Routes -------------------------------------------------------------------

@router.post("", response_model=WorkoutDetail, status_code=status.HTTP_201_CREATED)
def create_workout(
    payload: WorkoutIn,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _validate_exercise_ids(db, payload.exercises, current_user)

    # Workout, exercises and sets are flushed and committed together in one
    # transaction: either the whole nested workout is saved or none of it is.
    workout = Workout(
        user_id=current_user.id,
        name=payload.name,
        workout_date=payload.workout_date,
        notes=payload.notes,
        workout_exercises=_build_children(payload.exercises),
    )
    db.add(workout)
    db.commit()
    return _to_detail(_get_owned_workout(db, workout.id, current_user))


@router.get("", response_model=WorkoutPage)
def list_workouts(
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    start_date: Optional[date] = Query(default=None, description="Inclusive"),
    end_date: Optional[date] = Query(default=None, description="Inclusive"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if start_date and end_date and start_date > end_date:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="start_date must be on or before end_date",
        )

    query = db.query(Workout).filter(Workout.user_id == current_user.id)
    if start_date:
        query = query.filter(Workout.workout_date >= start_date)
    if end_date:
        query = query.filter(Workout.workout_date <= end_date)

    total = query.count()
    items = (
        query.order_by(Workout.workout_date.desc(), Workout.created_at.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )
    return WorkoutPage(items=items, total=total, page=page, page_size=page_size)


@router.get("/{workout_id}", response_model=WorkoutDetail)
def get_workout(
    workout_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return _to_detail(_get_owned_workout(db, workout_id, current_user))


@router.put("/{workout_id}", response_model=WorkoutDetail)
def update_workout(
    workout_id: uuid.UUID,
    payload: WorkoutIn,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    workout = _get_owned_workout(db, workout_id, current_user)
    _validate_exercise_ids(db, payload.exercises, current_user)

    workout.name = payload.name
    workout.workout_date = payload.workout_date
    workout.notes = payload.notes
    # delete-orphan cascade removes the old exercises (and their sets).
    workout.workout_exercises = _build_children(payload.exercises)
    db.commit()

    db.expire_all()
    return _to_detail(_get_owned_workout(db, workout_id, current_user))


@router.delete("/{workout_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_workout(
    workout_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    workout = _get_owned_workout(db, workout_id, current_user)
    db.delete(workout)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)
