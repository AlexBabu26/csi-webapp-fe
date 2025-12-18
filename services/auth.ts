import { AuthUser } from '../types';

const TOKEN_KEY = 'auth_token';
const USER_KEY = 'auth_user';

export const setAuthToken = (token: string) => {
  try {
    localStorage.setItem(TOKEN_KEY, token);
  } catch {
    // ignore
  }
};

export const getAuthToken = (): string | null => {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
};

export const clearAuthToken = () => {
  try {
    localStorage.removeItem(TOKEN_KEY);
  } catch {
    // ignore
  }
};

// Store authenticated user profile
export const setAuthUser = (user: AuthUser) => {
  try {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  } catch {
    // ignore
  }
};

// Get authenticated user profile
export const getAuthUser = (): AuthUser | null => {
  try {
    const userData = localStorage.getItem(USER_KEY);
    return userData ? JSON.parse(userData) : null;
  } catch {
    return null;
  }
};

// Clear authenticated user profile
export const clearAuthUser = () => {
  try {
    localStorage.removeItem(USER_KEY);
  } catch {
    // ignore
  }
};

// Get current user's unit ID (convenience function)
export const getCurrentUnitId = (): number | null => {
  const user = getAuthUser();
  return user?.unit_name_id ?? null;
};

// Clear all auth data (token + user)
export const clearAuth = () => {
  clearAuthToken();
  clearAuthUser();
  try {
    localStorage.removeItem('user_type');
  } catch {
    // ignore
  }
};

