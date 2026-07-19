// Flip VITE_USE_MOCK to "false" in .env once your friend's backend is running.
export const USE_MOCK = import.meta.env.VITE_USE_MOCK !== "false";
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "/api/v1";

const TOKEN_KEYS = {
  admin: "recruitai_admin_token",
  student: "recruitai_student_token",
};

export function getAuthToken(role = "admin") {
  return localStorage.getItem(TOKEN_KEYS[role]);
}

export function setAuthToken(role, token) {
  if (token) localStorage.setItem(TOKEN_KEYS[role], token);
  else localStorage.removeItem(TOKEN_KEYS[role]);
}

// Which token to attach depends on which kind of request this is.
// Admin routes (jobs CUD, candidate review) send the admin token.
// Student routes (my applications, submitting one) send the student token.
export async function apiFetch(path, options = {}, tokenRole = "admin") {
  // Ensure options is never null
  const safeOptions = options || {};
  const token = getAuthToken(tokenRole);
  const targetUrl = `${API_BASE_URL}${path}`;


  const res = await fetch(targetUrl, {
    ...safeOptions,
    credentials: "include",
    headers: {
      ...(safeOptions.body instanceof FormData ? {} : { "Content-Type": "application/json" }),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...safeOptions.headers,
    },
  });


  if (!res.ok) {
    let message = `Request failed (${res.status})`;
    try {
      const body = await res.json();
      if (body?.message) message = body.message;
    } catch {
      // response wasn't JSON — keep the default message
    }
    
    console.error(`[apiFetch Response Error] URL: ${targetUrl} Error Message: ${message}`);
    throw new Error(message);
  }

  if (res.status === 204) return null;
  return res.json();
}

// Lets the app show a clear "backend not reachable" banner instead of
// silently failing every request when USE_MOCK is false.
// /health is proxied via Vite to the EC2 backend (see vite.config.js)
export const BACKEND_ROOT_URL = import.meta.env.VITE_API_BASE_URL
  ? import.meta.env.VITE_API_BASE_URL.replace(/\/api\/v1\/?$/, "")
  : "";

export async function checkBackendHealth() {
  if (USE_MOCK) return { ok: true, mock: true };
  try {
    const res = await fetch(`${BACKEND_ROOT_URL}/health`, { method: "GET" });
    return { ok: res.ok, mock: false };
  } catch {
    return { ok: false, mock: false };
  }
}
