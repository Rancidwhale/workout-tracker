"""
Exercise library routes.

GET  /exercises  - built-in exercises plus the caller's custom ones
POST /exercises  - create a custom exercise for the caller
"""
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, or_
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user
from app.models.excercise import Exercise
from app.models.user import User
from app.schemas.exercise import ExerciseCreate, ExerciseOut

router = APIRouter()


def visible_to(user: User):
    """Filter for exercises a user may see and use: built-ins + their own."""
    return or_(Exercise.created_by.is_(None), Exercise.created_by == user.id)


@router.get("", response_model=List[ExerciseOut])
def list_exercises(
    muscle_group: Optional[str] = None,
    q: Optional[str] = Query(default=None, description="Case-insensitive name search"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(Exercise).filter(visible_to(current_user))
    if muscle_group:
        query = query.filter(func.lower(Exercise.muscle_group) == muscle_group.lower())
    if q:
        query = query.filter(Exercise.name.ilike(f"%{q}%"))
    return query.order_by(Exercise.name).all()


@router.post("", response_model=ExerciseOut, status_code=status.HTTP_201_CREATED)
def create_exercise(
    payload: ExerciseCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    duplicate = (
        db.query(Exercise)
        .filter(visible_to(current_user), func.lower(Exercise.name) == payload.name.lower())
        .first()
    )
    if duplicate:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An exercise with this name already exists",
        )

    exercise = Exercise(
        name=payload.name,
        muscle_group=payload.muscle_group,
        equipment=payload.equipment,
        is_custom=True,
        created_by=current_user.id,
    )
    db.add(exercise)
    db.commit()
    db.refresh(exercise)
    return exercise
