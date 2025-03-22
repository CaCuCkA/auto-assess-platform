from abc import ABC

from ..models import Homework
from .base import BaseRepo


class HomeworkRepo(BaseRepo, ABC):
    def __init__(self, session):
        super().__init__(class_type=Homework, session=session)
        