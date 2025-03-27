import hashlib

import aiofiles
import aiojenkins
from typing import Tuple
from jinja2 import Template

from .base import Base
from utils import get_logger

logger = get_logger(__name__)

class Jobs(Base):
    __SCRIPT_PATH = "jenkins/groovy/CreateJob.groovy"

    def __init__(self, url, user, token):
        super().__init__(url, user, token)

    @staticmethod
    def __safe_job_name(name: str) -> str:
        title_hash = hashlib.sha256(name.encode()).hexdigest()[:12]
        return f"job-{title_hash}"
    
    async def __load_template_and_render(self, name: str) -> str:
        async with aiofiles.open(self.__SCRIPT_PATH, mode="r") as f:
            content = await f.read()

        template = Template(content)
        return template.render(job_name=Jobs.__safe_job_name(name))
    
    async def create(self, name: str):
        script = await self.__load_template_and_render(name)

        try:
            async with aiojenkins.Jenkins(host=self._url, user=self._user, password=self._token) as jenkins:
                result = await jenkins.run_groovy_script(script)
                logger.info(f"Job creation result: {result}")
                return "Job created successfully", 200
        except aiojenkins.JenkinsError as e:
            logger.error(f"Jenkins error while creating job: {e}")
            return f"Jenkins error while creating job: {e}", 502
        except Exception as e: 
            logger.error(f"Unexpected error during job creation: {e}")
            return f"Unexpected error during job creation: {e}", 500

    async def delete(self, name: str) -> Tuple[str, int]:
        try:
            hashed_name = Jobs.__safe_job_name(name)
            async with aiojenkins.Jenkins(host=self._url, user=self._user, password=self._token) as jenkins:
                await jenkins.jobs.delete(hashed_name)
                return "Job deleted successfully", 200
        except aiojenkins.JenkinsError as e:
            logger.error(f"Jenkins error while deleting job: {e}")
            return f"Jenkins error while deleting job: {e}", 502
        except Exception as e: 
            logger.error(f"Unexpected error during job deletion: {e}")
            return f"Unexpected error during job deletion: {e}", 500
            

    async def update(self, old_name: str, new_name: str) -> Tuple[str, int]:
        try:
            old_hashed_name = Jobs.__safe_job_name(old_name)
            new_hashed_name = Jobs.__safe_job_name(new_name)
            async with aiojenkins.Jenkins(host=self._url, user=self._user, password=self._token) as jenkins:
                await jenkins.jobs.rename(old_hashed_name, new_hashed_name)
                return "Job renamed successfully", 200
        except aiojenkins.JenkinsError as e:
            logger.error(f"Jenkins error while renaming job: {e}")
            return f"Jenkins error while renaming job: {e}", 502
        except Exception as e: 
            logger.error(f"Unexpected error during job rename: {e}")
            return f"Unexpected error during job rename: {e}", 500
        
    async def trigger(self, name: str, **params)  -> Tuple[str, int]:
        try:
            hashed_name = Jobs.__safe_job_name(name)
            async with aiojenkins.Jenkins(host=self._url, user=self._user, password=self._token) as jenkins:
                await jenkins.builds.start(hashed_name, **params) 
                return "Job triggered successfully", 200
        except aiojenkins.JenkinsError as e:
            logger.error(f"Jenkins error while triggering job: {e}")
            return f"Jenkins error while triggering job: {e}", 502
        except Exception as e: 
            logger.error(f"Unexpected error during job trigger: {e}")
            return f"Unexpected error during job trigger: {e}", 500
            