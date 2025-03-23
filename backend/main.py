from quart import Quart, g, current_app

from jenkins.routes import jenkins_bp
from config import load_config
from utils import setup_logging, get_logger
from database import create_engine, create_session_pool, DatabaseGateway


app = Quart(__name__)
app.register_blueprint(jenkins_bp, url_prefix='/jenkins')


@app.before_serving
async def init_resources():
    setup_logging()
    logger = get_logger(__name__)

    config = load_config("../.env")
    app.config["CONFIG"] = config
    
    logger.info("Initializing DB resources...")
    engine = create_engine(config.db)
    session_pool = await create_session_pool(engine)
    app.config["SESSION_POOL"] = session_pool

    logger.info("DB session pool created successfully.")


@app.before_request
async def init_db_gateway():
    session_pool = current_app.config["SESSION_POOL"]
    session = session_pool()
    g.db_gateway = DatabaseGateway(session)


@app.after_request
async def cleanup_db_gateway(response):
    if hasattr(g, "db_session"):
        await g.db_session.close()
    return response


@app.route("/")
async def index():
    return {"message": "Quart app is running with DB Gateway!"}


if __name__ == "__main__":
    app.run(debug=True, port=5001)
