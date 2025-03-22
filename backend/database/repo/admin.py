from abc import ABC

from ..models import Admin
from .base import BaseRepo


class AdminRepo(BaseRepo, ABC):
    def __init__(self, session):
        super().__init__(class_type=Admin, session=session)
        