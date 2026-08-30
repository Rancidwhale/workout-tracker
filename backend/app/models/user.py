"""
User model — LLD Section 1: `users` table.
"""

from typing import TYPE_CHECKING, Optional, List

from sqlalchemy import String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, UUIDPKMixin, TimestampMixin

if TYPE_CHECKING:
    from app.models.excercise import Exercise
    from app.models.refresh_token import RefreshToken
    from app.models.workout import Workout

class User(UUIDPKMixin, TimestampMixin, Base):
    __tablename__='users'

    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, index=True)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    display_name: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)

    #relationships
    workouts: Mapped[List["Workout"]] = relationship(
        back_populates="user", cascade="all, delete-orphan" 
    )
    refresh_tokens: Mapped[List["RefreshToken"]] = relationship(
        back_populates="user", cascade="all, delete-orphan"
    )
    custom_exercises: Mapped[List["Exercise"]] = relationship(
        back_populates="created_by_user"
    )
    def __repr__(self) -> str:
        return f"<User id: {self.id} email: {self.email!r}>"