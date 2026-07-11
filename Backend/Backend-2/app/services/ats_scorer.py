"""
ATS Scorer Service
==================
Calculates an Applicant Tracking System (ATS) score for a parsed resume
against the job's evaluation criteria.

Planned Tech Stack:
    - Google Gemini API via LangChain for semantic evaluation
    - Scores resumes on a 0–100 scale

Scoring Criteria (planned):
    - Keyword match with job description and evaluation prompt
    - Skill relevance and depth
    - Work experience alignment
    - Project relevance
    - Education match

NOTE: All function bodies are intentionally left empty.
      AI logic will be implemented in a future phase.
"""


def calculate_ats_score(parsed_resume: dict, evaluation_prompt: str, cutoff_score: int = 0) -> dict:
    """
    Calculate ATS score for a parsed resume against job criteria.

    Args:
        parsed_resume (dict): Structured resume data from resume_parser.parse_resume()
        evaluation_prompt (str): Job-specific evaluation criteria from admin
        cutoff_score (int): Minimum score required to shortlist (0–100)

    Returns:
        dict: {
            "ats_score": float,          # Overall score (0–100)
            "is_shortlisted": bool,      # True if ats_score >= cutoff_score
            "score_breakdown": {
                "keyword_match": float,  # 0–100
                "skills_match": float,   # 0–100
                "experience": float,     # 0–100
                "projects": float,       # 0–100
            },
            "feedback": str              # Brief AI evaluation summary
        }

    Raises:
        RuntimeError: If scoring fails
    """
    pass


def evaluate_skills_match(candidate_skills: list, evaluation_prompt: str) -> float:
    """
    Evaluate how well the candidate's skills align with the job requirements.

    Args:
        candidate_skills (list): Skills extracted from the resume
        evaluation_prompt (str): Job evaluation criteria

    Returns:
        float: Skills match score (0–100)
    """
    pass


def evaluate_experience_relevance(experience: list, evaluation_prompt: str) -> float:
    """
    Score the relevance of work experience to the job.

    Args:
        experience (list): Work experience entries from parsed resume
        evaluation_prompt (str): Job evaluation criteria

    Returns:
        float: Experience relevance score (0–100)
    """
    pass


def evaluate_projects_relevance(projects: list, evaluation_prompt: str) -> float:
    """
    Score the relevance of projects to the job.

    Args:
        projects (list): Project entries from parsed resume
        evaluation_prompt (str): Job evaluation criteria

    Returns:
        float: Projects relevance score (0–100)
    """
    pass
