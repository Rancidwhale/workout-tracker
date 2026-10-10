import uuid

from datetime import date
from typing import TYPE_CHECKING, List, Optional

from sqlalchemy import String, Date, Text, ForeignKey, Index
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID

from app.models.base import UUIDPKMixin, TimestampMixin, Base



if TYPE_CHECKING:
    from app.models.user import User
    from app.models.workout_excercise import WorkoutExercise

class Workout(UUIDPKMixin, TimestampMixin, Base):
    __tablename__ = "workouts"
    __table_args__ = (
        # Matches LLD: idx_workouts_user_date ON workouts(user_id, workout_date)
        Index("idx_workouts_user_date", "user_id", "workout_date"),
    )

    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
    )
    name: Mapped[str] = mapped_column(String(150), nullable=False)
    workout_date: Mapped[date] = mapped_column(Date, nullable=False)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # Relationships
    user: Mapped["User"] = relationship(back_populates="workouts")
    workout_exercises: Mapped[List["WorkoutExercise"]] = relationship(
        back_populates="workout",
        cascade="all, delete-orphan",
        order_by="WorkoutExercise.order_index",
    )

    def __repr__(self) -> str:
        return f"<Workout id={self.id} name={self.name!r} date={self.workout_date}>"
 