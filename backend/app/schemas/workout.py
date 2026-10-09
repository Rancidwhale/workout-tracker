"""
Pydantic schemas for workouts.

A workout is written as one nested document: exercises in the order they were
performed, each with its sets in order. `order_index` and `set_number` are
derived from list position, so clients never send them.
"""
import uuid
from datetime import date, datetime
from decimal import Decimal
from typing import List, Optional

from pydantic import BaseModel, ConfigDict, Field


# --- Input ------------------------------------------------------------------

class SetIn(BaseModel):
    # Bounds match the NUMERIC(6,2) / NUMERIC(3,1) columns.
    weight: Decimal = Field(ge=0, le=Decimal("9999.99"), decimal_places=2)
    reps: int = Field(ge=1, le=1000)
    rpe: Optional[Decimal] = Field(default=None, ge=1, le=10, decimal_places=1)


class WorkoutExerciseIn(BaseModel):
    exercise_id: uuid.UUID
    sets: List[SetIn] = Field(min_length=1)


class WorkoutIn(BaseModel):
    """Used for both create (POST) and full replace (PUT)."""
    name: str = Field(min_length=1, max_length=150)
    workout_date: date
    notes: Optional[str] = None
    exercises: List[WorkoutExerciseIn] = Field(default_factory=list)


# --- Output -----------------------------------------------------------------

class SetOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    set_number: int
    weight: Decimal
    reps: int
    rpe: Optional[Decimal]


class WorkoutExerciseOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    exercise_id: uuid.UUID
    exercise_name: str
    order_index: int
    sets: List[SetOut]


class WorkoutSummary(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    name: str
    workout_date: date
    notes: Optional[str]
    created_at: datetime


class WorkoutDetail(WorkoutSummary):
    exercises: List[WorkoutExerciseOut]


class WorkoutPage(BaseModel):
    items: List[WorkoutSummary]
    total: int
    page: int
    page_size: int
