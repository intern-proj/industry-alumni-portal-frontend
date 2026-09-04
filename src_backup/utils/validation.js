/**
 * Comprehensive input validation utilities for authentication and account creation.
 */

export function validateEmail(email) {
  if (!email || typeof email !== 'string') return false;
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return emailRegex.test(email.trim());
}

export function evaluatePasswordStrength(password = '') {
  const pwd = String(password || '');
  
  const rules = {
    length: pwd.length >= 8,
    uppercase: /[A-Z]/.test(pwd),
    lowercase: /[a-z]/.test(pwd),
    number: /[0-9]/.test(pwd),
    special: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~`]/.test(pwd),
  };

  const passedCount = Object.values(rules).filter(Boolean).length;

  let score = 0;
  let level = 'empty';
  let label = 'Too Short';
  let color = 'bg-slate-300 dark:bg-slate-700';
  let textColor = 'text-slate-400';

  if (pwd.length === 0) {
    return { score: 0, level: 'empty', label: 'Enter password', color, textColor, rules, isValid: false };
  }

  score = Math.min(100, Math.round((passedCount / 5) * 100));

  if (passedCount <= 2 || pwd.length < 8) {
    level = 'weak';
    label = 'Weak';
    color = 'bg-rose-500';
    textColor = 'text-rose-600 dark:text-rose-400';
  } else if (passedCount === 3) {
    level = 'fair';
    label = 'Fair';
    color = 'bg-amber-500';
    textColor = 'text-amber-600 dark:text-amber-400';
  } else if (passedCount === 4) {
    level = 'good';
    label = 'Good';
    color = 'bg-sky-500';
    textColor = 'text-sky-600 dark:text-sky-400';
  } else if (passedCount === 5) {
    level = 'strong';
    label = 'Very Strong';
    color = 'bg-emerald-500';
    textColor = 'text-emerald-600 dark:text-emerald-400';
  }

  const isValid = rules.length && rules.uppercase && rules.lowercase && rules.number && rules.special;

  return {
    score,
    level,
    label,
    color,
    textColor,
    rules,
    isValid,
  };
}

export function validatePassword(password) {
  return evaluatePasswordStrength(password).isValid;
}
