from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy import Integer, String, Text, Boolean, ForeignKey

from .base import Base, TimestampMixin, TableNameMixin


class Test(Base, TimestampMixin, TableNameMixin):
    """
    Test model representing a single test case for a homework.
    """

    test_id: Mapped[int] = mapped_column(Integer, primary_key=True)
    homework_id: Mapped[int] = mapped_column(ForeignKey("homeworks.homework_id", ondelete="CASCADE"), nullable=False)

    name: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)
    file_content: Mapped[str] = mapped_column(Text, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
