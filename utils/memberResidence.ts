import { ResidenceLocation } from '../types';

export interface ResidenceFormValue {
  livesInKerala: boolean | null;
  countryId: number | null;
  stateId: number | null;
  cityId: number | null;
  countryIsoCode?: string;
}

export interface ResidencePayload {
  residence_location: ResidenceLocation;
  residence_state_id?: number | null;
  residence_city_id?: number | null;
}

export interface ResidenceMemberLike {
  residence_location?: ResidenceLocation | null;
  residence_state_id?: number | null;
  residence_city_id?: number | null;
  residence_state_name?: string | null;
  residence_city_name?: string | null;
  residence_country_name?: string | null;
  residence_country_id?: number | null;
  residenceLocation?: ResidenceLocation | null;
  residenceStateId?: number | null;
  residenceCityId?: number | null;
  residenceStateName?: string | null;
  residenceCityName?: string | null;
  residenceCountryName?: string | null;
  residenceCountryId?: number | null;
}

const readResidenceLocation = (member: ResidenceMemberLike) =>
  member.residence_location ?? member.residenceLocation ?? null;

const readResidenceStateId = (member: ResidenceMemberLike) =>
  member.residence_state_id ?? member.residenceStateId ?? null;

const readResidenceCityId = (member: ResidenceMemberLike) =>
  member.residence_city_id ?? member.residenceCityId ?? null;

const readResidenceStateName = (member: ResidenceMemberLike) =>
  member.residence_state_name ?? member.residenceStateName ?? null;

const readResidenceCityName = (member: ResidenceMemberLike) =>
  member.residence_city_name ?? member.residenceCityName ?? null;

const readResidenceCountryName = (member: ResidenceMemberLike) =>
  member.residence_country_name ?? member.residenceCountryName ?? null;

const readResidenceCountryId = (member: ResidenceMemberLike) =>
  member.residence_country_id ?? member.residenceCountryId ?? null;

export const memberToResidenceSnapshot = (member: ResidenceMemberLike): ResidencePayload & {
  residence_location?: ResidenceLocation | null;
} => ({
  residence_location: readResidenceLocation(member),
  residence_state_id: readResidenceStateId(member),
  residence_city_id: readResidenceCityId(member),
});

export const residenceSnapshotsEqual = (
  left: ResidencePayload,
  right: ResidencePayload,
): boolean =>
  left.residence_location === right.residence_location &&
  (left.residence_state_id ?? null) === (right.residence_state_id ?? null) &&
  (left.residence_city_id ?? null) === (right.residence_city_id ?? null);

export interface ResidenceChangeResult {
  changed: boolean;
  payload?: ResidencePayload;
  error?: string;
}

export const getResidenceChange = (
  member: ResidenceMemberLike,
  value: ResidenceFormValue,
): ResidenceChangeResult => {
  if (value.livesInKerala === null) {
    return { changed: false };
  }

  const validationError = validateResidenceFormValue(value);
  if (validationError) {
    return { changed: false, error: validationError };
  }

  const nextPayload = buildResidencePayload(value);
  const currentPayload = memberToResidenceSnapshot(member);

  if (residenceSnapshotsEqual(currentPayload, nextPayload)) {
    return { changed: false };
  }

  return { changed: true, payload: nextPayload };
};

export const isResidenceComplete = (member: ResidenceMemberLike): boolean => {
  const location = readResidenceLocation(member);
  if (!location) return false;
  return Boolean(readResidenceStateId(member));
};

export const parseResidenceFormValue = (member: ResidenceMemberLike): ResidenceFormValue => {
  const residenceLocation = readResidenceLocation(member);
  if (!residenceLocation) {
    return { livesInKerala: null, countryId: null, stateId: null, cityId: null };
  }
  if (residenceLocation === 'WITHIN_KERALA') {
    return {
      livesInKerala: true,
      countryId: readResidenceCountryId(member) ?? null,
      stateId: readResidenceStateId(member) ?? null,
      cityId: readResidenceCityId(member) ?? null,
      countryIsoCode: 'IN',
    };
  }
  return {
    livesInKerala: false,
    countryId: readResidenceCountryId(member) ?? null,
    stateId: readResidenceStateId(member) ?? null,
    cityId: readResidenceCityId(member) ?? null,
    countryIsoCode: readResidenceCountryName(member) === 'India' ? 'IN' : undefined,
  };
};

export const buildResidencePayload = (value: ResidenceFormValue): ResidencePayload => {
  if (value.livesInKerala === true) {
    return {
      residence_location: 'WITHIN_KERALA',
      residence_state_id: null,
      residence_city_id: value.cityId ?? null,
    };
  }

  if (value.livesInKerala === false) {
    if (!value.countryId || !value.stateId) {
      throw new Error('Country and state are required when the member does not live in Kerala');
    }

    const residenceLocation: ResidenceLocation =
      value.countryIsoCode === 'IN' ? 'OUTSIDE_KERALA' : 'OUTSIDE_INDIA';

    return {
      residence_location: residenceLocation,
      residence_state_id: value.stateId,
      residence_city_id: value.cityId ?? null,
    };
  }

  throw new Error('Please select whether the member lives in Kerala');
};

export const validateResidenceFormValue = (value: ResidenceFormValue): string | null => {
  try {
    buildResidencePayload(value);
    return null;
  } catch (error) {
    return error instanceof Error ? error.message : 'Invalid living location';
  }
};

export const getMemberResidenceLabel = (member: ResidenceMemberLike): string => {
  const residenceLocation = readResidenceLocation(member);
  if (!residenceLocation) return 'Not set';
  const stateName = readResidenceStateName(member);
  const countryName = readResidenceCountryName(member);
  const cityName = readResidenceCityName(member);
  if (stateName && countryName) {
    if (cityName) {
      return `${cityName}, ${stateName}, ${countryName}`;
    }
    return `${stateName}, ${countryName}`;
  }
  if (residenceLocation === 'WITHIN_KERALA') return 'Lives in Kerala';
  if (residenceLocation === 'OUTSIDE_KERALA') return 'Outside Kerala (India)';
  if (residenceLocation === 'OUTSIDE_INDIA') return 'Outside India';
  return 'Not set';
};
