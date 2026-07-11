from flask import Blueprint, request, jsonify
from marshmallow import ValidationError

from app.schemas.request_schema import ResumeParseRequestSchema
from app.schemas.response_schema import ResumeParseResponseSchema
from app.services import resume_parser, ats_scorer

bp = Blueprint("resume", __name__)

_request_schema = ResumeParseRequestSchema()
_response_schema = ResumeParseResponseSchema()


@bp.route("/parse", methods=["POST"])
def parse_resume():
    """
    Parse a resume and return extracted information with ATS score.

    Request (multipart/form-data):
        - name           : str  — Candidate full name
        - email          : str  — Candidate email
        - phone          : str  — Candidate phone (optional)
        - job_id         : int  — Job posting ID
        - evaluation_prompt : str — Admin-defined evaluation criteria
        - resume_cutoff_score : int — Minimum score to shortlist
        - resume         : file — PDF / DOC / DOCX file

    Response (JSON):
        {
          "success": true,
          "data": {
            "name": str,
            "email": str,
            "phone": str | null,
            "skills": [...],
            "experience": [...],
            "projects": [...],
            "ats_score": float,
            "is_shortlisted": bool,
            "feedback": str
          }
        }

    NOTE: AI processing functions are currently empty stubs.
          The response data will be populated once AI logic is implemented.
    """
    try:
        # ── Validate form fields ───────────────────────────────────────────────
        form_data = {
            "name": request.form.get("name"),
            "email": request.form.get("email"),
            "phone": request.form.get("phone"),
            "job_id": request.form.get("job_id"),
            "evaluation_prompt": request.form.get("evaluation_prompt", ""),
            "resume_cutoff_score": request.form.get("resume_cutoff_score", 0),
        }

        validated_data = _request_schema.load(form_data)

        # ── Validate resume file ───────────────────────────────────────────────
        resume_file = request.files.get("resume")
        if not resume_file:
            return jsonify({"success": False, "message": "Resume file is required."}), 400

        allowed_mimes = [
            "application/pdf",
            "application/msword",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        ]
        if resume_file.content_type not in allowed_mimes:
            return jsonify({
                "success": False,
                "message": "Invalid file type. Only PDF, DOC, and DOCX are accepted.",
            }), 400

        # ── Call service stubs (bodies are empty — to be implemented) ──────────
        # parsed_data = resume_parser.parse_resume(
        #     resume_file=resume_file,
        #     evaluation_prompt=validated_data["evaluation_prompt"]
        # )
        # ats_result = ats_scorer.calculate_ats_score(
        #     parsed_resume=parsed_data,
        #     evaluation_prompt=validated_data["evaluation_prompt"],
        #     cutoff_score=validated_data["resume_cutoff_score"]
        # )

        # ── Placeholder response (replace when AI logic is ready) ─────────────
        result = {
            "name": validated_data["name"],
            "email": validated_data["email"],
            "phone": validated_data.get("phone"),
            "skills": [],       # To be populated by resume_parser
            "experience": [],   # To be populated by resume_parser
            "projects": [],     # To be populated by resume_parser
            "ats_score": 0.0,   # To be populated by ats_scorer
            "is_shortlisted": False,
            "feedback": "AI processing not yet implemented.",
        }

        return jsonify({"success": True, "data": result}), 200

    except ValidationError as e:
        return jsonify({"success": False, "message": "Validation error.", "errors": e.messages}), 400
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500


@bp.route("/health", methods=["GET"])
def health():
    """Health check endpoint for the resume parsing service."""
    return jsonify({
        "success": True,
        "service": "Resume Parsing Service",
        "status": "ready (AI logic pending implementation)",
    }), 200
