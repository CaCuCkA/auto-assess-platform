from abc import ABC
from typing import List, Any, Type

from sqlalchemy import select, update
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.ext.asyncio import AsyncSession

from utils import get_logger

logger = get_logger(__name__)


class BaseRepo(ABC):
    def __init__(self, class_type: Type[Any], session: AsyncSession):
        self.class_type = class_type
        self.session = session

    async def get_single(self, **params) -> Any:
        try:
            stmt = select(self.class_type).filter_by(**params)
            result = await self.session.scalars(stmt)
            return result.first()
        except SQLAlchemyError as e:
            logger.error(f"Failed to retrieve single record: {e}")
            return None


    async def get_all(self, **params) -> List[Any]:
        try:
            stmt = select(self.class_type).filter_by(**params)
            result = await self.session.scalars(stmt)
            return result.all()
        except SQLAlchemyError as e:
            logger.error(f"Failed to retrieve all records: {e}")
            return None


    async def update(self, *clauses, **values) -> None:
        try:
            stmt = (
                update(self.class_type)
                .where(*clauses)
                .values(**values)
            )
            result = await self.session.execute(stmt)
            await self.session.commit()
            return result.rowcount
        except SQLAlchemyError as e:
            await self.session.rollback()
            logger.error(f"Failed to update: {e}")
            return None 
