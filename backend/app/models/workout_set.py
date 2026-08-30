"""
WorkoutSet model — LLD Section 1: `sets` table.
"""
import uuid
from typing import TYPE_CHECKING, Optional

from sqlalchemy import ForeignKey, Index, Integer, Numeric
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin, UUIDPKMixin

if TYPE_CHECKING:
    from app.models.workout_excercise import WorkoutExercise


class WorkoutSet(UUIDPKMixin, TimestampMixin, Base):
    __tablename__ = "sets"
    __table_args__ = (
        # Matches LLD: idx_sets_workout_exercise ON sets(workout_exercise_id)
        Index("idx_sets_workout_exercise", "workout_exercise_id"),
    )

    workout_exercise_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("workout_exercises.id", ondelete="CASCADE"),
        nullable=False,
    )
    set_number: Mapped[int] = mapped_column(Integer, nullable=False)
    # NUMERIC, not FLOAT, to avoid rounding issues in progress calculations (LLD note).
    weight: Mapped[float] = mapped_column(Numeric(6, 2), nullable=False)
    reps: Mapped[int] = mapped_column(Integer, nullable=False)
    rpe: Mapped[Optional[float]] = mapped_column(Numeric(3, 1), nullable=True)

    # Relationships
    workout_exercise: Mapped["WorkoutExercise"] = relationship(back_populates="sets")

    def __repr__(self) -> str:
        return f"<WorkoutSet id={self.id} set_number={self.set_number} weight={self.weight} reps={self.reps}>"