from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy import Integer, Text

from .base import Base, TimestampMixin, TableNameMixin


class Admin(Base, TimestampMixin, TableNameMixin):
    """
    Admin model representing a teacher instance. A person who has access for web application
    """
    
    admin_id: Mapped[int] = mapped_column(Integer, primary_key=True)
    full_name: Mapped[str] = mapped_column(Text, nullable=False)
    email: Mapped[str] = mapped_column(Text, unique=True, nullable=False)
    hashed_password: Mapped[str] = mapped_column(Text, nullable=False)
