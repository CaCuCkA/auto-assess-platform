import json
from typing import Tuple

from .base import Base
from aiohttp import ClientSession, BasicAuth, ClientError


class Credentials(Base):
    def __init__(self, url, user, token):
        super().__init__(url, user, token)

    def __build_url(self, id: str = None):
        base = f"{self._url}/credentials/store/system/domain/_"
        return (
            f"{base}/createCredentials"
            if id is None
            else f"{base}/credential/{id}/doDelete"
        )

    @staticmethod
    def __build_payload(id: str, secret: str) -> dict:
        return {
            "": "0",
            "credentials": {
                "scope": "GLOBAL",
                "id": id,
                "username": "Jenkins",
                "password": secret,
                "description": "GitHub PAT for Jenkins",
                "$class": "com.cloudbees.plugins.credentials.impl.UsernamePasswordCredentialsImpl"
            }
        }


    async def create(self, id: str, secret: str) -> Tuple[str, int]:
        url = self.__build_url()
        data = {"json": json.dumps(self.__build_payload(id, secret))}
        headers = {"Content-Type": "application/x-www-form-urlencoded"}

        try:
            async with ClientSession() as session:
                async with session.post(
                    url,
                    auth=BasicAuth(self._user, self._token),
                    headers=headers,
                    data=data,
                ) as response:
                    if response.status != 200:
                        text = await response.text()
                        return f"Failed to create credential. Status: {response.status}, Response: {text}", response.status
                    return "Credential created successfully.", 200

        except ClientError as e:
            return f"HTTP error while creating credential: {e}", 502

        except Exception as e:
            return f"Unexpected error during credential creation: {e}", 500
        

    async def delete(self, id: str) -> Tuple[dict, int]:
        url = self.__build_url(id=id)

        try:
            async with ClientSession() as session:
                async with session.post(
                    url=url,
                    auth=BasicAuth(self._user, self._token)
                ) as response:
                    if response.status != 200:
                        text = await response.text()
                        return f"Failed to create credential. Status: {response.status}, Response: {text}", response.status
                    return "Credential deleted successfully.", 200
        except ClientError as e:
            return f"HTTP error while deleting credential: {e}", 502

        except Exception as e:
            return f"Unexpected error during credential delete: {e}", 500
        
    