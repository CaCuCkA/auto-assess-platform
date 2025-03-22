from abc import ABC

from ..models import Test
from .base import BaseRepo


class TestRepo(BaseRepo, ABC):
    def __init__(self, session):
        super().__init__(class_type=Test, session=session)
        