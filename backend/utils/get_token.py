import os
import time
from quart import current_app
from .logging import get_logger


logger = get_logger(__name__)


def get_token_from_file(file_name: str = "token.txt", wait_timeout: int = 60):
    config = current_app.config["CONFIG"]
    basepath = config.backend.sharepoint_path
    file_path = f"{basepath}/{file_name}"

    start_time = time.time()

    while True:
        if os.path.exists(file_path) and os.path.getsize(file_path) > 0:
            break

        if time.time() - start_time > wait_timeout:
            logger.error(f"Timeout: Token file '{file_path}' not found or still empty after {wait_timeout} seconds.")
            raise TimeoutError(f"Timed out waiting for token file '{file_path}'")

        logger.info(f"Waiting for token file '{file_path}'...")
        time.sleep(2)

    try:
        with open(file_path, mode="r") as file:
            token = file.read().strip()

        if not token:
            logger.error(f"Token file '{file_path}' is empty.")
            raise ValueError("Jenkins token file is empty")

        config.update_jenkins_token(token)
        logger.info(f"✅ Jenkins token loaded from '{file_path}'")

    except PermissionError:
        logger.error(f"No permission to read token file '{file_path}'")
        raise PermissionError(f"No permission to read token file '{file_path}'")

    except Exception as e:
        logger.exception(f"Unexpected error reading Jenkins token file: {e}")
        raise RuntimeError(f"Failed to load Jenkins token: {e}")
