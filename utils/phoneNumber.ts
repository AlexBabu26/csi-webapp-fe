import {
  CountryCode,
  getCountryCallingCode,
  getExampleNumber,
  isSupportedCountry,
  isValidPhoneNumber,
  parsePhoneNumberFromString,
} from 'libphonenumber-js';
import examples from 'libphonenumber-js/mobile/examples';
import { ResidenceFormValue } from './memberResidence';

export const DEFAULT_PHONE_COUNTRY: CountryCode = 'IN';

export function isInternationalResidence(residence: ResidenceFormValue | null | undefined): boolean {
  return getPhoneCountryFromResidence(residence) !== DEFAULT_PHONE_COUNTRY;
}

export function getPhoneCountryFromResidence(
  residence: ResidenceFormValue | null | undefined,
): CountryCode {
  if (!residence || residence.livesInKerala === null) return DEFAULT_PHONE_COUNTRY;
  if (residence.livesInKerala) return DEFAULT_PHONE_COUNTRY;
  const isoCode = residence.countryIsoCode?.toUpperCase();
  if (isoCode && isSupportedCountry(isoCode)) {
    return isoCode;
  }
  return DEFAULT_PHONE_COUNTRY;
}

export function getCallingCodePrefix(country: CountryCode = DEFAULT_PHONE_COUNTRY): string {
  if (!isSupportedCountry(country)) {
    return `+${getCountryCallingCode(DEFAULT_PHONE_COUNTRY)}`;
  }
  return `+${getCountryCallingCode(country)}`;
}

export function getPhonePlaceholder(country: CountryCode = DEFAULT_PHONE_COUNTRY): string {
  const resolvedCountry = isSupportedCountry(country) ? country : DEFAULT_PHONE_COUNTRY;
  const example = getExampleNumber(resolvedCountry, examples);
  if (example) {
    return example.formatNational();
  }
  return resolvedCountry === DEFAULT_PHONE_COUNTRY ? '10-digit mobile number' : 'Phone number';
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
  international = defaultCountry !== DEFAULT_PHONE_COUNTRY,
): string | null {
  if (!value.trim()) return 'Phone number is required';

  if (!validatePhone(value, defaultCountry, international)) {
    if (defaultCountry === DEFAULT_PHONE_COUNTRY) {
      return 'Please enter a valid 10-digit mobile number';
    }
    return `Please enter a valid phone number for ${getCallingCodePrefix(defaultCountry)}`;
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

export function toNationalInput(value: string, country: CountryCode = DEFAULT_PHONE_COUNTRY): string {
  if (!value) return '';

  const phone = parsePhoneNumberFromString(value, country);
  if (phone?.isValid() || phone?.nationalNumber) {
    return phone.nationalNumber;
  }

  const digits = value.replace(/\D/g, '');
  if (!digits) return '';

  const callingCode = getCountryCallingCode(country);
  if (digits.startsWith(callingCode)) {
    return digits.slice(callingCode.length);
  }

  if (country === DEFAULT_PHONE_COUNTRY) {
    return digits.slice(0, 10);
  }

  return digits;
}

/** @deprecated Use toNationalInput instead */
export function toIndianNationalInput(value: string): string {
  return toNationalInput(value, DEFAULT_PHONE_COUNTRY);
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
