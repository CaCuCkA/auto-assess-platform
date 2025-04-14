import fnmatch

from .fs_manager import FSManager
from utils import get_logger


logger = get_logger(__name__)

class Tests:
    def __init__(self, sharepoint_path: str, folder_name: str = None):
        self.__fs_manager = FSManager(sharepoint_path, folder_name)
        self.__prefix = "disable_"

    def __is_correct_format(self, name: str) -> bool:
        return fnmatch.fnmatch(name, "test_*.py")

    def __unify_format(self, name: str) -> str:
        if not name: 
            return name 
        if not name.endswith(".py"):
            name += ".py"
        if not name.startswith("test_"):
            name = "test_" + name
        return name

    def add(self, name: str, content: str = "", is_folder: bool = False):
        if is_folder:
            path = self.__fs_manager.create_folder(name)
            return bool(path)
        name = self.__unify_format(name)
        name = f"{self.__prefix}{name}"
        path = self.__fs_manager.create_file(name, content)
        return bool(path)

    def delete(self, name: str,  is_active: bool = False, is_all: bool = False):
        if is_all:
            result = self.__fs_manager.delete_folder(name)
            return result
        name = self.__unify_format(name)
        name = f"{self.__prefix}{name}" if not is_active else name
        logger.warn(f"Folder to delete: {name}")
        result = self.__fs_manager.delete_file(name)
        return result
    
    def update(self, name: str, new_name: str = "", is_active: bool = False):
        name = self.__unify_format(name)
        old_name = f"{self.__prefix}{name}" if is_active or new_name else name
        target_name = self.__unify_format(new_name) or name
        new_name = f"{self.__prefix}{target_name}" if not is_active else target_name
        logger.warn(f"old_name: {old_name=}, new_name: {new_name=}")
        return self.__fs_manager.rename_file(old_name, new_name)
