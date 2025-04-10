from quart import Quart, g, current_app, jsonify
from quart_cors import cors

from github_events import github_bp
from jenkins import jenkins_bp
from ai_report import ai_bp
from config import load_config
from utils import setup_logging, get_logger
from database import create_engine, create_session_pool, DatabaseGateway


config = load_config("../.env")

app = cors(Quart(__name__), allow_origin=f"http://{config.frontend.ip}:{config.frontend.port}")
app.config.update({
    "CONFIG": config,
    "SESSION_POOL": None
})

app.register_blueprint(jenkins_bp, url_prefix='/jenkins')
app.register_blueprint(github_bp, url_prefix='/github')
app.register_blueprint(ai_bp, url_prefix='/ai')

logger = get_logger(__name__)

@app.before_serving
async def init_resources():
    setup_logging()
    logger.info("Initializing DB resources...")

    engine = create_engine(app.config["CONFIG"].db)
    app.config["SESSION_POOL"] = await create_session_pool(engine)

    logger.info("DB session pool created successfully.")

@app.before_request
async def init_db_gateway():
    session_pool = app.config["SESSION_POOL"]
    db_session = session_pool()
    g.db_gateway = DatabaseGateway(db_session)

@app.after_request
async def cleanup_db_gateway(response):
    db_gateway = getattr(g, 'db_gateway', None)
    if db_gateway:
        await db_gateway.session.close()
    return response

if __name__ == "__main__":
    port = config.backend.port or 5000
    app.run(host="0.0.0.0", debug=True, port=port)
  