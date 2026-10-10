"""
Exercise model — LLD Section 1: `exercises` table (exercise library).
"""
import uuid
from typing import TYPE_CHECKING, List, Optional

from sqlalchemy import Index, UniqueConstraint, String, Boolean, ForeignKey, text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID

from app.models.base import UUIDPKMixin, TimestampMixin, Base


if TYPE_CHECKING:
    from app.models.user import User
    from app.models.workout_excercise import WorkoutExercise
class Exercise(UUIDPKMixin, TimestampMixin, Base):
    __tablename__= 'exercises'
    __table_args__=(
        UniqueConstraint("name", "created_by", name="uq_exercise_name_created_by"),
        # One built-in exercise per name, case-insensitive (NULL created_by
        # rows never conflict under the constraint above).
        Index(
            "uq_exercises_builtin_name",
            text("lower(name)"),
            unique=True,
            postgresql_where=text("created_by IS NULL"),
        ),
    )

    name: Mapped[str] = mapped_column(String(150), nullable=False)
    muscle_group: Mapped[str] = mapped_column(String(50), nullable=False)
    equipment: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    is_custom: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)

    created_by: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
    )

    # Relationships
    created_by_user: Mapped[Optional["User"]] = relationship(
        back_populates="custom_exercises"
    )
    workout_exercises: Mapped[List["WorkoutExercise"]] = relationship(
        back_populates="exercise"
    )

    def __repr__(self) -> str:
        return f"<Exercise id={self.id} name={self.name!r}>"