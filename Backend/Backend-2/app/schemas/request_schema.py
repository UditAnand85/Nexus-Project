"""
Request Schemas for Backend-2
==============================
Defines and validates all incoming request data using Marshmallow.

Two schemas are defined:
  1. ResumeParseRequestSchema  — for direct HTTP POST /api/v1/resume/parse
  2. QueueJobSchema            — for BullMQ job payloads received from Backend-1

These match the data shapes sent by Backend-1.
"""

from marshmallow import Schema, fields, validate


class ResumeParseRequestSchema(Schema):
    """
    Schema for the resume parsing HTTP endpoint.

    Input: multipart/form-data from Backend-1 or direct API call.
    Sent when a candidate submits their application.

    Fields:
        name                : Candidate full name
        email               : Candidate email address
        phone               : Phone number (optional)
        job_id              : ID of the job being applied for
        evaluation_prompt   : AI evaluation criteria set by admin for this job
        resume_cutoff_score : Minimum ATS score to shortlist (0–100)

    Note: The resume file itself is handled separately as multipart file upload.
    """

    name = fields.Str(
        required=True,
        validate=validate.Length(min=1, max=255),
        metadata={"description": "Candidate full name"},
    )

    email = fields.Email(
        required=True,
        metadata={"description": "Candidate email address"},
    )

    phone = fields.Str(
        load_default=None,
        allow_none=True,
        validate=validate.Length(max=20),
        metadata={"description": "Candidate phone number"},
    )

    job_id = fields.Str(
        required=True,
        metadata={"description": "ID of the job posting (from Backend-1 JOBS table)"},
    )

    evaluation_prompt = fields.Str(
        load_default="",
        metadata={"description": "Job-specific AI evaluation criteria from admin"},
    )

    resume_cutoff_score = fields.Int(
        load_default=0,
        validate=validate.Range(min=0, max=100),
        metadata={"description": "Minimum ATS score required for shortlisting (0–100)"},
    )

    job_title = fields.Str(
        load_default="",
        metadata={"description": "Job posting title"},
    )

    job_description = fields.Str(
        load_default="",
        metadata={"description": "Job posting description"},
    )

    resume_url = fields.Str(
        load_default=None,
        allow_none=True,
        metadata={"description": "URL to download the resume from AWS S3"},
    )


class QueueJobSchema(Schema):
    """
    Schema for the BullMQ job payload consumed from the Redis queue.

    When Backend-1 pushes a resume job to BullMQ, the job data follows this shape.
    Backend-2's consumer decodes and validates jobs against this schema.

    Fields:
        studentId           : Student's DB ID in Backend-1
        jobId               : Job posting ID
        fullName            : Candidate name
        email               : Candidate email
        phone               : Candidate phone (optional)
        resumeBase64        : Base64-encoded resume file bytes
        resumeMimeType      : MIME type of the resume (application/pdf etc.)
        resumeOriginalName  : Original filename uploaded by candidate
        evaluationPrompt    : AI evaluation prompt for this job
        resumeCutoffScore   : Minimum score to shortlist
    """

    studentId = fields.Str(
        required=True,
        metadata={"description": "Student's primary key in Backend-1's students table"},
    )

    jobId = fields.Str(
        required=True,
        metadata={"description": "Job posting primary key"},
    )

    fullName = fields.Str(
        required=True,
        metadata={"description": "Candidate full name"},
    )

    email = fields.Email(
        required=True,
        metadata={"description": "Candidate email address"},
    )

    phone = fields.Str(
        load_default=None,
        allow_none=True,
        metadata={"description": "Candidate phone number"},
    )

    resumeBase64 = fields.Str(
        required=True,
        metadata={"description": "Base64-encoded resume file bytes"},
    )

    resumeMimeType = fields.Str(
        required=True,
        metadata={"description": "MIME type of the resume file (e.g. application/pdf)"},
    )

    resumeOriginalName = fields.Str(
        required=True,
        metadata={"description": "Original filename of the uploaded resume"},
    )

    evaluationPrompt = fields.Str(
        load_default="",
        metadata={"description": "AI evaluation criteria for this job"},
    )

    resumeCutoffScore = fields.Int(
        load_default=0,
        validate=validate.Range(min=0, max=100),
        metadata={"description": "Minimum ATS score to shortlist (0–100)"},
    )

    jobTitle = fields.Str(
        load_default="",
        metadata={"description": "Job posting title"},
    )

    jobDescription = fields.Str(
        load_default="",
        metadata={"description": "Job posting description"},
    )
