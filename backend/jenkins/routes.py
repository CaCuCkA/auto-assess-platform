from .setup import Credentials, Jobs
from utils import get_logger

from typing import Type, TypeVar
from quart import Blueprint, request, g, current_app, jsonify

T = TypeVar('T')
jenkins_bp = Blueprint("jenkins", __name__)
logger = get_logger(__name__)


def sanitize_name(name: str) -> str:
    return name.lower().replace(" ", "_")


def build_credential_id(full_name: str, participant_id: int, homework_id: int) -> str:
    return f"{sanitize_name(full_name)}_{participant_id}_{homework_id}"


def get_jenkins_instance(cls: Type[T]) -> T:
    config = current_app.config["CONFIG"].jenkins
    return cls(config.url, config.user, config.token)


@jenkins_bp.route("/add-credential", methods=["POST"])
async def add_user_repo_credentials():
    try:
        participant_id = int(request.args.get("id", 0))
        homework_id = int(request.args.get("homework_id", 0))
        if not participant_id or not homework_id:
            logger.warning("Missing participant_id or homework_id in request args")
            return jsonify({"error": "Missing participant_id or homework_id"}), 400

        participant = await g.db_gateway.homework_participant.get_single(
            participant_id=participant_id, homework_id=homework_id
        )
        if not participant:
            logger.warning(f"Participant not found for ID {participant_id} and homework {homework_id}")
            return jsonify({"error": "Participant not found"}), 404

        credential = get_jenkins_instance(Credentials)
        cred_id = build_credential_id(participant.full_name, participant_id, homework_id)

        logger.info(f"Creating credential: {cred_id}")
        result, code = await credential.create(cred_id, participant.ssh_key)
        return jsonify({"result": result}), code
    except ValueError:
        logger.exception("Invalid input types for participant_id or homework_id")
        return jsonify({"error": "Invalid input"}), 400
    except Exception as e:
        logger.exception("Unexpected error while creating Jenkins credential")
        return jsonify({"error": str(e)}), 500


@jenkins_bp.route("/delete-credential", methods=["POST"])
async def delete_user_repo_credentials():
    try:
        participant_id = int(request.args.get("id", 0))
        homework_id = int(request.args.get("homework_id", 0))
        if not participant_id or not homework_id:
            logger.warning("Missing participant_id or homework_id in request args")
            return jsonify({"error": "Missing participant_id or homework_id"}), 400

        participant = await g.db_gateway.homework_participant.get_single(
            participant_id=participant_id, homework_id=homework_id
        )
        if not participant:
            logger.warning(f"Participant not found for ID {participant_id} and homework {homework_id}")
            return jsonify({"error": "Participant not found"}), 404

        credential = get_jenkins_instance(Credentials)
        cred_id = build_credential_id(participant.full_name, participant_id, homework_id)

        logger.info(f"Deleting credential: {cred_id}")
        result, code = await credential.delete(cred_id)
        return jsonify({"result": result}), code
    except ValueError:
        logger.exception("Invalid input types for participant_id or homework_id")
        return jsonify({"error": "Invalid input"}), 400
    except Exception as e:
        logger.exception("Unexpected error while deleting Jenkins credential")
        return jsonify({"error": str(e)}), 500


@jenkins_bp.route("/update-credential", methods=["POST"])
async def update_user_repo_credentials():
    try:
        participant_id = int(request.args.get("id", 0))
        homework_id = int(request.args.get("homework_id", 0))
        if not participant_id or not homework_id:
            logger.warning("Missing participant_id or homework_id in JSON body")
            return jsonify({"error": "Missing participant_id or homework_id"}), 400

        data = await request.get_json()
        if not data:
            logger.warning("Missing JSON body in request")
            return jsonify({"error": "Missing JSON body"}), 400

        participant = await g.db_gateway.homework_participant.get_single(
            participant_id=participant_id, homework_id=homework_id
        )
        if not participant:
            logger.warning(f"Participant not found for ID {participant_id} and homework {homework_id}")
            return jsonify({"error": "Participant not found"}), 404

        full_name = data.get("full_name", participant.full_name)
        ssh_key = data.get("ssh_key", participant.ssh_key)

        credential = get_jenkins_instance(Credentials)

        old_cred_id = build_credential_id(participant.full_name, participant_id, homework_id)
        logger.info(f"Deleting old credential: {old_cred_id}")
        result, code = await credential.delete(old_cred_id)
        if code != 200:
            logger.error(f"Failed to delete old credential {old_cred_id}: {result}")
            return jsonify(result), code

        new_cred_id = build_credential_id(full_name, participant_id, homework_id)
        logger.info(f"Creating new credential: {new_cred_id}")
        create_result, create_code = await credential.create(new_cred_id, ssh_key)
        return jsonify({"result": create_result}), create_code
    except ValueError:
        logger.exception("Invalid input types for participant_id or homework_id")
        return jsonify({"error": "Invalid input type"}), 400
    except Exception as e:
        logger.exception("Unexpected error while updating Jenkins credential")
        return jsonify({"error": str(e)}), 500


