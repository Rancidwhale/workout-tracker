"""
WorkoutExercise model — LLD Section 1: `workout_exercises` join table.
Links a Workout to an Exercise, preserving the order it was performed.
"""
import uuid
from typing import TYPE_CHECKING, List

from sqlalchemy import ForeignKey, Index, Integer
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, UUIDPKMixin

if TYPE_CHECKING:
    from app.models.excercise import Exercise
    from app.models.workout_set import WorkoutSet
    from app.models.workout import Workout


class WorkoutExercise(UUIDPKMixin, Base):
    __tablename__ = "workout_exercises"
    __table_args__ = (
        # Matches LLD: idx_we_workout, idx_we_exercise
        Index("idx_we_workout", "workout_id"),
        Index("idx_we_exercise", "exercise_id"),
    )

    workout_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("workouts.id", ondelete="CASCADE"),
        nullable=False,
    )
    exercise_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("exercises.id"),
        nullable=False,
    )
    order_index: Mapped[int] = mapped_column(Integer, nullable=False, default=0)

    # Relationships
    workout: Mapped["Workout"] = relationship(back_populates="workout_exercises")
    exercise: Mapped["Exercise"] = relationship(back_populates="workout_exercises")
    sets: Mapped[List["WorkoutSet"]] = relationship(
        back_populates="workout_exercise",
        cascade="all, delete-orphan",
        order_by="WorkoutSet.set_number",
    )

    def __repr__(self) -> str:
        return f"<WorkoutExercise id={self.id} workout_id={self.workout_id} exercise_id={self.exercise_id}>"