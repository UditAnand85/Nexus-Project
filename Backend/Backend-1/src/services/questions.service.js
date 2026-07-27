import { GoogleGenAI } from '@google/genai';
import { db } from '../config/db.js';
import { technicalQuestions, codingQuestions } from '../db/schema/index.js';
import { eq } from 'drizzle-orm';
import { env } from '../config/env.js';

// ─── Technical-job keyword classifier ────────────────────────────────────────

const TECHNICAL_KEYWORDS = [
  // Engineering & Dev
  'engineer', 'developer', 'programmer', 'architect', 'devops', 'sre',
  'backend', 'frontend', 'full-stack', 'fullstack', 'software', 'qa',
  'data', 'machine learning', 'ai ', 'artificial intelligence', 'cloud',
  'security', 'network', 'database', 'dba', 'embedded', 'firmware',
  'android', 'ios', 'mobile', 'web', 'systems', 'infrastructure',
  'analyst', 'scientist', 'researcher', 'blockchain', 'cyber', 'it ',
  'testing', 'automation', 'nlp', 'computer vision', 'robotics',
];

/**
 * Classifies a job as Technical or Non-Technical based on title/description.
 * @param {string} title
 * @param {string} description
 * @returns {boolean} true if technical
 */
function isTechnicalJob(title, description) {
  const combined = `${title} ${description}`.toLowerCase();
  return TECHNICAL_KEYWORDS.some((kw) => combined.includes(kw));
}

// ─── Gemini Prompt Builder ─────────────────────────────────────────────────

function buildPrompt(jobTitle, jobDescription, isTechnical) {
  if (isTechnical) {
    return `
You are an expert technical interviewer. Generate exactly 30 multiple-choice questions (MCQs) for a job interview assessment for the role: "${jobTitle}".

The 30 questions MUST be split as follows:
- 15 questions: Role-specific technical questions based on the job description below.
- 15 questions: Core Computer Science fundamentals, evenly distributed across these 5 topics (3 questions each):
  1. OOP (Object-Oriented Programming concepts, design patterns)
  2. DBMS (SQL, normalization, transactions, indexing)
  3. CN (Computer Networks, OSI model, TCP/IP, HTTP, DNS)
  4. OS (Operating Systems, process scheduling, memory management, deadlocks)
  5. DSA (Data Structures & Algorithms, time complexity, sorting, trees, graphs)

Job Description:
${jobDescription}

RESPOND ONLY WITH VALID JSON — no markdown, no explanation. The JSON must be an array of exactly 30 objects, each with these exact keys:
[
  {
    "category": "Role-Specific | OOP | DBMS | CN | OS | DSA",
    "question": "...",
    "option_a": "...",
    "option_b": "...",
    "option_c": "...",
    "option_d": "...",
    "correct_answer": "A | B | C | D"
  }
]
`.trim();
  } else {
    return `
You are an expert hiring assessment designer. Generate exactly 30 multiple-choice questions (MCQs) for a job interview assessment for the role: "${jobTitle}".

The 30 questions MUST be split as follows:
- 20 questions: Domain-specific knowledge questions relevant to this role and its job description.
- 10 questions: Verbal reasoning, reading comprehension, or logical deduction questions that are relevant to professionals in this field.

Job Description:
${jobDescription}

RESPOND ONLY WITH VALID JSON — no markdown, no explanation. The JSON must be an array of exactly 30 objects, each with these exact keys:
[
  {
    "category": "Domain | Verbal-Reasoning",
    "question": "...",
    "option_a": "...",
    "option_b": "...",
    "option_c": "...",
    "option_d": "...",
    "correct_answer": "A | B | C | D"
  }
]
`.trim();
  }
}

// ─── Main Generation Function ─────────────────────────────────────────────────

/**
 * Generates 30 technical/domain MCQs for a given job using Gemini API,
 * then inserts them into the technical_questions table.
 *
 * Called fire-and-forget from createJob() — any errors are logged but do NOT
 * fail the job creation response.
 *
 * @param {string} jobId
 * @param {string} jobTitle
 * @param {string} jobDescription
 */
