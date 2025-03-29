import aiohttp
from utils import get_logger
from config import Config
from database import DatabaseGateway, HomeworkParticipant

from .request_parser import RequestParser

logger = get_logger(__name__)

class EventHandler:
    def __init__(self, db_gateway: DatabaseGateway, config: Config):
        self.__db_gateway = db_gateway
        self.__config = config

    async def __get_participant(self, repo_url: str):
        participant = await self.__db_gateway.homework_participant.get_single(repo_url=repo_url)
        if not participant:
            logger.error("Participant not found with URL: {}".format(repo_url))
            raise ValueError("Participant not found")
        return participant
    
    async def __get_homework(self, homework_id: int):
        homework = await self.__db_gateway.homework.get_single(homework_id=homework_id)
        if not homework:
            logger.error("Homework not found with ID: {}".format(homework_id))
            raise ValueError("Homework not found")
        return homework

    async def webhook_event(self, request):
        try:
            repo_url = await RequestParser.get_repo_url(request)
            participant = await self.__get_participant(repo_url)
            parser = await RequestParser.create(request, participant.ssh_key)
            payload = parser.get_payload()
            homework = await self.__get_homework(participant.homework_id)

            await self.__trigger_jenkins_job(participant, payload, homework)
            await self.__update_database(participant, payload)

            return {"result": "Homework was added to queue"}, 200
        except Exception as e:
            logger.error(f"Error handling webhook event: {str(e)}")
            return {"result": str(e)}, 500

    async def __trigger_jenkins_job(self, participant, payload, homework):
        async with aiohttp.ClientSession() as session:
            url = f"http://localhost:5000/jenkins/trigger-job?id={participant.homework_id}&participant_id={participant.participant_id}"
            body = {
                "full_name": participant.full_name,
                "url": participant.repo_url,
                "commit_sha": payload.commit_sha,
                "homework_title": homework.title,
            }
            response = await session.post(url, json=body)
            if response.status != 200:
                text = await response.text()
                logger.error(f"Failed to trigger job: {text}")
                raise RuntimeError(f"Failed to trigger Jenkins job, status: {response.status}")

    async def __update_database(self, participant, payload):
        clauses = (HomeworkParticipant.homework_id == participant.homework_id, 
                   HomeworkParticipant.participant_id == participant.participant_id)
        fields = {"pr_payload": payload.to_json()}
        result = await self.__db_gateway.homework_participant.update(*clauses, **fields)
        if not result:
            raise RuntimeError("Failed to update participant record in database")
