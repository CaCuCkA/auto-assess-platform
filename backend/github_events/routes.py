from quart import Blueprint, request, g, current_app, jsonify

from utils import get_logger
from .setup import EventHandler


logger = get_logger(__name__)

github_bp = Blueprint("github", __name__)

@github_bp.route("/webhook", methods=["POST"])
async def webhook_handler():
    event_handler = EventHandler(db_gateway=g.db_gateway, config=current_app.config["CONFIG"])    
    result, code = await event_handler.webhook_event(request)
    return jsonify(result), code


@github_bp.route("/success", methods=["POST"])
async def successed_build_handler():
    pass


@github_bp.route("/failed", methods=["POST"])
async def failed_build_handler():
    event_handler = EventHandler(db_gateway=g.db_gateway, config=current_app.config["CONFIG"])
    result, code = await event_handler.failed_event(request)
    return jsonify(result), code
