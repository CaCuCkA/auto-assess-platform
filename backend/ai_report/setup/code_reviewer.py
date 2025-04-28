import re
from typing import Any, Dict, List, Tuple

from unidiff import Hunk
from unidiff.patch import Line

from .ai_manager import AIManager
from utils import get_logger
from config import PullRequestPayload
from .numbered_hunk import NumberedHunk

logger = get_logger(__name__)


class CodeReviewer:
    HUNK_HEADER_REGEX = re.compile(r'^@@ -(\d+)(?:,(\d+))? \+ ?(\d+)(?:,(\d+))? @@')
    
    def __init__(self, ai_manager: AIManager):
        self.__ai_manager = ai_manager

    
    async def analyze_code(self, parsed_diff: List[Dict[str, Any]], pr_details: PullRequestPayload) -> List[Dict[str, Any]]:
        comments = []
        for file_data in self.__get_valid_file(parsed_diff):
            file_path = file_data["path"]
            comments.extend(await self.__process_file_hunks(file_path, file_data, pr_details))
        
        logger.info(f"Comments {comments}")
        return comments
        
    
    def __get_valid_file(self, parsed_diff: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        return [file_data for file_data in parsed_diff if file_data.get("path") and file_data["path"] != "/dev/null"]
    

    async def __process_file_hunks(self, file_path, file_data: Dict[str, Any], pr_details: PullRequestPayload) -> List[Dict[str, Any]]:
        comments = []
        for hunk_data in file_data.get("hunks", []):
            hunk = self.__create_hunk(hunk_data.get("lines", []), *self.__get_source_target_start(hunk_data.get("header", "")))
            ai_response = await self.__get_ai_review(file_path, hunk, pr_details)
            comments.extend(self.__create_comments(file_path, hunk, ai_response))
        return comments
    
    
    def __get_source_target_start(self, hunk_headers: str) -> Tuple[int]:
        match = self.HUNK_HEADER_REGEX.match(hunk_headers)
        if match:
            return tuple(int(match.group(i)) if match.group(i) else 1 for i in range(1, 5))
        return 1, 1, 1, 1
    

    def __create_hunk(self, hunk_lines: List[str], source_start, target_start, source_length, target_length) -> Hunk:
        hunk = NumberedHunk(src_start=source_start, tgt_start=target_start, src_len=source_length, tgt_len=target_length)
        for line_str in hunk_lines:
            line_type = line_str[0]
            if line_type not in ('+', '-', ' '):
                line_type = ' '
            line = Line(value=line_str[1:], line_type=line_type)
            hunk.append(line)     

        return hunk 


    async def __get_ai_review(self, file_path: str, hunk: Hunk, pr_details: PullRequestPayload) -> List[Dict[str, str]]:
        return await self.__ai_manager.handle_request(file_path, hunk, pr_details)


    def __create_comments(self, file_path: str, hunk: Hunk, ai_responses: List[Dict[str, str]]) -> List[Dict[str, Any]]:
        return [self.__format_comment(file_path, hunk, response) for response in ai_responses if response]


    def __format_comment(self, file_path: str, hunk: Hunk, response: Dict[str, str]) -> Dict[str, Any]:
        try:
            line_number = int(response.get("lineNumber", 0))
            side = response.get("side", "").upper()

            if side and hunk.source_start <= line_number < hunk.source_start + hunk.source_length or hunk.target_start <= line_number < hunk.target_start + hunk.target_length:
                added_lines = [line.value.rstrip('\n') for line in hunk if line.is_added]
                removed_lines = [line.value.rstrip('\n') for line in hunk if line.is_removed]

                full_hunk = [f"{line.line_type}{line.value.rstrip()}" for line in hunk]
                return {
                    "comment": response["reviewComment"],
                    "added": added_lines,
                    "removed": removed_lines,
                    "full_hunk": full_hunk,
                    "path": file_path.strip(),
                    "line": line_number,
                }
        except (KeyError, TypeError, ValueError) as error:
            logger.error(f"Catch an error: {error}")
            pass
        return None