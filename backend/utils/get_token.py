from quart import Blueprint, request, g, current_app, jsonify

from .logging import get_logger


logger = get_logger(__name__)

jenkins_token_bp = Blueprint("jenkins_token", __name__)

@jenkins_token_bp.route("/add", methods=["POST"])
async def webhook_handler():
    data = await request.get_json()
    if not data:
        logger.error("Missing JSON body in request")
        return jsonify({"error": "Missing JSON body"}), 400
    
    token = data.get("token")
    if not token:
        logger.error("Missing Jenkins API token in request")
        return jsonify({"error": "Missing Jenkins API token in request"}), 400

    config = current_app.config["CONFIG"]
    config.update_jenkins_token(token)
    logger.info(f"TOKEN: {config.jenkins.token}")
    return jsonify({"success": "Successfully get API token"}), 200

