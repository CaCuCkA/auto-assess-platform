from flask import Blueprint, request, jsonify


jenkins_bp = Blueprint("jenkins", __name__)

@jenkins_bp.route("/add-credential", methods=["POST"])
def add_user_repo_credentials():
    data = request.get_json()
    
