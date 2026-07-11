/**
 * RecruitAI API client.
 *
 * Every function here is async and returns a Promise, whether it's
 * reading from the in-memory mock data (USE_MOCK=true in .env) or
 * calling the real backend (USE_MOCK=false). Pages only ever import
 * from this file — never from mock data directly — so flipping the
 * .env flag is the only change needed once the backend is ready.
 *
 * -------------------------------------------------------------------
 * EXPECTED BACKEND ENDPOINTS (share this section with your backend dev)
 * -------------------------------------------------------------------
 *   GET    /jobs                          -> Job[]
 *   GET    /jobs/:job_id                  -> Job
 *   POST   /jobs                          -> Job              (admin auth)
 *   GET    /jobs/:job_id/candidates       -> Student[]         (ranked, joined with SHORTLISTED_STUDENTS, admin auth)
 *   GET    /students/:student_id          -> Student           (joined with SHORTLISTED_STUDENTS)
 *   POST   /students                      -> Student           (student auth, multipart/form-data:
 *                                                                skills, achievements, job_id, resume)
 *   POST   /students/:student_id/video    -> { ok: true }      (student auth, multipart/form-data: video)
 *   GET    /me/applications                -> Student[]         (student auth — every application this
 *                                                                account has submitted, across jobs)
 *   GET    /stats                          -> { openJobs, totalStudents, shortlistedCount, finalInterviewCount }
 *
 *   POST   /auth/admin/login               -> { token, admin }         body: { email, password }
 *   POST   /auth/student/register          -> { token, account }      body: { full_name, email, phone, password }
 *   POST   /auth/student/login             -> { token, account }      body: { email, password }
 *   GET    /health                         -> 200 OK if server is up
 * -------------------------------------------------------------------
 * NOTE FOR YOUR BACKEND DEV: the original ER diagram's STUDENTS table
 * is one row per application, not one row per person, and has no
 * password column. Candidate login needs a separate table — something
 * like STUDENT_ACCOUNTS (account_id PK, full_name, email UNIQUE, phone,
 * password_hash) — with each STUDENTS application row linking back to
 * it (e.g. STUDENTS.account_id -> STUDENT_ACCOUNTS.account_id). Hash
 * passwords with bcrypt or similar; never store them in plain text.
 * -------------------------------------------------------------------
 */

import { USE_MOCK, apiFetch, setAuthToken, getAuthToken } from "./config";

// ---- In-memory mock data (used only when USE_MOCK=true) ----
const admins = [
  { admin_id: "ADM-001", full_name: "Priya Nair", email: "priya.nair@company.com",
    role: "Recruiter", department: "Talent Acquisition", phone: "+91 90000 11111",
    account_status: "active" }
];

// Candidate login accounts — separate from the per-application STUDENTS rows below.
let studentAccounts = [
  { account_id: "ACC-9001", full_name: "Ananya Sharma", email: "ananya.sharma@email.com",
    phone: "+91 90000 22201", password: "demo1234" }
];

let jobs = [
  { job_id: "JOB-1001", job_title: "Product Designer",
    job_description: "Own end-to-end design for the candidate-facing product, from research to polished UI. You'll work closely with the founding engineering team and ship weekly.",
    expected_ctc: "₹18–24 LPA", job_location: "Bengaluru (Remote)", employment_type: "Full-time",
    openings: 2, application_start_date: "2026-07-01", application_end_date: "2026-07-20",
    job_status: "open",
    evaluation_prompt: "Assess portfolio strength, design systems thinking, and communication clarity in the video intro.",
    email_template: "default_evaluation_invite", created_by: "ADM-001" },

  { job_id: "JOB-1002", job_title: "Backend Engineer",
    job_description: "Build and scale the services powering resume screening and candidate ranking. Node.js and PostgreSQL experience preferred.",
    expected_ctc: "₹15–22 LPA", job_location: "Bengaluru (Hybrid)", employment_type: "Full-time",
    openings: 3, application_start_date: "2026-07-05", application_end_date: "2026-07-25",
    job_status: "open",
    evaluation_prompt: "Assess system design fundamentals and API design judgement.",
    email_template: "default_evaluation_invite", created_by: "ADM-001" },

  { job_id: "JOB-1003", job_title: "AI/ML Engineer",
    job_description: "Improve the scoring models behind resume, video and aptitude evaluation. Python and LLM tooling experience required.",
    expected_ctc: "₹20–28 LPA", job_location: "Remote", employment_type: "Full-time",
    openings: 1, application_start_date: "2026-07-10", application_end_date: "2026-08-02",
    job_status: "open",
    evaluation_prompt: "Assess ML fundamentals, prompt/LLM tooling experience, and applied reasoning.",
    email_template: "default_evaluation_invite", created_by: "ADM-001" },

  { job_id: "JOB-1004", job_title: "HR Operations Associate",
    job_description: "Support recruiters running the day-to-day hiring pipeline — job postings, candidate communication, and interview scheduling.",
    expected_ctc: "₹6–9 LPA", job_location: "Gurugram (On-site)", employment_type: "Full-time",
    openings: 1, application_start_date: "2026-07-12", application_end_date: "2026-08-10",
    job_status: "open",
    evaluation_prompt: "Assess organization, written communication, and attention to detail.",
    email_template: "default_evaluation_invite", created_by: "ADM-001" }
];

