"""
Pydantic schemas for the exercise library.
"""
import uuid
from enum import Enum
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field


class MuscleGroup(str, Enum):
    """Primary muscle group an exercise is filed under."""
    CHEST = "chest"
    BACK = "back"
    TRAPS = "traps"
    SHOULDERS = "shoulders"
    BICEPS = "biceps"
    TRICEPS = "triceps"
    FOREARMS = "forearms"
    QUADS = "quads"
    HAMSTRINGS = "hamstrings"
    GLUTES = "glutes"
    ADDUCTORS = "adductors"
    CALVES = "calves"
    CORE = "core"
    FULL_BODY = "full_body"


class ExerciseCreate(BaseModel):
    name: str = Field(min_length=1, max_length=150)
    muscle_group: MuscleGroup
    equipment: Optional[str] = Field(default=None, max_length=50)


class ExerciseOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    name: str
    muscle_group: str
    equipment: Optional[str]
    is_custom: bool
