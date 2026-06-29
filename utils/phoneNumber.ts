import {
  CountryCode,
  isValidPhoneNumber,
  parsePhoneNumberFromString,
} from 'libphonenumber-js';
import { ResidenceFormValue } from './memberResidence';

export const DEFAULT_PHONE_COUNTRY: CountryCode = 'IN';

export function isInternationalResidence(residence: ResidenceFormValue | null | undefined): boolean {
  if (!residence || residence.livesInKerala === null) return false;
  if (residence.livesInKerala) return false;
  return residence.countryIsoCode !== 'IN';
}

export function getPhoneCountryFromResidence(
  residence: ResidenceFormValue | null | undefined,
): CountryCode | undefined {
  return isInternationalResidence(residence) ? undefined : DEFAULT_PHONE_COUNTRY;
}

export function normalizePhone(
  value: string,
  defaultCountry: CountryCode = DEFAULT_PHONE_COUNTRY,
): string | null {
  const trimmed = value.trim();
  if (!trimmed) return null;

  const phone = parsePhoneNumberFromString(trimmed, defaultCountry);
  if (phone?.isValid()) {
    return phone.format('E.164');
  }

  if (trimmed.startsWith('+')) {
    const international = parsePhoneNumberFromString(trimmed);
    if (international?.isValid()) {
      return international.format('E.164');
    }
  }

  return null;
}

export function validatePhone(
  value: string,
  defaultCountry: CountryCode = DEFAULT_PHONE_COUNTRY,
  international = false,
): boolean {
  const trimmed = value.trim();
  if (!trimmed) return false;

  if (international || trimmed.startsWith('+')) {
    return isValidPhoneNumber(trimmed);
  }

  return isValidPhoneNumber(trimmed, defaultCountry);
}

export function getPhoneValidationError(
  value: string,
  defaultCountry: CountryCode = DEFAULT_PHONE_COUNTRY,
  international = false,
): string | null {
  if (!value.trim()) return 'Phone number is required';

  if (!validatePhone(value, defaultCountry, international)) {
    return international
      ? 'Please enter a valid phone number with country code (e.g. +1 555 123 4567)'
      : 'Please enter a valid 10-digit mobile number';
  }

  return null;
}

export function formatPhoneForDisplay(value: string): string {
  if (!value) return '';

  const phone = parsePhoneNumberFromString(value);
  if (phone?.isValid()) {
    if (phone.country === 'IN') {
      return phone.nationalNumber;
    }
    return phone.formatInternational();
  }

  if (/^\d{10}$/.test(value)) {
    return value;
  }

  return value;
}

export function toIndianNationalInput(value: string): string {
  const digits = value.replace(/\D/g, '');
  if (!digits) return '';

  if (digits.startsWith('91') && digits.length === 12) {
    return digits.slice(2);
  }

  return digits.slice(0, 10);
}

export function phoneLookupVariants(value: string): string[] {
  const trimmed = value.trim();
  if (!trimmed) return [];

  const variants = new Set<string>([trimmed]);
  const normalized = normalizePhone(trimmed);

  if (normalized) {
    variants.add(normalized);
    if (normalized.startsWith('+91')) {
      variants.add(normalized.slice(3));
    }
  }

  if (/^\d{10}$/.test(trimmed)) {
    variants.add(`+91${trimmed}`);
  }

  return [...variants];
}

export function phonesEqual(a: string | null | undefined, b: string | null | undefined): boolean {
  if (!a || !b) return a === b;

  const normalizedA = normalizePhone(a) ?? a.trim();
  const normalizedB = normalizePhone(b) ?? b.trim();

  if (normalizedA === normalizedB) return true;

  return phoneLookupVariants(a).some((variant) => phoneLookupVariants(b).includes(variant));
}

export function isLoginPhone(value: string): boolean {
  return validatePhone(value, DEFAULT_PHONE_COUNTRY) || (value.startsWith('+') && validatePhone(value));
}
