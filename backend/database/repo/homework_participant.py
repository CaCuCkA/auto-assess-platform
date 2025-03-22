from abc import ABC

from ..models import HomeworkParticipant
from .base import BaseRepo


class HomeworkParticipantRepo(BaseRepo, ABC):
    def __init__(self, session):
        super().__init__(class_type=HomeworkParticipant, session=session)
        