let students = [
  { student_id: "STU-2001", account_id: "ACC-9001", full_name: "Ananya Sharma", email: "ananya.sharma@email.com",
    phone: "+91 90000 22201", job_id: "JOB-1001", resume_url: "/resumes/ananya_sharma.pdf",
    skills: "Figma, Design Systems, User Research", achievements: "Led redesign for a 200k-user SaaS product",
    resume_score: 92, application_status: "shortlisted" },

  { student_id: "STU-2002", account_id: null, full_name: "Rohan Verma", email: "rohan.verma@email.com",
    phone: "+91 90000 22202", job_id: "JOB-1001", resume_url: "/resumes/rohan_verma.pdf",
    skills: "Interaction Design, Prototyping, Design Systems", achievements: "2x Awwwards nominee",
    resume_score: 89, application_status: "shortlisted" },

  { student_id: "STU-2003", account_id: null, full_name: "Meera Iyer", email: "meera.iyer@email.com",
    phone: "+91 90000 22203", job_id: "JOB-1001", resume_url: "/resumes/meera_iyer.pdf",
    skills: "UX Research, Usability Testing, Figma", achievements: "Published UX research at CHI workshop",
    resume_score: 87, application_status: "shortlisted" },

  { student_id: "STU-2004", account_id: null, full_name: "Kabir Malhotra", email: "kabir.malhotra@email.com",
    phone: "+91 90000 22204", job_id: "JOB-1001", resume_url: "/resumes/kabir_malhotra.pdf",
    skills: "Visual Design, Branding, Figma", achievements: "Freelance design lead for 3 seed-stage startups",
    resume_score: 84, application_status: "shortlisted" },

  { student_id: "STU-2005", account_id: null, full_name: "Sara Thomas", email: "sara.thomas@email.com",
    phone: "+91 90000 22205", job_id: "JOB-1001", resume_url: "/resumes/sara_thomas.pdf",
    skills: "Visual Design, Illustration", achievements: "Design intern at a Series B fintech",
    resume_score: 80, application_status: "shortlisted" },

  { student_id: "STU-2006", account_id: null, full_name: "Aditya Rao", email: "aditya.rao@email.com",
    phone: "+91 90000 22206", job_id: "JOB-1001", resume_url: "/resumes/aditya_rao.pdf",
    skills: "Graphic Design", achievements: "", resume_score: 58, application_status: "rejected" }
];

let shortlistedStudents = [
  { shortlisted_id: "SL-3001", student_id: "STU-2001", video_score: 88, aptitude_score: 90,
    final_score: 90, recommendation: "Strong hire — invite to final interview", current_stage: "final_interview" },

  { shortlisted_id: "SL-3002", student_id: "STU-2002", video_score: 85, aptitude_score: 83,
    final_score: 86, recommendation: "Hire — invite to final interview", current_stage: "final_interview" },

  { shortlisted_id: "SL-3003", student_id: "STU-2003", video_score: 80, aptitude_score: 88,
    final_score: 85, recommendation: "Hire — invite to final interview", current_stage: "final_interview" },

  { shortlisted_id: "SL-3004", student_id: "STU-2004", video_score: 79, aptitude_score: 81,
    final_score: 81, recommendation: "Waitlist — competitive but ranked below cutoff", current_stage: "waitlisted" },

  { shortlisted_id: "SL-3005", student_id: "STU-2005", video_score: null, aptitude_score: null,
    final_score: null, recommendation: "Pending — video and aptitude stages not yet completed", current_stage: "awaiting_video" }
];

const delay = (ms = 150) => new Promise((resolve) => setTimeout(resolve, ms));

function rankStudents(job_id) {
  return students
    .filter((s) => s.job_id === job_id && s.application_status === "shortlisted")
    .map((s) => {
      const sl = shortlistedStudents.find((x) => x.student_id === s.student_id) || {};
      return { ...s, ...sl };
    })
    .sort((a, b) => (b.final_score || 0) - (a.final_score || 0))
    .map((s, i) => ({ ...s, rank: i + 1 }));
}

// ---- Reads ----

// ---- Reads ----

export async function getJobs() {
  if (USE_MOCK) { await delay(); return [...jobs]; }
  const res = await apiFetch("/jobs");
  return res.data;
}

