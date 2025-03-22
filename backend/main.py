import logging
import betterlogging as bl

from quart import Quart

from jenkins.routes import jenkins_bp
from config import load_config
from database.setup import create_engine, create_session_pool

def setup_logging():
    log_level = logging.INFO
    bl.basic_colorized_config(level=log_level)

    logging.basicConfig(
        level=log_level,
        format="%(filename)s:%(lineno)d #%(levelname)-8s [%(asctime)s] - %(name)s - %(message)s",
    )
    logger = logging.getLogger(__name__)
    logger.info("Logging is configured.")

setup_logging()

app = Quart(__name__)
app.register_blueprint(jenkins_bp, url_prefix='/jenkins')

config = load_config("../.env")


@app.before_serving
async def init_resources():
    logger = logging.getLogger(__name__)
    logger.info("Initializing DB resources...")

    engine = create_engine(config.db)
    session_pool = await create_session_pool(engine)
    app.config["SESSION_POOL"] = session_pool

    logger.info("DB session pool created successfully.")

if __name__ == "__main__":
    app.run(debug=True, port=5001)
