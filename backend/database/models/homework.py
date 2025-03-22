from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy import String, Integer, ForeignKey
from .base import Base, TimestampMixin, TableNameMixin


class Homework(Base, TimestampMixin, TableNameMixin):
    """
    Homework Model representing a homework instance.
    """

    homework_id: Mapped[int] = mapped_column(Integer, primary_key=True)
    title: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)
    admin_id: Mapped[int] = mapped_column(ForeignKey("admins.admin_id", ondelete="CASCADE"), nullable=False)
    card_color: Mapped[str] = mapped_column(String(7), nullable=False)
