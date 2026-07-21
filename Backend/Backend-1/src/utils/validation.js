/**
 * Validates if the given string is a properly formatted email.
 * @param {string} email
 * @returns {boolean}
 */
export function validateEmail(email) {
  if (!email || typeof email !== 'string') return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= 30;
}

/**
 * Validates if the given phone number contains a valid length of digits.
 * Standard limit: 10 to 20 digits.
 * @param {string} phone
 * @returns {boolean}
 */
export function validatePhone(phone) {
  if (!phone || typeof phone !== 'string') return false;
  
  // Strip non-digit characters to count the actual numbers
  const digitsOnly = phone.replace(/\D/g, '');
  
  // Must be between 10 and 20 numbers (as per requirements/DB schema limit of 20)
  return digitsOnly.length >= 10 && digitsOnly.length <= 20;
}
