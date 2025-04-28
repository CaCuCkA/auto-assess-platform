import json
from typing import Dict, List
from unidiff import Hunk
from config import PullRequestPayload
import google.generativeai as Client

class Gemini:
    def __init__(self, config):
        Client.configure(api_key=config.token)
        self.__model = Client.GenerativeModel(config.model)


    def create_prompt(self, file_path: str, hunk: Hunk, pr_details: PullRequestPayload) -> str:
        return f"""
            Your task is to review the following code changes. Please follow these guidelines:
            {self.format_guidelines()}
            You must:
                - Analyze the code critically and professionally.
                - Identify any issues related to code quality, correctness, readability, maintainability, performance, and best practices.
                - Provide constructive feedback with specific suggestions for improvement where necessary.
                - Detect potential bugs, security vulnerabilities, or logical errors if present.
                - Highlight positive aspects of the changes where applicable.
            Context Information:
            File: {file_path}
            PR Title: {pr_details.pr_title}
            PR Description: 
            ---
            {pr_details.pr_description or 'No description provided'}
            ---
            Git Diff Details:
            - Source Start: {hunk.source_start}
            - Source Length: {hunk.source_length} 
            - Target Start: {hunk.target_start}
            - Target Length: {hunk.target_length}
            Code Diff to Review:
            ```diff
            {hunk.__str__()}
            ```
        """


    def format_guidelines(self) -> str:
        return """Provide your response in this JSON format:
            {"reviews": [{"lineNumber": <line_number>, "reviewComment": "<review comment>", "side": "<left or right>", "filepath": "<file path>"}]}
            Important Rules:
            1. Line Number Validation:
            - For "left" side: <source_start> ≤ lineNumber < <source_start + source_length>
            - For "right" side: <target_start> ≤ lineNumber < <target_start + target_length>
            2. Review Focus Areas: [List focus areas here]
            3. Key Requirements: [List key requirements here]"""


    async def get_ai_response(self, prompt: str) -> List[Dict[str, str]]:
        try:
            response = await self.__model.generate_content_async(prompt, generation_config={'max_output_tokens': 1024, 'temperature': 0.3})
            response_text = self._clean_response_text(response.text)
            return self._parse_response(response_text)
        except Exception as e:
            print(f"Error during Gemini API call: {e}")
            return []


    def _clean_response_text(self, text: str) -> str:
        return text.strip().strip('```json').strip('```').strip()


    def _parse_response(self, response_text: str) -> List[Dict[str, str]]:
        try:
            reviews = json.loads(response_text).get("reviews", [])
            return [review for review in reviews if all(key in review for key in ['lineNumber', 'reviewComment'])]
        except json.JSONDecodeError:
            return []


class AIManager:
    def __init__(self, config):
        self.__gemini_service = Gemini(config)
    

    async def handle_request(self, file_path: str, hunk: Hunk, pr_details: PullRequestPayload):
        if not self.__gemini_service:
            raise RuntimeError("No active LLM service available")
        prompt = self.__gemini_service.create_prompt(file_path, hunk, pr_details)
        return await self.__gemini_service.get_ai_response(prompt)
    

    def get_active_service_name(self) -> str:
        return self.__gemini_service.__class__.__name__ if self.__gemini_service else "None"
