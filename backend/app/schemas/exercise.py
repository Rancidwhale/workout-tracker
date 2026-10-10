"""
Pydantic schemas for the exercise library.
"""
import uuid
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field


class ExerciseCreate(BaseModel):
    name: str = Field(min_length=1, max_length=150)
    muscle_group: str = Field(min_length=1, max_length=50)
    equipment: Optional[str] = Field(default=None, max_length=50)


class ExerciseOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    name: str
    muscle_group: str
    equipment: Optional[str]
    is_custom: bool
