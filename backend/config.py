import json
from dataclasses import dataclass, asdict, field
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
    
    @classmethod
    def from_json(cls, json_str: str) -> 'PullRequestPayload':
        data = json.loads(json_str)
        return cls(**data)


@dataclass
class DbConfig:
    user: str
    password: str
    database: str
    host: str
    port: int

    def construct_sqlalchemy_url(self, driver="asyncpg") -> str:
        uri = URL.create(
            drivername=f"postgresql+{driver}",
            username=self.user,
            password=self.password,
            host=self.host,
            port=self.port,
            database=self.database,
        )
        return uri.render_as_string(hide_password=False)


@dataclass
class Jenkins:
    url: str
    user: str
    token: str


@dataclass
class Gemini:
    token: str
    model: str


@dataclass
class Backend:
    port: int


@dataclass
class Config:
    db: DbConfig
    jenkins: Jenkins
    gemini: Gemini
    backend: Backend
    env: Env = field(default_factory=Env)

    @classmethod
    def from_env(cls, path: str = None):
        env = Env()
        env.read_env(path)

        return cls(
            db=DbConfig(
                user=env.str("POSTGRES_USER"),
                password=env.str("POSTGRES_PASSWORD"),
                database=env.str("POSTGRES_DB"),
                host=env.str("DB_HOST"),
                port=env.int("DB_PORT")
            ),
            jenkins=Jenkins(
                url=env.str("JENKINS_URL"),
                user=env.str("JENKINS_USER"),
                token=env.str("JENKINS_API_TOKEN")
            ),
            gemini=Gemini(
                token=env.str("GEMINI_API_TOKEN"),
                model=env.str("GEMINI_MODEL")
            ),
            backend=Backend(
                port=env.int("BACKEND_PORT")
            ),
            env=env
        )


def load_config(path: str = None) -> Config:
    return Config.from_env(path)