@jenkins_bp.route("/add-job", methods=["POST"])
async def create_homework_job():
    try:
        homework_id = int(request.args.get("id", 0))
        admin_id = int(request.args.get("admin_id", 0))
        if not admin_id or not homework_id:
            logger.warning("Missing admin_id or homework_id in request args")
            return jsonify({"error": "Missing admin_id or homework_id"}), 400
        
        homework = await g.db_gateway.homework.get_single(
            admin_id=admin_id, homework_id=homework_id
        )

        jobs = get_jenkins_instance(Jobs)
        result, code = await jobs.create(homework.title)

        return jsonify({"result": result}), code
    except ValueError:
        logger.exception("Invalid input types for admin_id or homework_id")
        return jsonify({"error": "Invalid input type"}), 400
    except Exception as e:
        logger.exception("Unexpected error while creating Jenkins job")
        return jsonify({"error": str(e)}), 500


@jenkins_bp.route("/delete-job", methods=["POST"])
async def delete_homework_job():
    try:
        homework_id = int(request.args.get("id", 0))
        admin_id = int(request.args.get("admin_id", 0))
        if not admin_id or not homework_id:
            logger.warning("Missing admin_id or homework_id in request args")
            return jsonify({"error": "Missing admin_id or homework_id"}), 400
        
        homework = await g.db_gateway.homework.get_single(
            admin_id=admin_id, homework_id=homework_id
        )

        jobs = get_jenkins_instance(Jobs)
        result, code = await jobs.delete(homework.title)

        return jsonify({"result": result}), code
    except ValueError:
        logger.exception("Invalid input types for admin_id or homework_id")
        return jsonify({"error": "Invalid input type"}), 400
    except Exception as e:
        logger.exception("Unexpected error while deleting Jenkins job")
        return jsonify({"error": str(e)}), 500
    

@jenkins_bp.route("/update-job", methods=["POST"])
async def update_homework_job():
    try:
        homework_id = int(request.args.get("id", 0))
        admin_id = int(request.args.get("admin_id", 0))
        if not admin_id or not homework_id:
            logger.warning("Missing admin_id or homework_id in request args")
            return jsonify({"error": "Missing admin_id or homework_id"}), 400

        data = await request.get_json()
        if not data:
            logger.warning("Missing JSON body in request")
            return jsonify({"error": "Missing JSON body"}), 400


        homework = await g.db_gateway.homework.get_single(
            admin_id=admin_id, homework_id=homework_id
        )

        new_name = data.get("new_name", homework.title)

        jobs = get_jenkins_instance(Jobs)
        result, code = await jobs.update(homework.title, new_name)
        return jsonify({"result": result}), code
    except ValueError:
        logger.exception("Invalid input types for admin_id or homework_id")
        return jsonify({"error": "Invalid input type"}), 400
    except Exception as e:
        logger.exception("Unexpected error while deleting Jenkins job")
        return jsonify({"error": str(e)}), 500

@jenkins_bp.route("/trigger-job", methods=["POST"])
async def trigger_homework_job():
    try:
        homework_id = int(request.args.get("id", 0))
        participant_id = int(request.args.get("participant_id"), 0)
        if not homework_id or not participant_id:
            logger.warning("Missing homework_id in request args")
            return jsonify({"error": "Missing homework_id"}), 400
        
        data = await request.get_json()
        if not data:
            logger.warning("Missing JSON body in request")
            return jsonify({"error": "Missing JSON body"}), 400
        
        credential_id = build_credential_id(full_name=data.get("full_name", ""),
                                            participant_id=participant_id,
                                            homework_id=homework_id)

        port = current_app.config["CONFIG"].backend.port

        params = {
            "GITHUB_URL":data.get("url"),
            "GITHUB_SHA_COMMIT":data.get("commit_sha"),
            "CREDENTIALS":credential_id,
            "SUCCESS_ENDPOINT": f"http://localhost:{port}/github/success?id={participant_id}&homework_id={homework_id}", 
            "FAILED_ENDPOINT": f"http://localhost:{port}/github/failed?id={participant_id}&homework_id={homework_id}"
        }
        
        jobs = get_jenkins_instance(Jobs)
        result, code = await jobs.trigger(data.get("homework_title"), **params)
        return jsonify({"result": result}), code
    except ValueError:
        logger.exception("Invalid input types for admin_id or homework_id")
        return jsonify({"error": "Invalid input type"}), 400
    except Exception as e:
        logger.exception("Unexpected error while deleting Jenkins job")
        return jsonify({"error": str(e)}), 500