import fnmatch

from .fs_manager import FSManager


class Tests:
    def __init__(self, sharepoint_path: str):
        self.__fs_manager = FSManager(sharepoint_path)

   def __is_correct_format(self, name):
        return fnmatch.fnmatch(name, "test*.py")

    def  __unify_format(self, name):
        if __is_correct_format(name):
            return name
        return "test_" + name

   def add(self, name: str, content: str = "", is_folder: bool = False):
        if is_folder:
            path = self.__fs_manager.create_folder(name)
            return bool(path)

        name = self.__unify_format(name)
        path = self.__fs_manager.create_file(name, content)
        return bool(path)

    def delete(self, name, is_all=False):
        if is_all:
            result = self.__fs_manager.delete_folder(name)
            return result

        name = self.__unify_format(name)
        result = self.__fs_manager.delete_file(name)
        return result
    
    def update(self, name):
        name = self.__unify_format(name)
        result = self.__fs_manager.rename_file(name, "disable_" + name)
        return result
