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
}

export const isResidenceComplete = (member: ResidenceMemberLike): boolean => {
  if (!member.residence_location) return false;
  if (member.residence_location === 'WITHIN_KERALA') {
    return Boolean(member.residence_state_id);
  }
  return Boolean(member.residence_state_id);
};

export const parseResidenceFormValue = (member: ResidenceMemberLike): ResidenceFormValue => {
  if (!member.residence_location) {
    return { livesInKerala: null, countryId: null, stateId: null, cityId: null };
  }
  if (member.residence_location === 'WITHIN_KERALA') {
    return {
      livesInKerala: true,
      countryId: member.residence_country_id ?? null,
      stateId: member.residence_state_id ?? null,
      cityId: null,
    };
  }
  return {
    livesInKerala: false,
    countryId: member.residence_country_id ?? null,
    stateId: member.residence_state_id ?? null,
    cityId: member.residence_city_id ?? null,
  };
};

export const buildResidencePayload = (value: ResidenceFormValue): ResidencePayload => {
  if (value.livesInKerala === true) {
    return {
      residence_location: 'WITHIN_KERALA',
      residence_state_id: null,
      residence_city_id: null,
    };
  }

  if (value.livesInKerala === false) {
    if (!value.countryId || !value.stateId) {
      throw new Error('Country and state are required when the member does not live in Kerala');
    }

    return {
      residence_location: 'OUTSIDE_INDIA',
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
  if (!member.residence_location) return 'Not set';
  if (member.residence_location === 'WITHIN_KERALA') {
    if (member.residence_state_name && member.residence_country_name) {
      return `${member.residence_state_name}, ${member.residence_country_name}`;
    }
    return 'Lives in Kerala';
  }
  if (member.residence_state_name && member.residence_country_name) {
    if (member.residence_city_name) {
      return `${member.residence_city_name}, ${member.residence_state_name}, ${member.residence_country_name}`;
    }
    return `${member.residence_state_name}, ${member.residence_country_name}`;
  }
  if (member.residence_location === 'OUTSIDE_KERALA') return 'Outside Kerala (India)';
  if (member.residence_location === 'OUTSIDE_INDIA') return 'Outside India';
  return 'Not set';
};