export async function generateTechnicalQuestions(jobId, jobTitle, jobDescription) {
  if (!env.GEMINI_API_KEY && !env.GROQ_API_KEY) {
    console.warn('[Questions] No AI API keys set — skipping question generation.');
    return;
  }

  try {
    const technical = isTechnicalJob(jobTitle, jobDescription);
    console.log(
      `[Questions] Job "${jobTitle}" classified as ${technical ? 'TECHNICAL' : 'NON-TECHNICAL'}. Generating 30 questions...`
    );

    const prompt = buildPrompt(jobTitle, jobDescription, technical);

    let rawText = '';

    if (env.GROQ_API_KEY) {
      console.log('[Questions] Using Groq API for generation...');
      const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${env.GROQ_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.7
        })
      });

      if (!groqRes.ok) {
        const errText = await groqRes.text();
        throw new Error(`Groq API Error: ${errText}`);
      }
      const groqData = await groqRes.json();
      rawText = groqData.choices[0].message.content.trim();
    } else {
      console.log('[Questions] Using Gemini API for generation...');
      const ai = new GoogleGenAI({ apiKey: env.GEMINI_API_KEY });
      const result = await ai.models.generateContent({
        model: 'gemini-1.5-flash',
        contents: prompt,
      });
      rawText = result.text.trim();
    }

    // Strip markdown code fences if wrapped in ```json ... ```
    const jsonText = rawText
      .replace(/^```(?:json)?\s*/i, '')
      .replace(/```\s*$/i, '')
      .trim();

    let questions;
    try {
      questions = JSON.parse(jsonText);
    } catch (parseErr) {
      console.error('[Questions] Failed to parse Gemini JSON response:', parseErr.message);
      console.error('[Questions] Raw response (first 500 chars):', rawText.slice(0, 500));
      return;
    }

    if (!Array.isArray(questions) || questions.length === 0) {
      console.error('[Questions] Gemini returned empty or non-array response.');
      return;
    }

    // Validate and sanitise each question before inserting
    const validQuestions = questions
      .filter(
        (q) =>
          q.question &&
          q.option_a &&
          q.option_b &&
          q.option_c &&
          q.option_d &&
          ['A', 'B', 'C', 'D'].includes((q.correct_answer || '').toUpperCase())
      )
      .map((q) => ({
        job_id: jobId,
        category: q.category || (technical ? 'Role-Specific' : 'Domain'),
        question: q.question.trim(),
        option_a: q.option_a.trim(),
        option_b: q.option_b.trim(),
        option_c: q.option_c.trim(),
        option_d: q.option_d.trim(),
        correct_answer: q.correct_answer.toUpperCase(),
      }));

    if (validQuestions.length === 0) {
      console.error('[Questions] No valid questions after validation. Skipping insert.');
      return;
    }

    await db.insert(technicalQuestions).values(validQuestions);

    console.log(
      `[Questions] ✅ Inserted ${validQuestions.length} questions for job ${jobId} ("${jobTitle}")`
    );
  } catch (err) {
    // Fire-and-forget: log but never throw — job creation must succeed regardless
    console.error(`[Questions] ❌ Error generating questions for job ${jobId}:`, err.message);
  }
}

// ─── Delete Job Questions ─────────────────────────────────────────────────────

/**
 * Deletes all technical questions for a given job.
 * Called during job deletion in jobs.service.js.
 * Aptitude questions (global pool) are never touched.
 *
 * @param {string} jobId
 */
export async function deleteJobQuestions(jobId) {
  try {
    await db.delete(technicalQuestions).where(eq(technicalQuestions.job_id, jobId));
    console.log(`[Questions] Deleted technical questions for job ${jobId}`);
  } catch (err) {
    console.error(`[Questions] Error deleting questions for job ${jobId}:`, err.message);
  }
}

// ─── Coding Problems Generation ────────────────────────────────────────────────

/**
 * Builds the LLaMA prompt to generate 3 coding problems (Easy / Medium / Hard).
 * Each problem includes title, description, sample I/O, and a hidden test case.
 */
function buildCodingPrompt(jobTitle, jobDescription) {
  return `
You are an expert software engineering interviewer. Generate exactly 3 coding problems for a job interview for the role: "${jobTitle}".

The 3 problems MUST be:
1. An EASY problem — basic programming logic, string/array manipulation
2. A MEDIUM problem — moderate algorithmic thinking (sorting, hashing, two-pointer, etc.)
3. A HARD problem — advanced data structures or algorithms (graph, DP, backtracking, etc.)

Make the problems relevant to the job role when possible.

Job Description:
${jobDescription}

RULES:
- Each problem must be solvable with stdin/stdout (read from stdin, print to stdout)
- test_input and test_output must form a correct input/output pair (test_output should be exactly what a correct program would print to stdout for test_input, including newline characters)
- sample_input and sample_output are a simpler example for the candidate
- Keep descriptions clear and concise
- test_output must be the EXACT expected stdout string (trim trailing whitespace per line but preserve newlines between lines if multiple lines of output)

RESPOND ONLY WITH VALID JSON — no markdown, no explanation. The JSON must be an array of exactly 3 objects:
[
  {
    "title": "Problem title",
    "difficulty": "Easy",
    "description": "Full problem statement with constraints and examples explained clearly...",
    "sample_input": "sample stdin",
    "sample_output": "expected stdout for sample",
    "test_input": "hidden test stdin",
    "test_output": "exact expected stdout for hidden test",
    "language_hint": "Python, JavaScript, Java, C++"
  }
]
`.trim();
}

