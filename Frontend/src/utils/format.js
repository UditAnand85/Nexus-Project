export function formatDate(iso) {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("en-IN", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  });
}

export function scoreOrDash(v) {
  return v !== null && v !== undefined ? v : "—";
}

export function validateResumeFile(file) {
  if (!file) return "Please choose a file.";
  if (file.type !== "application/pdf") return "Resume must be a PDF file.";
  if (file.size > 5 * 1024 * 1024) return "File is larger than 5MB.";
  return null;
}

export function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function validatePhone(phone) {
  return /^[+\d][\d\s-]{7,}$/.test(phone);
}
