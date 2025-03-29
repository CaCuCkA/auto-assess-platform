import json
from dataclasses import dataclass, asdict

from environs import Env
from sqlalchemy.engine.url import URL


@dataclass
class PullRequestPayload:
    repository_owner: str
    repository_name: str
    pr_number: int
    pr_title: str
    pr_description: str
    commit_sha: str
    url: str

    def to_json(self):
        return json.dumps(asdict(self))
    

@dataclass
class DbConfig:
    user: str
    password: str
    database: str
    host: str
    port: int

    def construct_sqlalchemy_url(self, driver="asyncpg", host=None, port=None) -> str:
        if not host:
            host = self.host
        if not port:
            port = self.port
        uri = URL.create(
            drivername=f"postgresql+{driver}",
            username=self.user,
            password=self.password,
            host=host,
            port=port,
            database=self.database,
        )
        return uri.render_as_string(hide_password=False)

    @staticmethod
    def from_env(env: Env):
        user = env.str("POSTGRES_USER")
        password = env.str("POSTGRES_PASSWORD")
        database = env.str("POSTGRES_DB")
        host = env.str("DB_HOST")
        port = env.int("DB_PORT")
        return DbConfig(user=user, password=password, database=database, host=host, port=port)


@dataclass
class Jenkins:
    url: str
    user: str
    token: str

    @staticmethod
    def from_env(env: Env):
        url = env.str("JENKINS_URL")
        user = env.str("JENKINS_USER")
        token = env.str("JENKINS_API_TOKEN")
        return Jenkins(url=url, user=user, token=token)


@dataclass
class Gemini:
    token: str
    model: str

    @staticmethod
    def from_env(env: Env):
        token = env.str("GEMINI_API_TOKEN")
        model = env.str("GEMINI_MODEL")
        return Gemini(token=token, model=model) 
    

@dataclass
class Config:
    db: DbConfig
    jenkins: Jenkins
    gemini: Gemini

def load_config(path: str = None) -> Config:
    env = Env()
    env.read_env(path)

    return Config(
        db=DbConfig.from_env(env),
        jenkins=Jenkins.from_env(env),
        gemini=Gemini.from_env(env),
    )
