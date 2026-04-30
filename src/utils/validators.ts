/**
 * Cross-platform input validators. Designed to be identical on all 4 mobile apps.
 */

/** Validate YYYY-MM-DD. Returns true only for syntactically valid dates that round-trip. */
export const isValidDateString = (value: string): boolean => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const d = new Date(value + 'T00:00:00Z');
  if (Number.isNaN(d.getTime())) return false;
  // Reject overflow like 2026-13-45 → silently coerced by Date
  const [y, m, day] = value.split('-').map(Number);
  return d.getUTCFullYear() === y && d.getUTCMonth() + 1 === m && d.getUTCDate() === day;
};

/** Validate HH:MM (24-hour). */
export const isValidTimeString = (value: string): boolean => {
  if (!/^\d{2}:\d{2}$/.test(value)) return false;
  const [h, m] = value.split(':').map(Number);
  return h >= 0 && h <= 23 && m >= 0 && m <= 59;
};

/** Validate URL — accepts http(s) and rejects javascript:/data: schemes. */
export const isSafeUrl = (value: string): boolean => {
  if (!value) return false;
  const lower = value.trim().toLowerCase();
  if (lower.startsWith('javascript:') || lower.startsWith('data:') || lower.startsWith('vbscript:')) return false;
  return /^https?:\/\//.test(lower);
};

/** Bound a string to maxLen characters, trimming whitespace. */
export const sanitizeText = (value: string | undefined, maxLen = 5000): string => {
  if (!value) return '';
  const trimmed = value.trim();
  return trimmed.length > maxLen ? trimmed.slice(0, maxLen) : trimmed;
};

/** Parse non-negative number from text input. Returns null if invalid. */
export const parsePositiveNumber = (value: string): number | null => {
  const n = Number(value);
  return Number.isFinite(n) && n >= 0 ? n : null;
};
