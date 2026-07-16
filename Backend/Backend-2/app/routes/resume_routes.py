from flask import Blueprint, request, jsonify
# pyrefly: ignore [missing-import]
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
            "job_title": request.form.get("job_title", ""),
            "job_description": request.form.get("job_description", ""),
            "resume_url": request.form.get("resume_url"),
        }

        validated_data = _request_schema.load(form_data)

        # ── Validate resume source ──────────────────────────────────────────────
        resume_file = request.files.get("resume")
        resume_url = validated_data.get("resume_url")

        if not resume_file and not resume_url:
            return jsonify({"success": False, "message": "Either resume file or resume_url is required."}), 400

        file_bytes = None
        filename = None

        if resume_file:
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
            file_bytes = resume_file.read()
            filename = resume_file.filename
        elif resume_url:
            import requests
            try:
                response = requests.get(resume_url, timeout=15)
                response.raise_for_status()
                file_bytes = response.content
                filename = resume_url.split("/")[-1]
            except Exception as download_error:
                return jsonify({
                    "success": False,
                    "message": f"Failed to download resume from URL: {str(download_error)}"
                }), 400

            filename_lower = filename.lower()
            if not (filename_lower.endswith(".pdf") or filename_lower.endswith(".docx") or filename_lower.endswith(".doc")):
                return jsonify({
                    "success": False,
                    "message": "Invalid file type from URL. Only PDF, DOC, and DOCX are accepted.",
                }), 400

        # ── Run the LangGraph Agent ──────────
        from app.services.agent import process_resume_with_agent
        
        file_bytes = resume_file.read()
        filename = resume_file.filename
        
        final_state = process_resume_with_agent(
            name=validated_data["name"],
            email=validated_data["email"],
            phone=validated_data.get("phone", ""),
            file_bytes=file_bytes,
            filename=filename,
            job_title=validated_data.get("job_title", ""),
            job_description=validated_data.get("job_description", ""),
            evaluation_prompt=validated_data.get("evaluation_prompt", "")
        )
        
        if final_state.get("error"):
            return jsonify({"success": False, "message": final_state["error"]}), 500

        result = {
            "name": final_state.get("name"),
            "email": final_state.get("email"),
            "phone": final_state.get("phone"),
            "parsed_resume_json": final_state.get("parsed_resume_json"),
            "resume_score": final_state.get("resume_score", 0.0)
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
