from quart import Quart, g, current_app

from github_events import github_bp
from jenkins import jenkins_bp
from config import load_config
from utils import setup_logging, get_logger
from database import create_engine, create_session_pool, DatabaseGateway

app = Quart(__name__)

config = load_config("../.env")
app.config["CONFIG"] = config

app.register_blueprint(jenkins_bp, url_prefix='/jenkins')
app.register_blueprint(github_bp, url_prefix='/github')

logger = get_logger(__name__)

@app.before_serving
async def init_resources():
    setup_logging()
    
    logger.info("Initializing DB resources...")
    engine = create_engine(app.config["CONFIG"].db)
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
    port = app.config["CONFIG"].backend.port
    app.run(host="0.0.0.0", debug=True, port=port)
