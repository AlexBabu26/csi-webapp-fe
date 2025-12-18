import { AuthUser } from '../types';

const TOKEN_KEY = 'auth_token';
const REFRESH_TOKEN_KEY = 'refresh_token';
const USER_KEY = 'auth_user';

// ==================== Access Token ====================

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

// ==================== Refresh Token ====================

export const setRefreshToken = (token: string) => {
  try {
    localStorage.setItem(REFRESH_TOKEN_KEY, token);
  } catch {
    // ignore
  }
};

export const getRefreshToken = (): string | null => {
  try {
    return localStorage.getItem(REFRESH_TOKEN_KEY);
  } catch {
    return null;
  }
};

export const clearRefreshToken = () => {
  try {
    localStorage.removeItem(REFRESH_TOKEN_KEY);
  } catch {
    // ignore
  }
};

// ==================== Token Utilities ====================

/**
 * Decode a JWT token payload (without verification)
 */
export const decodeToken = (token: string): { sub: string; exp: number; type: string; role: string } | null => {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const payload = JSON.parse(atob(parts[1]));
    return payload;
  } catch {
    return null;
  }
};

/**
 * Check if a token is expired
 */
export const isTokenExpired = (token: string): boolean => {
  const payload = decodeToken(token);
  if (!payload || !payload.exp) return true;
  
  // Token expiration is in seconds, Date.now() is in milliseconds
  const expiresAt = payload.exp * 1000;
  return Date.now() >= expiresAt;
};

/**
 * Check if a token will expire within the given buffer time (default: 60 seconds)
 */
export const isTokenExpiringSoon = (token: string, bufferSeconds: number = 60): boolean => {
  const payload = decodeToken(token);
  if (!payload || !payload.exp) return true;
  
  const expiresAt = payload.exp * 1000;
  const bufferMs = bufferSeconds * 1000;
  return Date.now() >= (expiresAt - bufferMs);
};

/**
 * Get time until token expires in seconds (negative if already expired)
 */
export const getTokenExpiresIn = (token: string): number => {
  const payload = decodeToken(token);
  if (!payload || !payload.exp) return -1;
  
  const expiresAt = payload.exp * 1000;
  return Math.floor((expiresAt - Date.now()) / 1000);
};

// ==================== User Profile ====================

export const setAuthUser = (user: AuthUser) => {
  try {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  } catch {
    // ignore
  }
};

export const getAuthUser = (): AuthUser | null => {
  try {
    const userData = localStorage.getItem(USER_KEY);
    return userData ? JSON.parse(userData) : null;
  } catch {
    return null;
  }
};

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

// ==================== Combined Auth Operations ====================

/**
 * Store both access and refresh tokens from login response
 */
export const setAuthTokens = (accessToken: string, refreshToken: string) => {
  setAuthToken(accessToken);
  setRefreshToken(refreshToken);
};

/**
 * Clear all auth data (tokens + user)
 */
export const clearAuth = () => {
  clearAuthToken();
  clearRefreshToken();
  clearAuthUser();
  try {
    localStorage.removeItem('user_type');
  } catch {
    // ignore
  }
};

/**
 * Check if user is authenticated (has a valid, non-expired token)
 */
export const isAuthenticated = (): boolean => {
  const token = getAuthToken();
  if (!token) return false;
  return !isTokenExpired(token);
};

/**
 * Check if we can refresh the session (have a valid refresh token)
 */
export const canRefreshSession = (): boolean => {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return false;
  return !isTokenExpired(refreshToken);
};
