from pathlib import Path
import hashlib
import shutil
import re


class FolderManager:
    def __init__(self, base_path: str):
        self.base_path = Path(base_path)
        self.base_path.mkdir(parents=True, exist_ok=True)


    @staticmethod
    def _safe_name(name: str) -> str:
        title_hash = hashlib.sha256(name.encode()).hexdigest()[:12]
        return f"job-{title_hash}"


    def create(self, name: str) -> Path:
        folder_path = self.base_path / self._safe_name(name)
        folder_path.mkdir(parents=True, exist_ok=True)
        return folder_path


    def delete(self, name: str) -> bool:
        folder_path = self.base_path / self._safe_name(name)
        if folder_path.exists() and folder_path.is_dir():
            shutil.rmtree(folder_path)
            return True
        return False


    def rename(self, old_name: str, new_name: str) -> bool:
        old_path = self.base_path / self._safe_name(old_name)
        new_path = self.base_path / self._safe_name(new_name)
        if old_path.exists() and old_path.is_dir():
            old_path.rename(new_path)
            return True
        return False
