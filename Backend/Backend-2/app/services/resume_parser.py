"""
Resume Parser Service
=====================
Responsible for extracting structured information from uploaded resume files.

Planned Tech Stack:
    - LangChain + Google Gemini API for NLP-based extraction
    - PyPDF2 for PDF text extraction
    - python-docx for DOCX text extraction

Data Flow:
    resume_file (PDF/DOC/DOCX)
        → extract_text_from_pdf() or extract_text_from_docx()
        → parse_resume() calls Gemini API via LangChain
        → returns structured dict with skills, experience, projects, education

NOTE: All function bodies are intentionally left empty.
      AI logic will be implemented in a future phase.
"""


def parse_resume(resume_file, evaluation_prompt: str) -> dict:
    """
    Parse a resume file and extract structured information using Gemini AI.

    Args:
        resume_file: File object (PDF/DOC/DOCX) from Flask request.files
        evaluation_prompt (str): Job-specific evaluation criteria from admin

    Returns:
        dict: {
            "skills": list[dict],       # [{"name": "Python", "level": "Advanced"}]
            "experience": list[dict],   # [{"company": ..., "role": ..., "duration": ..., "description": ...}]
            "projects": list[dict],     # [{"name": ..., "description": ..., "technologies": [...]}]
            "education": list[dict],    # [{"institution": ..., "degree": ..., "year": ...}]
            "summary": str,             # Candidate summary
            "raw_text": str             # Full extracted text
        }

    Raises:
        ValueError: If file type is unsupported
        RuntimeError: If AI parsing fails
    """
    pass


def extract_text_from_pdf(file_bytes: bytes) -> str:
    """
    Extract raw text from a PDF file using PyPDF2.

    Args:
        file_bytes (bytes): Raw bytes of the PDF file

    Returns:
        str: Extracted text content (multi-page)

    Raises:
        RuntimeError: If PDF parsing fails
    """
    pass


def extract_text_from_docx(file_bytes: bytes) -> str:
    """
    Extract raw text from a DOCX file using python-docx.

    Args:
        file_bytes (bytes): Raw bytes of the DOCX file

    Returns:
        str: Extracted text content

    Raises:
        RuntimeError: If DOCX parsing fails
    """
    pass


def detect_file_type(mime_type: str) -> str:
    """
    Detect the resume file type from MIME type.

    Args:
        mime_type (str): File MIME type

    Returns:
        str: "pdf", "doc", or "docx"

    Raises:
        ValueError: If file type is not supported
    """
    pass