export async function getJob(job_id) {
  if (USE_MOCK) { await delay(); return jobs.find((j) => j.job_id === job_id) || null; }
  const res = await apiFetch(`/jobs/${job_id}`);
  return res.data;
}

export async function getRankedStudents(job_id) {
  if (USE_MOCK) { await delay(); return rankStudents(job_id); }
  const res = await apiFetch(`/jobs/${job_id}/candidates`, {}, "admin");
  return res.data;
}

export async function getStudentDetail(student_id) {
  if (USE_MOCK) {
    await delay();
    const s = students.find((x) => x.student_id === student_id);
    if (!s) return null;
    const sl = shortlistedStudents.find((x) => x.student_id === student_id) || {};
    return { ...s, ...sl };
  }
  const res = await apiFetch(`/students/${student_id}`, {}, "admin");
  return res.data;
}

export async function getStats() {
  if (USE_MOCK) {
    await delay();
    return {
      openJobs: jobs.filter((j) => j.job_status === "open").length,
      totalStudents: students.length,
      shortlistedCount: shortlistedStudents.length,
      finalInterviewCount: shortlistedStudents.filter((s) => s.current_stage === "final_interview").length,
    };
  }
  const res = await apiFetch("/stats", {}, "admin");
  return res.data;
}

// Every application submitted by the currently logged-in candidate.
export async function getMyApplications() {
  if (USE_MOCK) {
    await delay();
    const token = getAuthToken("student");
    if (!token) return [];
    const accountId = token.replace("mock-student-token-", "");
    return students
      .filter((s) => s.account_id === accountId)
      .map((s) => {
        const sl = shortlistedStudents.find((x) => x.student_id === s.student_id) || {};
        const job = jobs.find((j) => j.job_id === s.job_id);
        return { ...s, ...sl, job_title: job?.job_title };
      });
  }
  const res = await apiFetch("/me/applications", {}, "student");
  return res.data;
}

// ---- Writes ----

export async function createJob(jobData) {
  if (USE_MOCK) {
    await delay();
    const newJob = { job_id: `JOB-${1000 + jobs.length + 1}`, job_status: "open", created_by: "ADM-001", ...jobData };
    jobs = [...jobs, newJob];
    return newJob;
  }
  const res = await apiFetch("/jobs", { method: "POST", body: JSON.stringify(jobData) }, "admin");
  return res.data;
}

// formFields: { job_id } — name/email/phone come from the logged-in account
// resumeFile: File object from <input type="file">
export async function submitApplication(formFields, resumeFile, account) {
  if (USE_MOCK) {
    await delay(300);
    const newStudent = {
      student_id: `STU-${2000 + students.length + 1}`,
      account_id: account?.account_id || null,
      full_name: account?.full_name,
      email: account?.email,
      phone: account?.phone,
      application_status: "under_review",
      resume_score: null,
      resume_url: resumeFile ? `/resumes/${resumeFile.name}` : null,
      ...formFields,
    };
    students = [...students, newStudent];
    return newStudent;
  }
  const body = new FormData();
  body.append("full_name", formFields.full_name || account?.full_name || "");
  body.append("email", formFields.email || account?.email || "");
  body.append("phone", formFields.phone || account?.phone || "");
  if (resumeFile) body.append("resume", resumeFile);
  const res = await apiFetch(`/students/apply/${formFields.job_id}`, { method: "POST", body }, "student");
  return res.data;
}

// videoBlob: Blob from MediaRecorder
export async function uploadEvaluationVideo(student_id, videoBlob) {
  if (USE_MOCK) {
    await delay(300);
    return { ok: true };
  }
  const body = new FormData();
  body.append("video", videoBlob, `${student_id}_intro.webm`);
  const res = await apiFetch(`/students/${student_id}/video`, { method: "POST", body }, "student");
  return res;
}

// ---- Admin auth ----

