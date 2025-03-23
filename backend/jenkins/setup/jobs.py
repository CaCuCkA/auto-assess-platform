import hashlib

import aiofiles
from jinja2 import Template
from aiohttp import ClientSession, BasicAuth, ClientError

from .base import Base
from utils import get_logger


logger = get_logger(__name__)
class Jobs(Base):
    __SCRIPT_PATH = "jenkins/groovy/CreateJob.groovy"

    def __init__(self, url, user, token):
        super().__init__(url, user, token)

    @staticmethod
    def __safe_job_name(job_name: str) -> str:
        title_hash = hashlib.sha256(job_name.encode()).hexdigest()[:12]
        return f"job-{title_hash}"
    
    async def __load_template_and_render(self, job_name: str) -> str:
        async with aiofiles.open(self.__SCRIPT_PATH, mode="r") as f:
            content = await f.read()

        template = Template(content)
        return template.render(job_name=Jobs.__safe_job_name(job_name))

    async def create(self, job_name: str):
        script = await self.__load_template_and_render(job_name)
        
        try:
            async with ClientSession(auth=BasicAuth(self._user, self._token)) as session:
                async with session.get(f"{self._url}/crumbIssuer/api/json") as crumb_resp:
                    if crumb_resp.status != 200:
                        text = await crumb_resp.text()
                        return crumb_resp.status, f"Failed to get crumb: {text}"
                    crumb_data = await crumb_resp.json()

                headers = {
                    crumb_data["crumbRequestField"]: crumb_data["crumb"]
                }

                async with session.post(
                    url=f"{self._url}/scriptText",
                    data={"script": script},
                    headers=headers
                ) as response:
                    text = await response.text()
                    return text, response.status
                
        except ClientError as e:
            return f"HTTP error while deleting credential: {e}", 502

        except Exception as e:
            return f"Unexpected error during credential delete: {e}", 500


    async def delete(self, job_name: str):
        hashed_name = Jobs.__safe_job_name(job_name)
        delete_url = f"{self._url}/job/{hashed_name}/doDelete"

        try:
            async with ClientSession(auth=BasicAuth(self._user, self._token)) as session:
                async with session.get(f"{self._url}/crumbIssuer/api/json") as crumb_resp:
                    if crumb_resp.status != 200:
                        text = await crumb_resp.text()
                        return crumb_resp.status, f"Failed to get crumb: {text}"

                    crumb_data = await crumb_resp.json()
                    headers = {
                        crumb_data["crumbRequestField"]: crumb_data["crumb"]
                    }

                    async with session.post(delete_url, headers=headers) as response:
                        text = await response.text()
                        if response.status == 200:
                            return 200, f"Job '{hashed_name}' deleted successfully."
                        else:
                            return response.status, f"Failed to delete job: {text}"

        except ClientError as e:
            return 502, f"HTTP error while deleting job: {e}"

        except Exception as e:
            return 500, f"Unexpected error during job deletion: {e}"

    # def update(self):
    #     pass

    # def is_exists(self):
    #     pass
    