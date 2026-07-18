import io
import json
import logging
from typing import TypedDict, Optional
from PyPDF2 import PdfReader
from docx import Document
from google import genai
from langgraph.graph import StateGraph, END
from config import get_config

logger = logging.getLogger(__name__)
config = get_config()

# Initialize Gemini Client
client = None
if config.GEMINI_API_KEY:
    client = genai.Client(api_key=config.GEMINI_API_KEY)

# Initialize Groq Client
from groq import Groq
groq_client = None
if config.GROQ_API_KEY:
    groq_client = Groq(api_key=config.GROQ_API_KEY)

class ResumeState(TypedDict):
    name: str
    email: str
    phone: Optional[str]
    resume_bytes: bytes
    resume_filename: str
    job_title: str
    job_description: str
    evaluation_prompt: str
    resume_text: Optional[str]
    parsed_resume_json: Optional[str]
    resume_score: Optional[float]
    error: Optional[str]

def extract_text_node(state: ResumeState) -> dict:
    logger.info("Extracting text from resume...")
    filename = state.get("resume_filename", "").lower()
    file_bytes = state.get("resume_bytes", b"")
    
    text = ""
    try:
        if filename.endswith(".pdf"):
            reader = PdfReader(io.BytesIO(file_bytes))
            for page in reader.pages:
                page_text = page.extract_text()
                if page_text:
                    text += page_text + "\n"
        elif filename.endswith(".docx") or filename.endswith(".doc"):
            doc = Document(io.BytesIO(file_bytes))
            for para in doc.paragraphs:
                text += para.text + "\n"
        else:
            return {"error": "Unsupported file format. Only PDF and DOCX are supported."}
            
        if not text.strip():
            return {"error": "Could not extract text from the document."}
            
        return {"resume_text": text}
    except Exception as e:
        logger.error(f"Error extracting text: {e}")
        return {"error": f"Failed to extract text: {str(e)}"}

def generate_summary_node(state: ResumeState) -> dict:
    logger.info("Generating summary using Groq...")
    if state.get("error"):
        return {"error": state["error"]}
        
    text = state.get("resume_text", "")
    prompt = f"""
    You are an expert technical recruiter. Based on the following candidate resume and the job description, 
    extract a short summary in bullet points detailing the strongest points about the candidate and why we should hire them for this specific role.
    Format your response purely as a Markdown bulleted list, or plain text bullet points.
    Do NOT use JSON. Keep it concise, highlighting top skills, major achievements, and relevant experience.
    
    Job Title: {state.get("job_title", "")}
    Job Description: {state.get("job_description", "")}
    
    Candidate Resume:
    {text}
    """
    try:
        if not groq_client:
            raise ValueError("Groq API key is not configured.")
        completion = groq_client.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=[
                {"role": "user", "content": prompt}
            ],
            temperature=0.3,
        )
        response_text = completion.choices[0].message.content
        return {"parsed_resume_json": response_text.strip()}
    except Exception as e:
        logger.error(f"Error generating summary: {e}")
        return {"error": f"Summary generation failed: {str(e)}"}

def check_scores_node(state: ResumeState) -> dict:
    logger.info("Checking scores using Gemini...")
    if state.get("error"):
        return {"error": state["error"]}
        
    text = state.get("resume_text", "")
    prompt = f"""
    You are an expert ATS (Applicant Tracking System) scorer. Score the following resume out of 100 based on the following default criteria and the provided job description:
    Skills Match – 30 Marks
    Projects – 20 Marks
    Experience – 15 Marks
    Education – 10 Marks
    Certifications – 10 Marks
    Resume Quality & ATS Compatibility – 10 Marks
    Achievements & Extracurricular Activities – 5 Marks
    
    Evaluate the resume honestly and rigorously against the requirements of the job description.
    Also consider these custom evaluation criteria (if any): {state.get('evaluation_prompt', '')}
    
    Return ONLY a single number from 0 to 100 (e.g., 75.5 or 80) representing the total score. Do not include any other text or explanation.

    Job Title: {state.get("job_title", "")}
    Job Description: {state.get("job_description", "")}

    Candidate Resume:
    {text}
    """
    
    try:
        if not groq_client:
            raise ValueError("Groq API key is not configured.")
        
        completion = groq_client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {"role": "user", "content": prompt}
            ],
            temperature=0.1,
        )
        
        score_str = completion.choices[0].message.content.strip()
        import re
        match = re.search(r'\d+(\.\d+)?', score_str)
        if match:
            return {"resume_score": float(match.group())}
        else:
            return {"resume_score": 0.0}
            
    except Exception as e:
        logger.error(f"Error checking scores: {e}")
        return {"error": f"Scoring failed: {str(e)}"}

# Build the Graph — sequential: extract text → generate summary → score → END
workflow = StateGraph(ResumeState)

workflow.add_node("parse_resume", extract_text_node)
workflow.add_node("generate_summary", generate_summary_node)
workflow.add_node("check_scores", check_scores_node)

workflow.set_entry_point("parse_resume")
workflow.add_edge("parse_resume", "generate_summary")
workflow.add_edge("generate_summary", "check_scores")
workflow.add_edge("check_scores", END)

resume_agent = workflow.compile()

def process_resume_with_agent(name: str, email: str, phone: str, file_bytes: bytes, filename: str, job_title: str, job_description: str, evaluation_prompt: str) -> dict:
    """Entry point for the resume processing agent."""
    
    initial_state = ResumeState(
        name=name,
        email=email,
        phone=phone,
        resume_bytes=file_bytes,
        resume_filename=filename,
        job_title=job_title,
        job_description=job_description,
        evaluation_prompt=evaluation_prompt,
        resume_text=None,
        parsed_resume_json=None,
        resume_score=None,
        error=None
    )
    
    final_state = resume_agent.invoke(initial_state)
    return final_state
