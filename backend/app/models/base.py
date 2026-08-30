import uuid
from datetime import datetime

from sqlalchemy import DateTime, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column


class Base(DeclarativeBase):
    pass

class UUIDPKMixin:
    """Adds a UUID primary key with a server-side default, 
    (`id UUID PRIMARY KEY DEFAULT uuid_generate_v4()`)."""

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        server_default=func.get_random_uuid(),
    )

class TimestampMixin:
    """Adds created_at / updated_at columns """

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now()
    )

    modified_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_defaut=func.now(),
        onupdate=func.now(),
    )