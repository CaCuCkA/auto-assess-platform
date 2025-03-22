from dataclasses import dataclass
from sqlalchemy.ext.asyncio import AsyncSession

from .admin import AdminRepo
from .homework import HomeworkRepo
from .homework_participant import HomeworkParticipantRepo
from .test import TestRepo
from .report import ReportRepo

@dataclass
class DatabaseGateway:
    """
    Provides access to all database repositories for a given async session.
    Acts as a centralized entry point to the data layer.
    """

    session: AsyncSession

    @property
    def admin(self) -> AdminRepo:
        return AdminRepo(self.session)

    @property
    def homework(self) -> HomeworkRepo:
        return HomeworkRepo(self.session)

    @property
    def homework_participant(self) -> HomeworkParticipantRepo:
        return HomeworkParticipantRepo(self.session)

    @property
    def test(self) -> TestRepo:
        return TestRepo(self.session)

    @property
    def report(self) -> ReportRepo:
        return ReportRepo(self.session)
