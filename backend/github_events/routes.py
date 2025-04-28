from quart import Blueprint, request, g, current_app, jsonify

from utils import get_logger
from .setup import EventHandler


logger = get_logger(__name__)

github_bp = Blueprint("github", __name__)


@github_bp.route("/webhook", methods=["POST"])
async def webhook_handler():
    event_type = request.headers.get("X-GitHub-Event")
    payload = await request.get_json()

    if event_type == "ping":
        logger.info(f"Received GitHub ping: {payload}")
        zen = payload.get("zen", "") if payload else ""
        return jsonify({"msg": "pong", "zen": zen}), 200

    if event_type == "pull_request":
        if payload is None:
            return jsonify({"error": "Missing payload"}), 400
        action = payload.get("action")
        if action not in ["opened", "reopened", "synchronize"]:
            logger.info(f"Ignoring pull request action: {action}")
            return jsonify({"msg": f"Skipped pull request with action: {action}"}), 200

    if event_type != "pull_request":
        logger.info(f"Ignoring unsupported event type: {event_type}")
        return jsonify({"msg": f"Ignored event: {event_type}"}), 200

    event_handler = EventHandler(db_gateway=g.db_gateway, config=current_app.config["CONFIG"])
    result, code = await event_handler.webhook_event(request)
    return jsonify(result), code


@github_bp.route("/success", methods=["POST"])
async def successed_build_handler():
    event_handler = EventHandler(db_gateway=g.db_gateway, config=current_app.config["CONFIG"])
    result, code = await event_handler.success_event(request)
    return jsonify(result), code


@github_bp.route("/failed", methods=["POST"])
async def failed_build_handler():
    event_handler = EventHandler(db_gateway=g.db_gateway, config=current_app.config["CONFIG"])
    result, code = await event_handler.failed_event(request)
    return jsonify(result), code


@github_bp.route("/submit-report", methods=["POST"])
async def submit_report():
    event_handler = EventHandler(db_gateway=g.db_gateway, config=current_app.config["CONFIG"])
    result, code = await event_handler.submit_report(request)
    return jsonify(result), code