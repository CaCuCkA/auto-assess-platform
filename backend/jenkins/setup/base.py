from .singleton import SingletonMeta

class Base(metaclass=SingletonMeta):
    def __init__(self, url, user, token):
        self._url = url
        self._user = user
        self._token = token

    def create(self, *args, **kwargs):
        raise NotImplementedError

    def delete(self):
        raise NotImplementedError
