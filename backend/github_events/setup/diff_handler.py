import fnmatch
from unidiff import PatchSet
from aiohttp import ClientSession
from typing import Dict, List, Any    


class DiffHandler:
    GITHUB_API_ACCEPT_HEADER = {'Accept': 'application/vnd.github.v3.diff'}
    BEARER_AUTH_PREFIX = 'Bearer {}'

    def __init__(self, token: str, excluded_file_patterns: List[str] = None):
        self.__token = token
        self.__excluded_patterns = excluded_file_patterns or ["*.md", "*.txt"]


    async def get_diff(self, owner: str, repo: str, pull_number: int) -> List[Dict[str, Any]]:
        diff = await self.__fetch_pr_diff(owner, repo, pull_number)
        if not diff:
            return None
        
        pasrsed_diff = self.__parse_git_diff(diff)
        filtered_diff = self.__filter_modified_files(pasrsed_diff)

        return filtered_diff       


    async def __fetch_pr_diff(self, owner: str, repo: str, pull_number: int) -> str:
        api_url = f"https://api.github.com/repos/{owner}/{repo}/pulls/{pull_number}.diff"
        headers = {**self.GITHUB_API_ACCEPT_HEADER, 'Authorization': self.BEARER_AUTH_PREFIX.format(self.__token)}

        async with ClientSession() as session:
            async with session.get(api_url, headers=headers) as response:
                if response.status == 200:
                    return await response.text()
                return ""
    
    
    def __parse_git_diff(self, diff_str: str) -> List[Dict[str, Any]]:
        patch_set = PatchSet(diff_str)
        return [{
            'path': file.path,
            'hunks': [{
                'header': f"@@ -{hunk.source_start},{hunk.source_length} + {hunk.target_start},{hunk.target_length} @@",
                'lines': [f"{line.line_type}{line.value}" for line in hunk]
            } for hunk in file]
        } for file in patch_set]


    def __filter_modified_files(self, files_diff: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        if not self.__excluded_patterns:
            return files_diff

        return [
            file for file in files_diff
            if all(not fnmatch.fnmatch(file.get('path', ''), pattern) for pattern in self.__excluded_patterns)
        ]
