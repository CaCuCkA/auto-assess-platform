from quart import Blueprint, request

from utils import get_logger
from setup import EventHandler


logger = get_logger(__name__)

github_bp = Blueprint("github", __name__)

@github_bp.route("/webhook", methods=["POST"])
async def webhook_handler():
    logger.info(request.json)