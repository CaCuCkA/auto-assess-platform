from github import Github, GithubException

from config import PullRequestPayload
from utils import get_logger

logger = get_logger(__name__)

class PullRequestHandler:
    def __init__(self, token, payload: PullRequestPayload):
        self.__gh_client = Github(token)
        self.__payload = payload
    
    def add_review_comments(self, comment_body):
        try:
            repo = self.__gh_client.get_repo(f"{self.__payload.repository_owner}/{self.__payload.repository_name}")
            pr = repo.get_pull(self.__payload.pr_number)
            pr.create_review(body=comment_body, event="COMMENT")
        except GithubException as e:
            logger.error(f"Failed to add review comments: {e}")
            raise
    
    def comment_and_close_pr(self, final_comment):
        try:
            repo = self.__gh_client.get_repo(f"{self.__payload.repository_owner}/{self.__payload.repository_name}")
            pr = repo.get_pull(self.__payload.pr_number)
            pr.create_review(body=final_comment, event="COMMENT")
            pr.edit(state="closed")
        except GithubException as e:
            logger.error(f"Failed to comment and close PR: {e}")
            raise
