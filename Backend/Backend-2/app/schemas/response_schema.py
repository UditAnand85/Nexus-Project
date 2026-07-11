"""
Response Schemas for Backend-2
================================
Defines the structure of data returned by Backend-2 to:
  1. Direct API callers (GET /api/v1/resume/parse response)
  2. Backend-1 via the result callback (POST /api/v1/shortlisted/result)

These match the expected shapes in Backend-1's shortlisted.service.js processResult().
"""

from marshmallow import Schema, fields


# ─── Nested Schemas ───────────────────────────────────────────────────────────

class SkillSchema(Schema):
    """Represents a single skill extracted from a resume."""
    name = fields.Str(metadata={"description": "Skill name (e.g., Python, React, SQL)"})
    level = fields.Str(
        load_default="Intermediate",
        metadata={"description": "Proficiency level: Beginner / Intermediate / Advanced"},
    )


class ExperienceSchema(Schema):
    """Represents a single work experience entry."""
    company = fields.Str(metadata={"description": "Company or organization name"})
    role = fields.Str(metadata={"description": "Job title or role"})
    duration = fields.Str(metadata={"description": "Employment duration (e.g., Jan 2022 – Dec 2023)"})
    description = fields.Str(metadata={"description": "Role responsibilities and achievements"})


class ProjectSchema(Schema):
    """Represents a single project entry."""
    name = fields.Str(metadata={"description": "Project name"})
    description = fields.Str(metadata={"description": "What the project does"})
    technologies = fields.List(
        fields.Str(),
        load_default=[],
        metadata={"description": "Technologies used in the project"},
    )


class EducationSchema(Schema):
    """Represents an education entry."""
    institution = fields.Str(metadata={"description": "School or university name"})
    degree = fields.Str(metadata={"description": "Degree or certification"})
    year = fields.Str(metadata={"description": "Graduation year or duration"})


class ScoreBreakdownSchema(Schema):
    """Breakdown of ATS score by evaluation dimension."""
    keyword_match = fields.Float(load_default=0.0, metadata={"description": "Keyword match score (0–100)"})
    skills_match = fields.Float(load_default=0.0, metadata={"description": "Skills alignment score (0–100)"})
    experience = fields.Float(load_default=0.0, metadata={"description": "Experience relevance score (0–100)"})
    projects = fields.Float(load_default=0.0, metadata={"description": "Projects relevance score (0–100)"})


# ─── Main Response Schema ─────────────────────────────────────────────────────

class ResumeParseResponseSchema(Schema):
    """
    Full response schema returned by Backend-2 after resume processing.

    Returned to:
      - Direct HTTP callers of POST /api/v1/resume/parse
      - Serialized into the callback payload sent to Backend-1

    All AI-populated fields (skills, experience, projects, ats_score) will be
    empty/zero until the AI service functions are implemented.
    """

    name = fields.Str(required=True, metadata={"description": "Candidate name (echoed from input)"})
    email = fields.Email(required=True, metadata={"description": "Candidate email (echoed from input)"})
    phone = fields.Str(allow_none=True, load_default=None, metadata={"description": "Candidate phone"})

    skills = fields.List(
        fields.Nested(SkillSchema),
        load_default=[],
        metadata={"description": "Extracted skills from the resume"},
    )

    experience = fields.List(
        fields.Nested(ExperienceSchema),
        load_default=[],
        metadata={"description": "Work experience entries"},
    )

    projects = fields.List(
        fields.Nested(ProjectSchema),
        load_default=[],
        metadata={"description": "Project entries from resume"},
    )

    education = fields.List(
        fields.Nested(EducationSchema),
        load_default=[],
        metadata={"description": "Education entries from resume"},
    )

    ats_score = fields.Float(
        required=True,
        metadata={"description": "ATS score (0–100) — populated by AI"},
    )

    is_shortlisted = fields.Bool(
        load_default=False,
        metadata={"description": "True if ats_score >= resume_cutoff_score"},
    )

    score_breakdown = fields.Nested(
        ScoreBreakdownSchema,
        load_default={},
        metadata={"description": "Per-criterion breakdown of the ATS score"},
    )

    feedback = fields.Str(
        load_default="",
        metadata={"description": "Brief AI evaluation summary for this candidate"},
    )


# ─── Backend-1 Callback Schema ────────────────────────────────────────────────

class ResultCallbackSchema(Schema):
    """
    Payload sent by Backend-2 to Backend-1 after processing is complete.

    Endpoint: POST Backend-1/api/v1/shortlisted/result
    Header:   X-Internal-Api-Key: <INTERNAL_API_KEY>

    Backend-1 uses this to:
      - Update the student's parsed_resume_json and resume_score
      - Set application_status to Shortlisted or Rejected
      - Create a shortlisted_students record if shortlisted
    """

    student_id = fields.Int(
        required=True,
        metadata={"description": "Student's primary key from Backend-1's students table"},
    )

    parsed_resume_json = fields.Dict(
        load_default={},
        metadata={"description": "Full AI-parsed resume data (stored in students.parsed_resume_json)"},
    )

    resume_score = fields.Float(
        required=True,
        metadata={"description": "ATS score (0–100) to be stored in students.resume_score"},
    )

    application_status = fields.Str(
        load_default=None,
        allow_none=True,
        metadata={
            "description": "Optional override for application status. "
                           "If None, Backend-1 determines status from score vs cutoff."
        },
    )
