from abc import ABC

from ..models import Report
from .base import BaseRepo


class ReportRepo(BaseRepo, ABC):
    def __init__(self, session):
        super().__init__(class_type=Report, session=session)
        