export async function adminLogin(email, password) {
  if (USE_MOCK) {
    await delay(200);
    const admin = admins.find((a) => a.email === email);
    if (!admin) throw new Error("No admin account with that email.");
    const token = "mock-admin-token-" + admin.admin_id;
    setAuthToken("admin", token);
    localStorage.setItem("recruitai_admin_user", JSON.stringify(admin));
    return { token, admin };
  }
  const result = await apiFetch("/auth/admin/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
  // Since cookie auth is used, token is in cookie. Store admin user data.
  const admin = result.data.admin;
  localStorage.setItem("recruitai_admin_user", JSON.stringify(admin));
  setAuthToken("admin", "session-active"); // Flag to satisfy frontend token check
  return { admin };
}

export function adminLogout() {
  localStorage.removeItem("recruitai_admin_user");
  setAuthToken("admin", null);
  if (!USE_MOCK) {
    apiFetch("/auth/admin/logout", { method: "POST" }, "admin").catch(() => {});
  }
}

export async function getAdminMe() {
  if (USE_MOCK) {
    return admins[0];
  }
  const result = await apiFetch("/auth/admin/me", {}, "admin");
  const admin = result.data.admin;
  localStorage.setItem("recruitai_admin_user", JSON.stringify(admin));
  return admin;
}

export function getStoredAdmin() {
  if (USE_MOCK) return admins[0];
  const adminStr = localStorage.getItem("recruitai_admin_user");
  return adminStr ? JSON.parse(adminStr) : null;
}

// ---- Candidate auth ----

export async function studentRegister({ full_name, email, phone, password }) {
  if (USE_MOCK) {
    await delay(250);
    if (studentAccounts.some((a) => a.email.toLowerCase() === email.toLowerCase())) {
      throw new Error("An account with this email already exists. Try signing in instead.");
    }
    const account = { account_id: `ACC-${9000 + studentAccounts.length + 1}`, full_name, email, phone, password };
    studentAccounts = [...studentAccounts, account];
    const token = "mock-student-token-" + account.account_id;
    setAuthToken("student", token);
    return { token, account };
  }
  // Register the user — the register endpoint does NOT issue a cookie.
  await apiFetch("/auth/user/register", {
    method: "POST",
    body: JSON.stringify({ full_name, email, phone, password }),
  });
  // Immediately log in to get the JWT cookie + persist session in localStorage.
  return studentLogin(email, password);
}

export async function studentLogin(email, password) {
  if (USE_MOCK) {
    await delay(200);
    const account = studentAccounts.find((a) => a.email.toLowerCase() === email.toLowerCase());
    if (!account || account.password !== password) {
      throw new Error("Incorrect email or password.");
    }
    const token = "mock-student-token-" + account.account_id;
    setAuthToken("student", token);
    return { token, account };
  }
  const result = await apiFetch("/auth/user/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
  const user = result.data.user;
  const account = { ...user, account_id: user.user_id };
  localStorage.setItem("recruitai_student_user", JSON.stringify(account));
  setAuthToken("student", "session-active"); // Flag to satisfy frontend check
  return { account };
}

export function studentLogout() {
  localStorage.removeItem("recruitai_student_user");
  setAuthToken("student", null);
  if (!USE_MOCK) {
    apiFetch("/auth/user/logout", { method: "POST" }, "student").catch(() => {});
  }
}

export async function getStudentMe() {
  if (USE_MOCK) {
    return getStoredStudentAccount();
  }
  const result = await apiFetch("/auth/user/me", {}, "student");
  const user = result.data.user;
  const account = { ...user, account_id: user.user_id };
  localStorage.setItem("recruitai_student_user", JSON.stringify(account));
  return account;
}

export function getStoredStudentAccount() {
  if (USE_MOCK) {
    const token = getAuthToken("student");
    if (!token) return null;
    const accountId = token.replace("mock-student-token-", "");
    return studentAccounts.find((a) => a.account_id === accountId) || null;
  }
  const userStr = localStorage.getItem("recruitai_student_user");
  return userStr ? JSON.parse(userStr) : null;
}

// ---- Employee management (Super Admin) ----

export async function getEmployees() {
  if (USE_MOCK) { await delay(); return []; }
  const res = await apiFetch("/employees", {}, "admin");
  return res.data;
}

export async function createEmployee(data) {
  if (USE_MOCK) { await delay(); return { employee: data, tempPassword: "TempPass@123" }; }
  const res = await apiFetch("/employees", { method: "POST", body: JSON.stringify(data) }, "admin");
  return res.data; // { employee, tempPassword }
}

export async function changeAdminPassword({ current_password, new_password }) {
  if (USE_MOCK) { await delay(); return { success: true }; }
  const res = await apiFetch("/employees/change-password", {
    method: "PATCH",
    body: JSON.stringify({ current_password, new_password }),
  }, "admin");
  return res;
}

export async function stopShortlisting(job_id) {
  if (USE_MOCK) {
    await delay();
    const job = jobs.find((j) => j.job_id === job_id);
    if (job) job.job_status = "Shortlisting Closed";
    return job;
  }
  const res = await apiFetch(`/jobs/${job_id}/stop-shortlisting`, { method: "PATCH" }, "admin");
  return res.data;
}

export const STAGE_LABEL = {
  final_interview: { cls: "invited", label: "Final interview" },
  waitlisted: { cls: "wait", label: "Waitlist" },
  awaiting_video: { cls: "review", label: "Awaiting video" },
  rejected: { cls: "review", label: "Rejected" },
  under_review: { cls: "review", label: "Under review" },
  Applied: { cls: "review", label: "Applied" },
  Shortlisted: { cls: "invited", label: "Shortlisted" },
  Rejected: { cls: "review", label: "Rejected" },
  Hired: { cls: "invited", label: "Hired" },
};