/**
 * Generates 3 coding problems for a job using LLaMA (via Groq) or Gemini.
 * Inserts them into the coding_questions table.
 * Called fire-and-forget from createJob() when coding_round_enabled=true.
 *
 * @param {string} jobId
 * @param {string} jobTitle
 * @param {string} jobDescription
 */
export async function generateCodingProblems(jobId, jobTitle, jobDescription) {
  if (!env.GROQ_API_KEY && !env.GEMINI_API_KEY) {
    console.warn('[CodingQuestions] No AI API keys set — skipping coding problem generation.');
    return;
  }

  try {
    console.log(`[CodingQuestions] Generating 3 coding problems for job "${jobTitle}"...`);

    const prompt = buildCodingPrompt(jobTitle, jobDescription);
    let rawText = '';

    if (env.GROQ_API_KEY) {
      console.log('[CodingQuestions] Using Groq/LLaMA for generation...');
      const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${env.GROQ_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.6,
        }),
      });

      if (!groqRes.ok) {
        const errText = await groqRes.text();
        throw new Error(`Groq API Error: ${errText}`);
      }
      const groqData = await groqRes.json();
      rawText = groqData.choices[0].message.content.trim();
    } else {
      console.log('[CodingQuestions] Using Gemini API for generation...');
      const ai = new GoogleGenAI({ apiKey: env.GEMINI_API_KEY });
      const result = await ai.models.generateContent({
        model: 'gemini-1.5-flash',
        contents: prompt,
      });
      rawText = result.text.trim();
    }

    // Strip markdown code fences if present
    const jsonText = rawText
      .replace(/^```(?:json)?\s*/i, '')
      .replace(/```\s*$/i, '')
      .trim();

    let problems;
    try {
      problems = JSON.parse(jsonText);
    } catch (parseErr) {
      console.error('[CodingQuestions] Failed to parse JSON response:', parseErr.message);
      console.error('[CodingQuestions] Raw response (first 500 chars):', rawText.slice(0, 500));
      return;
    }

    if (!Array.isArray(problems) || problems.length === 0) {
      console.error('[CodingQuestions] LLaMA returned empty or non-array response.');
      return;
    }

    // Validate and sanitise
    const valid = problems
      .filter(
        (p) =>
          p.title &&
          p.description &&
          p.sample_input !== undefined &&
          p.sample_output !== undefined &&
          p.test_input !== undefined &&
          p.test_output !== undefined
      )
      .slice(0, 3) // strictly 3 problems
      .map((p) => ({
        job_id: jobId,
        title: p.title.trim(),
        description: p.description.trim(),
        sample_input: String(p.sample_input).trim(),
        sample_output: String(p.sample_output).trim(),
        test_input: String(p.test_input).trim(),
        test_output: String(p.test_output).trim(),
        difficulty: ['Easy', 'Medium', 'Hard'].includes(p.difficulty) ? p.difficulty : 'Medium',
        language_hint: p.language_hint || 'Python, JavaScript, Java, C++',
      }));

    if (valid.length === 0) {
      console.error('[CodingQuestions] No valid problems after validation. Skipping insert.');
      return;
    }

    await db.insert(codingQuestions).values(valid);
    console.log(`[CodingQuestions] ✅ Inserted ${valid.length} coding problems for job ${jobId} ("${jobTitle}")`);
  } catch (err) {
    console.error(`[CodingQuestions] ❌ Error generating coding problems for job ${jobId}:`, err.message);
  }
}

// ─── Delete Coding Questions ───────────────────────────────────────────────────

/**
 * Deletes all coding questions for a given job.
 * Called during job deletion alongside deleteJobQuestions().
 *
 * @param {string} jobId
 */
export async function deleteJobCodingQuestions(jobId) {
  try {
    await db.delete(codingQuestions).where(eq(codingQuestions.job_id, jobId));
    console.log(`[CodingQuestions] Deleted coding questions for job ${jobId}`);
  } catch (err) {
    console.error(`[CodingQuestions] Error deleting coding questions for job ${jobId}:`, err.message);
  }
}
