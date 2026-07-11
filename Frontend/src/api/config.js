// Flip VITE_USE_MOCK to "false" in .env once your friend's backend is running.
export const USE_MOCK = import.meta.env.VITE_USE_MOCK !== "false";
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

export function getAuthToken() {
  return localStorage.getItem("recruitai_admin_token");
}

export function setAuthToken(token) {
  if (token) localStorage.setItem("recruitai_admin_token", token);
  else localStorage.removeItem("recruitai_admin_token");
}

export async function apiFetch(path, options = {}) {
  const token = getAuthToken();
  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      ...(options.body instanceof FormData ? {} : { "Content-Type": "application/json" }),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
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
    throw new Error(message);
  }

  if (res.status === 204) return null;
  return res.json();
}

// Lets the app show a clear "backend not reachable" banner instead of
// silently failing every request when USE_MOCK is false.
export async function checkBackendHealth() {
  if (USE_MOCK) return { ok: true, mock: true };
  try {
    const res = await fetch(`${API_BASE_URL}/health`, { method: "GET" });
    return { ok: res.ok, mock: false };
  } catch {
    return { ok: false, mock: false };
  }
}
