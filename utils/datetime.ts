/** IST (Asia/Kolkata) datetime helpers used across the CSI frontend. */

export const APP_TIMEZONE = 'Asia/Kolkata';
export const APP_LOCALE = 'en-IN';

const defaultDateOptions: Intl.DateTimeFormatOptions = {
  timeZone: APP_TIMEZONE,
  day: '2-digit',
  month: 'short',
  year: 'numeric',
};

const defaultDateTimeOptions: Intl.DateTimeFormatOptions = {
  timeZone: APP_TIMEZONE,
  day: '2-digit',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  hour12: true,
};

export function parseDate(value: string | number | Date | null | undefined): Date | null {
  if (value == null || value === '') return null;
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

/** Parse YYYY-MM-DD values without UTC midnight shifting calendar dates. */
export function parseDateOnly(value: string | null | undefined): Date | null {
  if (!value) return null;
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value.trim());
  if (match) {
    const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
    return Number.isNaN(date.getTime()) ? null : date;
  }
  return parseDate(value);
}

export function formatDateIST(
  value: string | number | Date | null | undefined,
  options?: Intl.DateTimeFormatOptions,
): string {
  const date = parseDate(value);
  if (!date) return '—';
  return date.toLocaleDateString(APP_LOCALE, { ...defaultDateOptions, ...options });
}

export function formatDateOnlyIST(
  value: string | null | undefined,
  options?: Intl.DateTimeFormatOptions,
): string {
  const date = parseDateOnly(value) ?? parseDate(value);
  if (!date) return '—';
  return date.toLocaleDateString(APP_LOCALE, { ...defaultDateOptions, ...options });
}

export function formatDateTimeIST(
  value: string | number | Date | null | undefined,
  options?: Intl.DateTimeFormatOptions,
): string {
  const date = parseDate(value);
  if (!date) return '—';
  return date.toLocaleString(APP_LOCALE, { ...defaultDateTimeOptions, ...options });
}

export function formatTimeIST(
  value: string | number | Date | null | undefined,
  options?: Intl.DateTimeFormatOptions,
): string {
  const date = parseDate(value);
  if (!date) return '—';
  return date.toLocaleTimeString(APP_LOCALE, {
    timeZone: APP_TIMEZONE,
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
    ...options,
  });
}

export function getCurrentYearIST(): number {
  return getTodayPartsIST().year;
}

export function getTodayPartsIST(): { year: number; month: number; day: number } {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat('en-CA', {
      timeZone: APP_TIMEZONE,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    })
      .formatToParts(new Date())
      .map(({ type, value }) => [type, value]),
  );

  return {
    year: Number(parts.year),
    month: Number(parts.month),
    day: Number(parts.day),
  };
}

export function getTodayISOIST(): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: APP_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
}

export function formatNowDateTimeIST(): string {
  return formatDateTimeIST(new Date());
}

/** ISO-like timestamp for API payloads using IST wall-clock time. */
export function nowISOStringIST(): string {
  const now = new Date();
  const date = now.toLocaleDateString('en-CA', { timeZone: APP_TIMEZONE });
  const time = now.toLocaleTimeString('en-GB', {
    timeZone: APP_TIMEZONE,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
  return `${date}T${time}`;
}
