/**
 * RecruitAI API client.
 *
 * Calls the real backend (USE_MOCK has been removed).
 */

import { apiFetch, setAuthToken } from "./config";

// ---- Reads ----

export async function getJobs() {
  const res = await apiFetch("/jobs");
  return res.data;
}

export async function getJob(job_id) {
  const res = await apiFetch(`/jobs/${job_id}`);
  return res.data;
}

export async function getRankedStudents(job_id) {
  const res = await apiFetch(`/jobs/${job_id}/candidates`, {}, "admin");
  return res.data;
}

export async function getStudentDetail(student_id) {
  const res = await apiFetch(`/students/${student_id}`, {}, "admin");
  return res.data;
}

export async function getStats() {
  const res = await apiFetch("/stats", {}, "admin");
  return res.data;
}

export async function getMyApplications() {
  const res = await apiFetch("/me/applications", {}, "student");
  return res.data;
}

// ---- Writes ----

export async function createJob(jobData) {
  const res = await apiFetch("/jobs", { method: "POST", body: JSON.stringify(jobData) }, "admin");
  return res.data;
}

export async function submitApplication(formFields, resumeFile, account) {
  const body = new FormData();
  body.append("full_name", formFields.full_name || account?.full_name || "");
  body.append("email", formFields.email || account?.email || "");
  body.append("phone", formFields.phone || account?.phone || "");
  if (resumeFile) body.append("resume", resumeFile);
  const res = await apiFetch(`/students/apply/${formFields.job_id}`, { method: "POST", body }, "student");
  return res.data;
}

export async function uploadEvaluationVideo(student_id, videoBlob) {
  const body = new FormData();
  body.append("video", videoBlob, `${student_id}_intro.webm`);
  const res = await apiFetch(`/students/${student_id}/video`, { method: "POST", body }, "student");
  return res;
}

// ---- Admin auth ----

export async function adminLogin(email, password) {
  const result = await apiFetch("/auth/admin/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
  const admin = result.data.admin;
  localStorage.setItem("recruitai_admin_user", JSON.stringify(admin));
  setAuthToken("admin", "session-active"); 
  return { admin };
}

export function adminLogout() {
  localStorage.removeItem("recruitai_admin_user");
  setAuthToken("admin", null);
  apiFetch("/auth/admin/logout", { method: "POST" }, "admin").catch(() => {});
}

export async function getAdminMe() {
  const result = await apiFetch("/auth/admin/me", {}, "admin");
  const admin = result.data.admin;
  localStorage.setItem("recruitai_admin_user", JSON.stringify(admin));
  return admin;
}

export function getStoredAdmin() {
  const adminStr = localStorage.getItem("recruitai_admin_user");
  return adminStr ? JSON.parse(adminStr) : null;
}

// ---- Candidate auth ----

export async function studentRegister({ full_name, email, phone, password }) {
  await apiFetch("/auth/user/register", {
    method: "POST",
    body: JSON.stringify({ full_name, email, phone, password }),
  });
  return studentLogin(email, password);
}

export async function studentLogin(email, password) {
  const result = await apiFetch("/auth/user/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
  const user = result.data.user;
  const account = { ...user, account_id: user.user_id };
  localStorage.setItem("recruitai_student_user", JSON.stringify(account));
  setAuthToken("student", "session-active");
  return { account };
}

export function studentLogout() {
  localStorage.removeItem("recruitai_student_user");
  setAuthToken("student", null);
  apiFetch("/auth/user/logout", { method: "POST" }, "student").catch(() => {});
}

export async function getStudentMe() {
  const result = await apiFetch("/auth/user/me", {}, "student");
  const user = result.data.user;
  const account = { ...user, account_id: user.user_id };
  localStorage.setItem("recruitai_student_user", JSON.stringify(account));
  return account;
}

export function getStoredStudentAccount() {
  const userStr = localStorage.getItem("recruitai_student_user");
  return userStr ? JSON.parse(userStr) : null;
}

// ---- Employee management (Super Admin) ----

export async function getEmployees() {
  const res = await apiFetch("/employees", {}, "admin");
  return res.data;
}

export async function createEmployee(data) {
  const res = await apiFetch("/employees", { method: "POST", body: JSON.stringify(data) }, "admin");
  return res.data;
}

export async function changeAdminPassword({ current_password, new_password }) {
  const res = await apiFetch("/employees/change-password", {
    method: "PATCH",
    body: JSON.stringify({ current_password, new_password }),
  }, "admin");
  return res;
}

export async function stopShortlisting(job_id) {
  const res = await apiFetch(`/jobs/${job_id}/stop-shortlisting`, { method: "PATCH" }, "admin");
  return res.data;
}

export async function deleteJob(job_id) {
  const res = await apiFetch(`/jobs/${job_id}`, { method: "DELETE" }, "admin");
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

export async function startEvaluation(job_id) {
  const res = await apiFetch(`/jobs/${job_id}/start-evaluation`, { method: "PATCH" }, "admin");
  return res.data;
}
