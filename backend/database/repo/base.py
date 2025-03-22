import csv
from abc import ABC, abstractmethod
from typing import List, Any, Type

from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession


class BaseRepo(ABC):
    def __init__(self, class_type: Type[Any], session: AsyncSession):
        self.class_type = class_type
        self.session = session

    async def get_single(self, **params) -> Any:
        stmt = select(self.class_type).filter_by(**params)
        result = await self.session.scalars(stmt)
        return result.first()

    async def get_all(self, **params) -> List[Any]:
        stmt = select(self.class_type).filter_by(**params)
        result = await self.session.scalars(stmt)
        return result.all()

    async def update(self, *clauses, **values) -> None:
        stmt = (
            update(self.class_type)
            .where(*clauses)
            .values(**values)
        )

        await self.session.execute(stmt)
        await self.session.commit()
