import hashlib
import shutil
from pathlib import Path


class FSManager:
    def __init__(self, base_path: str, folder_name: str):
        self.__base_path = Path(base_path if not folder_name else f"{base_path}/{FSManager._safe_name(folder_name)}")
        self.__base_path.mkdir(parents=True, exist_ok=True)

    @staticmethod
    def _safe_name(name: str) -> str:
        title_hash = hashlib.sha256(name.encode()).hexdigest()[:12]
        return f"job-{title_hash}"

    def create_folder(self, name: str) -> Path:
        folder_path = self.__base_path / self._safe_name(name)
        folder_path.mkdir(parents=True, exist_ok=True)
        return folder_path

    def delete_folder(self, name: str) -> bool:
        folder_path = self.__base_path / self._safe_name(name)
        if folder_path.exists() and folder_path.is_dir():
            shutil.rmtree(folder_path)
            return True
        return False

    def rename_folder(self, old_name: str, new_name: str) -> bool:
        old_path = self.__base_path / self._safe_name(old_name)
        new_path = self.__base_path / self._safe_name(new_name)
        if old_path.exists() and old_path.is_dir():
            old_path.rename(new_path)
            return True
        return False

    def create_file(self, name: str, content: str = "") -> Path:
        file_path = self.__base_path / f"{name}"
        file_path.write_text(content)
        return file_path

    def delete_file(self, name: str) -> bool:
        file_path = self.__base_path / f"{name}"
        if file_path.exists() and file_path.is_file():
            file_path.unlink()
            return True
        return False

    def rename_file(self, old_name: str, new_name: str) -> bool:
        old_path = self.__base_path / f"{old_name}"
        new_path = self.__base_path / f"{new_name}"
        if old_path.exists() and old_path.is_file():
            old_path.rename(new_path)
            return True
        return False
        