import { YMToken, YuvalokhamUserRole } from '../types';

const YM_ACCESS_TOKEN_KEY = 'ym_access_token';
const YM_REFRESH_TOKEN_KEY = 'ym_refresh_token';
const YM_USER_ROLE_KEY = 'ym_user_role';

export const setYMTokens = (data: YMToken) => {
  try {
    localStorage.setItem(YM_ACCESS_TOKEN_KEY, data.access_token);
    localStorage.setItem(YM_REFRESH_TOKEN_KEY, data.refresh_token);
    localStorage.setItem(YM_USER_ROLE_KEY, data.role);
  } catch {
    // ignore
  }
};

export const getYMAccessToken = (): string | null => {
  try {
    return localStorage.getItem(YM_ACCESS_TOKEN_KEY);
  } catch {
    return null;
  }
};

export const getYMRefreshToken = (): string | null => {
  try {
    return localStorage.getItem(YM_REFRESH_TOKEN_KEY);
  } catch {
    return null;
  }
};

export const getYMUserRole = (): YuvalokhamUserRole | null => {
  try {
    return localStorage.getItem(YM_USER_ROLE_KEY) as YuvalokhamUserRole | null;
  } catch {
    return null;
  }
};

export const clearYMAuth = () => {
  try {
    localStorage.removeItem(YM_ACCESS_TOKEN_KEY);
    localStorage.removeItem(YM_REFRESH_TOKEN_KEY);
    localStorage.removeItem(YM_USER_ROLE_KEY);
  } catch {
    // ignore
  }
};

export const isYMAuthenticated = (): boolean => {
  const token = getYMAccessToken();
  if (!token) return false;
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return false;
    const payload = JSON.parse(atob(parts[1]));
    return payload.exp ? Date.now() < payload.exp * 1000 : false;
  } catch {
    return false;
  }
};

export const isYMTokenExpiringSoon = (bufferSeconds = 60): boolean => {
  const token = getYMAccessToken();
  if (!token) return true;
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return true;
    const payload = JSON.parse(atob(parts[1]));
    if (!payload.exp) return true;
    return Date.now() >= (payload.exp * 1000 - bufferSeconds * 1000);
  } catch {
    return true;
  }
};
