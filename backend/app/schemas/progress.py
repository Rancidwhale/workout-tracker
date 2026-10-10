"""
Pydantic schemas for progress / analytics endpoints.

Aggregates are returned as floats (not Decimal strings) so charts can plot
them directly; the summing itself happens on exact NUMERIC values in SQL.
"""
import uuid
from datetime import date
from typing import List, Optional

from pydantic import BaseModel


class VolumeWeek(BaseModel):
    week_start: date  # Monday of the ISO week
    total_volume: float  # sum(weight * reps)
    workout_count: int
    set_count: int


class VolumeTrend(BaseModel):
    start_date: date
    end_date: date
    exercise_id: Optional[uuid.UUID]
    weeks: List[VolumeWeek]


class PersonalRecord(BaseModel):
    exercise_id: uuid.UUID
    exercise_name: str
    weight: float
    reps: int
    estimated_1rm: float  # Epley: weight * (1 + reps / 30)
    workout_id: uuid.UUID
    workout_date: date


class Streaks(BaseModel):
    current_streak: int  # consecutive days, ending today or yesterday
    longest_streak: int
    total_workout_days: int
    last_workout_date: Optional[date]
