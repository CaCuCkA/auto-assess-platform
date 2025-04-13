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
    host: str
    port: int
    user: str
    token: str = None


@dataclass
class Gemini:
    token: str
    model: str


@dataclass
class Backend:
    host: str
    port: int


@dataclass
class Frontend:
    host: str
    port: int


@dataclass
class Config:
    db: DbConfig
    jenkins: Jenkins
    gemini: Gemini
    backend: Backend
    frontend: Frontend
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
                host=env.str("JENKINS_HOST"),
                port=env.int("JENKINS_PORT"),
                user=env.str("JENKINS_USER"),
            ),
            gemini=Gemini(
                token=env.str("GEMINI_API_TOKEN"),
                model=env.str("GEMINI_MODEL")
            ),
            backend=Backend(
                host=env.str("BACKEND_HOST"),
                port=env.int("BACKEND_PORT")
            ),
            frontend=Frontend(
                host=env.str("FRONTEND_HOST"),
                port=env.int("FRONTEND_PORT")
            ),
            env=env
        )


def load_config(path: str = None) -> Config:
    return Config.from_env(path)
