from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy import Integer, String, Text, Boolean, ForeignKey, DateTime, JSON

from .base import Base, TimestampMixin, TableNameMixin

class HomeworkParticipant(Base, TimestampMixin, TableNameMixin):
    """
    HomeworkParticipant model represents a student's submission for a homework.
    """

    participant_id: Mapped[int] = mapped_column(Integer, primary_key=True)
    homework_id: Mapped[int] = mapped_column(ForeignKey("homeworks.homework_id", ondelete="CASCADE"), nullable=False)

    repo_url: Mapped[str] = mapped_column(Text, unique=True, nullable=False)
    full_name: Mapped[str] = mapped_column(String(255), nullable=False)
    ssh_key: Mapped[str] = mapped_column(Text, unique=True, nullable=False)

    last_build_time: Mapped[DateTime] = mapped_column(DateTime(timezone=True), nullable=True)
    build_success: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    pr_payload: Mapped[JSON] = mapped_column(JSON)
