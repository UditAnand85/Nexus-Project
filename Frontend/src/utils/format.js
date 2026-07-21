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
  const isPdf = file.type === "application/pdf" || (file.name && file.name.toLowerCase().endsWith(".pdf"));
  if (!isPdf) return "Resume must be a PDF file.";
  if (file.size > 5 * 1024 * 1024) return "File is larger than 5MB.";
  return null;
}

export function validatePassword(pw) {
  return typeof pw === "string" && pw.length >= 6;
}

export function validateEmail(email) {
  if (!email) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && email.length <= 30;
}

export function validatePhone(phone) {
  if (!phone) return false;
  const digitsOnly = phone.replace(/\D/g, "");
  return digitsOnly.length >= 10 && digitsOnly.length <= 20;
}
