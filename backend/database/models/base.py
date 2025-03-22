import datetime
import re
from typing import Optional, cast, Type, Dict, Any, Pattern, Final

from sqlalchemy.dialects.postgresql import TIMESTAMP
from sqlalchemy.ext.declarative import declared_attr
from sqlalchemy.orm import DeclarativeBase, has_inherited_table
from sqlalchemy.orm import Mapped
from sqlalchemy.orm import mapped_column
from sqlalchemy.sql.functions import func
from typing_extensions import Annotated

int_pk = Annotated[int, mapped_column(primary_key=True)]

# Regex for parsing class` name
TABLE_NAME_REGEX: Pattern[str] = re.compile(r"(?<=[A-Z])(?=[A-Z][a-z])|(?<=[^A-Z])(?=[A-Z])")
PLURAL: Final[str] = "s"


class Base(DeclarativeBase):
    pass


class TableNameMixin:
    @declared_attr.directive
    def __tablename__(self) -> Optional[str]:
        if has_inherited_table(cast(Type[Base], self)):
            return None
        cls_name = cast(Type[Base], self).__qualname__
        table_name_parts = re.split(TABLE_NAME_REGEX, cls_name)
        formatted_table_name = "".join(
            table_name_part.lower() + "_" for i, table_name_part in enumerate(table_name_parts)
        )
        last_underscore = formatted_table_name.rfind("_")
        return formatted_table_name[:last_underscore] + PLURAL

    def _get__attributes(self) -> Dict[Any, Any]:
        return {k: v for k, v in self.__dict__.items() if not k.startswith("_")}

    def __str__(self) -> str:
        attributes = " | ".join(f"{k} = {v}" for k, v in self._get__attributes().items())
        return f"{self.__class__.__qualname__}({attributes})"
    
    @property
    def to_dict(self):
        return {c.name: getattr(self, c.name) for c in self.__table__.columns}



class TimestampMixin:
    created_at: Mapped[datetime] = mapped_column(TIMESTAMP, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        TIMESTAMP, server_default=func.now(), onupdate=func.now()
    )