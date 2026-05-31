import { api } from './api';

export const membersMissingLocation = (
  members: Array<{ residence_location?: string | null }> = [],
) => members.some((member) => !member.residence_location);

/**
 * Resolve post-login navigation path based on user type.
 * Backend: 1=ADMIN, 2=UNIT, 3=DISTRICT_OFFICIAL
 */
export const resolvePostLoginPath = async (
  userType: string | undefined,
  portalContext?: 'kalamela' | 'conference' | null,
  options?: { skipLocationCheck?: boolean },
): Promise<string> => {
  if (userType === '1') {
    return '/admin/dashboard';
  }

  if (userType === '2') {
    try {
      const form = await api.getApplicationForm();
      if (!options?.skipLocationCheck && membersMissingLocation(form.unit_members)) {
        return '/unit/update-locations';
      }
      if (form.registration_status === 'Registration Completed') {
        return '/register/complete';
      }
      if (form.registration_enabled) {
        return '/register/wizard';
      }
      if (form.has_any_completed_cycle) {
        return '/register/complete';
      }
      return '/register/wizard';
    } catch {
      return '/register/wizard';
    }
  }

  if (userType === '3') {
    if (portalContext === 'kalamela') return '/kalamela/official/home';
    if (portalContext === 'conference') return '/conference/official/home';
    return '/conference/official/home';
  }

  return '/';
};

export const formatRegistrationSeason = (endingYear: number): string =>
  `${endingYear - 1}–${endingYear}`;
