
from quart import Request
from github import Github
from typing import List

from utils import get_logger
from config import PullRequestPayload


logger = get_logger(__name__)

class RequestParser:
    def __init__(self, token, body, headers):
        self.__gh_client = Github(token)
        self.__body = body
        self.__headers = headers


    @staticmethod
    async def get_repo_url(request) -> str:
        body = await request.get_json()
        return body.get("pull_request", {}).get("head", {}).get("repo", {}).get("clone_url")


    @classmethod
    async def create(cls, request, token):
        body = await request.get_json()
        headers = request.headers
        return cls(token, body, headers)
    

    def get_payload(self) -> PullRequestPayload:
        if not self.__is_pull_request_event():
            return None 
        
        pull_number = self.__extract_pull_number()
        repository_owner, repository_name = self.__extract_repo_details()
        commit_sha = self.__extract_commit_sha()
        pull_request = self.__extract_pull_request(repository_owner, repository_name, pull_number)
        url = self.__extract_url()

        return PullRequestPayload(
            repository_name=repository_name,
            repository_owner=repository_owner,
            pr_number=pull_number,
            commit_sha=commit_sha,
            pr_title=pull_request.title,
            pr_description=pull_request.body,
            url=url
        )

        
    def __is_pull_request_event(self) -> bool:
        return self.__headers.get("X-Github-Event") == "pull_request"
    

    def __extract_pull_number(self) -> int:
        return self.__body.get("issue", self.__body).get("number")
    

    def __extract_repo_details(self) -> List[str]:
        repo_name = self.__body.get("repository", {}).get("full_name", "")
        return repo_name.split("/")
    

    def __extract_commit_sha(self) -> str:
        return self.__body.get("pull_request", {}).get("head", {}).get("sha")
    

    def __extract_pull_request(self, owner, repo, pull_number):
        return self.__gh_client.get_repo(f"{owner}/{repo}").get_pull(pull_number)
    

    def __extract_url(self) -> str:
        return self.__body.get("pull_request", {}).get("head", {}).get("repo", {}).get("clone_url")
    