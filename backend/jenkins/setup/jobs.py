import hashlib

import aiohttp
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
        auth = aiohttp.BasicAuth(login=self._user, password=self._token)
        try:
            async with aiohttp.ClientSession() as session:
                url = f"{self._url}/scriptText"
                async with session.post(url, auth=auth, data={"script": script}) as response:
                    if response.status == 200:
                        if response.headers.get('Content-Encoding') == 'gzip':
                            result = await response.read()
                            logger.info(f"Job creation result: {result}")
                        return "Job created successfully", 200
                    else:
                        result = await response.text()
                        logger.error(f"Failed to execute script: {response.status} {result}")
                        return f"Failed to execute script: {result}", response.status
        except aiohttp.ClientError as e:
            logger.error(f"HTTP client error while creating job: {e}")
            return f"HTTP client error while creating job: {e}", 502
        except Exception as e:
            logger.error(f"Unexpected error during job creation: {e}")
            return f"Unexpected error during job creation: {e}", 500
        

    async def delete(self, name: str) -> Tuple[str, int]:
        try:
            hashed_name = Jobs.__safe_job_name(name)
            async with aiohttp.ClientSession() as session:
                async with session.delete(url=f"{self._url}/job/{hashed_name}", 
                                          auth=aiohttp.BasicAuth(self._user, self._token)) as response:
                    if response.status == 200 or response.status == 204:
                        logger.info("Job deleted successfully")
                        return "Job deleted successfully", 200
                    response_text = await response.text()
                    logger.error(f"Failed to delete job: {response.status} {response_text}")
                    return f"Failed to delete job: {response_text}", response.status
        except aiohttp.ClientError as e:
            logger.error(f"HTTP Client Error: {e}")
            return f"HTTP Client Error: {e}", 500
            

    async def update(self, old_name: str, new_name: str) -> Tuple[str, int]:
        old_hashed_name = self.__safe_job_name(old_name)
        new_hashed_name = self.__safe_job_name(new_name)
        endpoint = f"{self._url}/job/{old_hashed_name}/doRename?newName={new_hashed_name}"
        
        async with aiohttp.ClientSession() as session:
            try:
                async with session.post(endpoint, auth=aiohttp.BasicAuth(self._user, self._token)) as response:
                    if response.status == 302 or response.status == 200:
                        return "Job renamed successfully", 200
                    else:
                        response_text = await response.text()
                        logger.error(f"Failed to rename job: HTTP {response.status} - {response_text}")
                        return f"Failed to rename job: {response_text}", response.status
            except aiohttp.ClientError as e:
                logger.error(f"HTTP client error while renaming job: {e}")
                return f"HTTP client error while renaming job: {e}", 502
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
            