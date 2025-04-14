from .setup import Credentials, Jobs, Tests, FSManager
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
    return cls(f"http://{config.host}:{config.port}", config.user, config.token)


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

        tests = Tests(current_app.config["CONFIG"].backend.sharepoint_path)
        tests.add(homework.title, is_folder=True)

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

        if not homework:
            logger.warning(f"Homwork not found for {homework_id=} and {admin_id=}")
            return jsonify({"error": "Homework not found"}), 404

        tests = Tests(current_app.config["CONFIG"].backend.sharepoint_path)
        is_deleted = tests.delete(homework.title, is_all=True)

        if not is_deleted:
            logger.warning("Failed to delete homework test folder")
            return jsonify({"error": "Failed to delete homework test folder"}), 400

        participants = await g.db_gateway.homework_participant.get_all(
            homework_id=homework_id
        )

        if not participants:
            logger.warning(f"Participant not found for homework {homework_id}")
            return jsonify({"error": "Participant not found"}), 404

        cred_ids = [
            build_credential_id(p.full_name, p.participant_id, homework_id)
            for p in participants
        ]
        credential = get_jenkins_instance(Credentials)
        result, code = await credential.delete_multiple(cred_ids)

        logger.info(result)

        if code != 200:
            logger.warning(f"Participant not found for homework {homework_id}")
            return jsonify({"error": "Failed to delete all participants"}), 400

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

        fs_manager = FSManager(current_app.config["CONFIG"].backend.sharepoint_path)
        is_renamed = fs_manager.rename(old_name=homework.title, new_name=new_name)

        if not is_renamed:
            logger.warning("Failed to rename homework test folder")
            return jsonify({"error": "Failed to rename homework test folder"}), 400

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


@jenkins_bp.route("/add-test", methods=["POST"])
async def add_test():
    try:
        test_id = int(request.args.get("id", 0))
        homework_id = int(request.args.get("homework_id"), 0)

        if not test_id or not homework_id:
            logger.warning("Missing homework_id or test_id in request args")
            return jsonify({"error": "Missing homework_id or test_id"}), 400

        test = await g.db_gateway.test.get_single(
            test_id=test_id, homework_id=homework_id
        )

        if not test:
            logger.warning(f"Test not found for homework {homework_id}")
            return jsonify({"error": "Test not found"}), 400

        base_path = port = current_app.config["CONFIG"].backend.sharepoint_path

        tests = Tests(base_path)
        result = tests.add(test.name, test.file_content)
        if not result:
            logger.warning(f"Failed to create test file: {test_name}")
            return jsonify({"error": f"Failed to create test file: {test_name}"}), 400
        return jsonify({"success": "Test was successfully added"}), 200
    except ValueError:
        logger.exception("Invalid input types for test_id or homework_id")
        return jsonify({"error": "Invalid input type"}), 400
    except Exception as e:
        logger.exception("Unexpected error while add Jenkins test")
        return jsonify({"error": str(e)}), 500


@jenkins_bp.route("/delete-test", methods=["POST"])
async def delete_test():
    try:
        test_id = int(request.args.get("id", 0))
        homework_id = int(request.args.get("homework_id"), 0)

        if not test_id or not homework_id:
            logger.warning("Missing homework_id or test_id in request args")
            return jsonify({"error": "Missing homework_id or test_id"}), 400

        test = await g.db_gateway.test.get_single(
            test_id=test_id, homework_id=homework_id
        )

        if not test:
            logger.warning(f"Test not found for homework {homework_id}")
            return jsonify({"error": "Test not found"}), 400

        base_path = port = current_app.config["CONFIG"].backend.sharepoint_path

        tests = Tests(base_path)
        result = tests.delete(test.name)
        if not result:
            logger.warning(f"Failed to delete test file: {test_name}")
            return jsonify({"error": f"Failed to delete test file: {test_name}"}), 400
        return jsonify({"success": "Test was successfully deleted"}), 200
    except ValueError:
        logger.exception("Invalid input types for test_id or homework_id")
        return jsonify({"error": "Invalid input type"}), 400
    except Exception as e:
        logger.exception("Unexpected error while deleting Jenkins test")
        return jsonify({"error": str(e)}), 500


@jenkins_bp.route("/update-test", methods=["POST"])
async def update_test_status():
    try:
        test_id = int(request.args.get("id", 0))
        homework_id = int(request.args.get("homework_id"), 0)

        if not test_id or not homework_id:
            logger.warning("Missing homework_id or test_id in request args")
            return jsonify({"error": "Missing homework_id or test_id"}), 400

        test = await g.db_gateway.test.get_single(
            test_id=test_id, homework_id=homework_id
        )

        data = await request.get_json()
        new_name = data.get("new_name", "")

        if not test:
            logger.warning(f"Test not found for homework {homework_id}")
            return jsonify({"error": "Test not found"}), 400

        base_path = port = current_app.config["CONFIG"].backend.sharepoint_path

        tests = Tests(base_path)
        result = tests.update(test.name, new_name, test.is_active)
        if not result:
            logger.warning(f"Failed to delete test file: {test_name}")
            return jsonify({"error": f"Failed to delete test file: {test_name}"}), 400
        return jsonify({"success": "Test was successfully deleted"}), 200
    except ValueError:
        logger.exception("Invalid input types for test_id or homework_id")
        return jsonify({"error": "Invalid input type"}), 400
    except Exception as e:
        logger.exception("Unexpected error while deleting Jenkins test")
        return jsonify({"error": str(e)}), 500
