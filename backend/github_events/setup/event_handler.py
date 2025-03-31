import aiohttp
from utils import get_logger
from quart import jsonify
from config import Config, PullRequestPayload
from database import DatabaseGateway, HomeworkParticipant

from .request_parser import RequestParser
from .pr_handler import PullRequestHandler


logger = get_logger(__name__)


class EventHandler:
    _instance = None

    def __new__(cls, db_gateway: DatabaseGateway, config: Config):
        if cls._instance is None:
            cls._instance = super(EventHandler, cls).__new__(cls)
            cls._instance.__db_gateway = db_gateway
            cls._instance.__config = config
        return cls._instance

    async def webhook_event(self, request):
        try:
            repo_url = await RequestParser.get_repo_url(request)
            participant = await self.__get_participant(repo_url=repo_url)
            parser = await RequestParser.create(request, participant.ssh_key)
            payload = parser.get_payload()
            homework = await self.__get_homework(homework_id=participant.homework_id)

            await self.__trigger_jenkins_job(participant, payload, homework)
            await self.__update_database(participant, payload)

            return {"result": "Homework was added to queue"}, 200
        except Exception as e:
            logger.error(f"Error handling webhook event: {str(e)}")
            return {"result": str(e)}, 500

    async def __trigger_jenkins_job(self, participant, payload, homework):
        async with aiohttp.ClientSession() as session:
            url = f"http://localhost:{self.__config.backend.port}/jenkins/trigger-job?id={participant.homework_id}&participant_id={participant.participant_id}"
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

    async def failed_event(self, request):
        try:
            participant_id = int(request.args.get("id", 0))
            homework_id = int(request.args.get("homework_id", 0))

            if not participant_id or not homework_id:
                raise ValueError({"error": "Missing participant_id or homework_id"})
            
            data = await request.get_json()
            pr_comment = data.get("message", "")
            logger.info(pr_comment)
            return {"result": "success"}, 200
            participant = await self.__get_participant(participant_id=participant_id, homework_id=homework_id)
            if not participant:
                logger.error(f"Participant not found for ID {participant_id} and homework {homework_id}")
                return jsonify({"error": "Participant not found"}), 404

            
            pr_handler = PullRequestHandler(token=participant.ssh_key, payload=participant.pr_payload)
            pr_handler.comment_and_close_pr(final_comment=pr_comment)

        except Exception as e:
            logger.error(f"Error handling failed event: {str(e)}")
            return {"result": str(e)}, 500
        
    async def __get_participant(self, **filter):
        participant = await self.__db_gateway.homework_participant.get_single(**filter)
        if not participant:
            logger.error(f"Participant not found for filter: {filter}")
            raise ValueError(f"Participant not found for filter: {filter}")
        return participant

    async def __get_homework(self, **filter):
        homework = await self.__db_gateway.homework.get_single(**filter)
        if not homework:
            logger.error(f"Homework not found for filter: {filter}")
            raise ValueError(f"Homework not found for filter: {filter}")
        return homework
    