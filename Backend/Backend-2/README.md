# RecruitAI — Backend-2 (AI Resume Service)

> **Flask (Python)** backend skeleton for AI-powered resume parsing and ATS scoring.
> All AI logic is pending implementation — this is a structured placeholder.

---

## Tech Stack (Planned)

| Tool | Purpose |
|------|---------|
| **Python + Flask** | HTTP server |
| **LangChain** | Gemini API integration |
| **LangGraph** | Multi-step AI processing pipeline |
| **Google Gemini API** | Resume parsing and ATS scoring |
| **Redis (BullMQ)** | Queue consumer (shared with Backend-1) |
| **PyPDF2 + python-docx** | Resume text extraction |
| **Marshmallow** | Request/response validation |

---

## Quick Start

### 1. Create Virtual Environment
```bash
cd Backend-2
python -m venv venv

# Windows
venv\Scripts\activate

# macOS/Linux
source venv/bin/activate
```

### 2. Install Dependencies
```bash
pip install -r requirements.txt
```

### 3. Configure Environment
```bash
cp .env.example .env
# Fill in: GEMINI_API_KEY, REDIS_URL, BACKEND1_URL, INTERNAL_API_KEY
```

### 4. Start Flask Server
```bash
python run.py
# Server starts at http://localhost:5001
```

### 5. Start Queue Consumer (separate terminal)
```bash
python -m app.queue.consumer
# Listens for BullMQ jobs from Backend-1
```

---

## API Endpoints

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/health` | Server health check |
| POST | `/api/v1/resume/parse` | Parse resume + calculate ATS score |
| GET | `/api/v1/resume/health` | Resume service health check |

### POST /api/v1/resume/parse

**Request** (multipart/form-data):

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | ✅ | Candidate full name |
| `email` | string | ✅ | Candidate email |
| `phone` | string | ❌ | Candidate phone |
| `job_id` | int | ✅ | Job posting ID |
| `evaluation_prompt` | string | ❌ | AI evaluation criteria |
| `resume_cutoff_score` | int | ❌ | Min score to shortlist (0–100) |
| `resume` | file | ✅ | PDF, DOC, or DOCX |

**Response** (JSON):
```json
{
  "success": true,
  "data": {
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "+91-9999999999",
    "skills": [{"name": "Python", "level": "Advanced"}],
    "experience": [{"company": "...", "role": "...", "duration": "..."}],
    "projects": [{"name": "...", "description": "...", "technologies": [...]}],
    "ats_score": 78.5,
    "is_shortlisted": true,
    "score_breakdown": {"keyword_match": 80, "skills_match": 75, ...},
    "feedback": "Strong Python background..."
  }
}
```

---

## Queue Flow

```
Backend-1 pushes job to Redis (BullMQ queue: "resume-processing")
        ↓
Backend-2 consumer picks up job
        ↓
    1. Decode base64 resume → bytes
    2. Extract text (PyPDF2 / python-docx)
    3. Parse structure via Gemini AI (LangChain)
    4. Calculate ATS score vs evaluation_prompt
        ↓
Backend-2 POSTs result to Backend-1:
    POST http://backend1/api/v1/shortlisted/result
    Header: X-Internal-Api-Key: <shared_secret>
    Body: { student_id, parsed_resume_json, resume_score }
```

---

## Project Structure

```
Backend-2/
├── app/
│   ├── __init__.py          # Flask app factory
│   ├── routes/
│   │   └── resume_routes.py # Route definitions + placeholder response
│   ├── services/
│   │   ├── resume_parser.py # EMPTY — text extraction + AI parsing
│   │   ├── ats_scorer.py    # EMPTY — ATS score calculation
│   │   └── gemini_service.py# EMPTY — Gemini API + LangGraph workflow
│   ├── schemas/
│   │   ├── request_schema.py # Input validation (Marshmallow)
│   │   └── response_schema.py# Output structure
│   └── queue/
│       └── consumer.py      # BullMQ consumer skeleton
├── config.py                # Flask configuration
├── run.py                   # Entry point
├── requirements.txt
└── .env.example
```

---

## Implementation Status

| Component | Status |
|-----------|--------|
| Flask server + routing | ✅ Done |
| Request/response schemas | ✅ Done |
| BullMQ consumer skeleton | ✅ Done (empty) |
| resume_parser functions | ⏳ Pending AI implementation |
| ats_scorer functions | ⏳ Pending AI implementation |
| gemini_service functions | ⏳ Pending AI implementation |
| Queue consumer loop | ⏳ Pending AI implementation |

---

## Environment Variables

| Variable | Description |
|----------|-------------|
| `FLASK_ENV` | development / production |
| `PORT` | Flask server port (default: 5001) |
| `GEMINI_API_KEY` | Google Gemini API key |
| `REDIS_URL` | Redis connection URL (shared with Backend-1) |
| `BACKEND1_URL` | Backend-1 URL for result callback |
| `INTERNAL_API_KEY` | Shared secret (must match Backend-1) |
