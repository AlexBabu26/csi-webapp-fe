import { api } from './api';

/**
 * Resolve post-login navigation path based on user type.
 * Backend: 1=ADMIN, 2=UNIT, 3=DISTRICT_OFFICIAL
 */
export const resolvePostLoginPath = async (
  userType: string | undefined,
  portalContext?: 'kalamela' | 'conference' | null
): Promise<string> => {
  if (userType === '1') {
    return '/admin/dashboard';
  }

  if (userType === '2') {
    try {
      const form = await api.getApplicationForm();
      if (form.registration_status === 'Registration Completed') {
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
