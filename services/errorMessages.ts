/** User-facing copy for API errors returned to the frontend. */

export const INVALID_LOGIN_MESSAGE =
  'The username or password you entered is incorrect. Please try again.';

const EXACT_MESSAGES: Record<string, string> = {
  'Invalid credentials': INVALID_LOGIN_MESSAGE,
  'Invalid or expired refresh token': 'Your session has expired. Please sign in again.',
  'Invalid refresh token': 'Your session has expired. Please sign in again.',
  'Session expired. Please login again.': 'Your session has expired. Please sign in again.',
  'Session expired': 'Your session has expired. Please sign in again.',
  'Token refresh failed': 'Your session has expired. Please sign in again.',
  'User not found or inactive': 'This account is inactive or no longer exists. Please contact support.',
  'Invalid token type': 'Your session has expired. Please sign in again.',
  'Invalid token issuer': 'Your session has expired. Please sign in again.',
  'No refresh token available': 'Your session has expired. Please sign in again.',
  'Network error: Unable to connect to server':
    'Unable to reach the server. Please check your internet connection and try again.',
  'Unit registration is currently closed':
    'Unit registration is currently closed. Please try again later.',
  'Phone number is already taken':
    'This phone number is already registered. Please use a different number.',
  'Unit has been registered already':
    'This unit has already been registered.',
  'Email already registered':
    'This email is already registered. Please sign in or use a different email.',
  'You already have a pending subscription':
    'You already have a subscription awaiting payment. Please complete or cancel it first.',
};

const PYDANTIC_PATTERNS: Array<{ pattern: RegExp; message: string }> = [
  { pattern: /^field required$/i, message: 'Please fill in all required fields.' },
  { pattern: /^string should have at least (\d+) characters?$/i, message: 'Please enter a longer value.' },
  { pattern: /^string should have at most (\d+) characters?$/i, message: 'Please shorten your entry.' },
  { pattern: /^value is not a valid email address/i, message: 'Please enter a valid email address.' },
  { pattern: /^input should be a valid integer/i, message: 'Please enter a valid number.' },
  { pattern: /^input should be a valid date/i, message: 'Please enter a valid date.' },
];

const STATUS_FALLBACKS: Record<number, string> = {
  400: 'Something was wrong with your request. Please check your entries and try again.',
  401: INVALID_LOGIN_MESSAGE,
  403: 'You do not have permission to perform this action.',
  404: 'The requested item could not be found.',
  409: 'This action conflicts with existing data. Please refresh and try again.',
  422: 'Please check your entries and try again.',
  408: 'The request took too long. Please try again.',
  0: 'Unable to reach the server. Please check your internet connection and try again.',
  500: 'Something went wrong on our end. Please try again in a moment.',
};

/** Extract a message string from a FastAPI error `detail` field. */
export function parseApiErrorDetail(detail: unknown): string {
  if (typeof detail === 'string') return detail;
  if (Array.isArray(detail)) {
    return detail
      .map((err) => {
        if (typeof err === 'string') return err;
        if (err && typeof err === 'object') {
          const item = err as { msg?: string; message?: string };
          return item.msg || item.message || '';
        }
        return '';
      })
      .filter(Boolean)
      .join(', ');
  }
  if (detail && typeof detail === 'object' && 'message' in detail) {
    return String((detail as { message: unknown }).message);
  }
  return '';
}

/** Map a raw API or transport error message to user-friendly text. */
export function toUserFriendlyError(message: string, status?: number): string {
  const trimmed = message.trim();
  if (!trimmed) {
    return status !== undefined && STATUS_FALLBACKS[status]
      ? STATUS_FALLBACKS[status]
      : 'Something went wrong. Please try again.';
  }

  if (EXACT_MESSAGES[trimmed]) return EXACT_MESSAGES[trimmed];

  if (trimmed.startsWith('Request failed with status')) {
    return status !== undefined && STATUS_FALLBACKS[status]
      ? STATUS_FALLBACKS[status]
      : 'Something went wrong. Please try again.';
  }

  if (trimmed.startsWith('Request timeout')) {
    return STATUS_FALLBACKS[408];
  }

  if (trimmed.startsWith('Request failed (')) {
    return status !== undefined && STATUS_FALLBACKS[status]
      ? STATUS_FALLBACKS[status]
      : 'Something went wrong. Please try again.';
  }

  for (const { pattern, message: friendly } of PYDANTIC_PATTERNS) {
    if (pattern.test(trimmed)) return friendly;
  }

  // Keep already-friendly backend messages as-is
  if (/[.!?]$/.test(trimmed) && trimmed.length <= 200 && !trimmed.includes('HTTP')) {
    return trimmed;
  }

  if (status !== undefined && STATUS_FALLBACKS[status]) {
    return STATUS_FALLBACKS[status];
  }

  return trimmed.length <= 200 ? trimmed : 'Something went wrong. Please try again.';
}

/** Parse a FastAPI JSON error body into a user-friendly message. */
export function parseApiErrorBody(
  body: { detail?: unknown; message?: string; error?: string },
  status: number,
): string {
  const raw =
    parseApiErrorDetail(body.detail) ||
    body.message ||
    body.error ||
    '';
  return toUserFriendlyError(raw, status);
}
