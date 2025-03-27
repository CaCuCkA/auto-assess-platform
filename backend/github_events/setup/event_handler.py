from quart import Request

from utils import get_logger
from config import Config, PullRequestPayload
from jenkins import Jobs
from database import DatabaseGateway, HomeworkParticipant

from .request_parser import RequestParser


logger = get_logger(__name__)


class EventHandler:
    def __init__(self, db_gateway: DatabaseGateway, config: Config):
        self.__db_gateway = db_gateway
        self.__config = config

    async def __get_participant(self, url: str):
        logger.info(f"Get praticipant by url: {url}")
        participant = await self.__db_gateway.homework_participant.get_single(repo_url=url)
        return participant
    
    async def __get_homework(self, homework_id: int) -> str:
        logger.info(f"Get homework by id: {homework_id}")
        homework = await self.__db_gateway.homework.get_single(homework_id=homework_id)
        return homework

    async def webhook_event(self, request):
        repo_url = await RequestParser.get_repo_url(request)
        if not repo_url:
            logger.error("Failed to get github repo url")
            return {"result": "Failed to get github repo url"}, 500
        logger.info(repo_url)
        participant = await self.__get_participant(url=repo_url)
        if not participant:
            logger.error("Failed to get github token")
            return {"result": "Failed to get github token"}, 500
        
        parser = await RequestParser.create(request, participant.ssh_key)
        payload: PullRequestPayload = parser.get_payload()
        if not payload:
            logger.error("Failed to parse request and get payload")
            return {"result": "Failed to get github token"}, 500

        logger.warning(payload)
        
        homework = await self.__get_homework(homework_id=participant.homework_id)
        if not homework:
            logger.error("Failed to find user homework")
            return {"result": "Failed to find user homework"}, 500
        
        jobs = Jobs(url=self.__config.jenkins.url,
                    user=self.__config.jenkins.user,
                    token=self.__config.jenkins.token)

        result, code = await jobs.trigger(homework.title)

        if code != 200: 
            logger.error(f"Failed to trigger jenkins job: {homework.title}")
            return result, code

        clauses = (HomeworkParticipant.homework_id == participant.homework_id, 
                   HomeworkParticipant.participant_id == participant.participant_id)
        fields = {"pr_payload": payload.to_json()}

        result = await self.__db_gateway.homework_participant.update(*clauses, **fields)
        
        if not result:
            logger.info("Failed to update homework participant record")
            return {"result": "Failed to update participant record in DB"}, 500

        return {"result": "Homework was added to queue"}, 200
    
    async def jenkins_success():
        pass