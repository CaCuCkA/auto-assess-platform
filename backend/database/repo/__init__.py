from .base import BaseRepo 
from .test import TestRepo as Test
from .admin import AdminRepo as Admin
from .report import ReportRepo as Report
from .homework import HomeworkRepo as Homework
from .homework_participant import HomeworkParticipantRepo as HomeworkParticipant
from .gateway import DatabaseGateway

__all__ = [
    "Test",
    "Admin",
    "Report",
    "Homework",
    "HomeworkParticipant",
    "DatabaseGateway",
]