import fnmatch

from .fs_manager import FSManager


class Tests:
    def __init__(self, sharepoint_path: str):
        self.__fs_manager = FSManager(sharepoint_path)

    def __is_correct_format(self, name: str):
        return fnmatch.fnmatch(name, "test*.py")

    def  __unify_format(self, name: str):
        if self.__is_correct_format(name):
            return name
        return "test_" + name

    def add(self, name: str, content: str = "", is_folder: bool = False):
        if is_folder:
            path = self.__fs_manager.create_folder(name)
            return bool(path)

        name = self.__unify_format(name)
        path = self.__fs_manager.create_file(name, content)
        return bool(path)

    def delete(self, name: str, is_all: bool = False):
        if is_all:
            result = self.__fs_manager.delete_folder(name)
            return result

        name = self.__unify_format(name)
        result = self.__fs_manager.delete_file(name)
        return result
    
    def update(self, name: str, new_name: str = "", is_active: bool = False):
        name = self.__unify_format(name)
        prefix = "disable_"

        old_name = f"{prefix}{name}" if not is_active else name
        target_name = new_name or name
        new_name = f"{prefix}{target_name}" if not is_active else target_name

        return self.__fs_manager.rename_file(old_name, new_name)
