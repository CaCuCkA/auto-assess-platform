from quart import Blueprint, request, current_app, jsonify

from utils import get_logger
from config import PullRequestPayload

from .setup import AIManager, CodeReviewer

logger = get_logger(__name__)


ai_bp = Blueprint("ai", __name__)


@ai_bp.route("/check-code", methods=["POST"])
async def webhook_handler():
    data = await request.get_json()
    if not data:
        logger.warning("Missing JSON body in request")
        return jsonify({"error": "Missing JSON body"}), 400
    
    payload_js = data.get("pr_payload", "")
    diff = data.get("diff", "")

    if not payload_js or not diff:
        logger.warning("JSON body does not contain pull request payload or diff")
        return jsonify({"error": "JSON body does not contain pull request payload or diff"}), 400
    
    pr_payload = PullRequestPayload.from_json(payload_js)

    code_reviewer = CodeReviewer(AIManager(current_app.config["CONFIG"].gemini))
    comments = await code_reviewer.analyze_code(parsed_diff=diff, pr_details=pr_payload)

    return jsonify(comments), 200
