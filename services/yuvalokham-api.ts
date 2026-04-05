import {
  YMToken, YMUser, YMPlan, YMSubscription, YMPayment, YMMagazine,
  YMComplaint, YMQrSetting, YMPaginated, YMAnalyticsSummary,
  YMAnalyticsTrend, YMAnalyticsBreakdowns, YMExpiringSubscription,
  YMRegisterForm, YMLoginForm, YMProfileUpdateForm, YMComplaintForm,
  YMPlanForm, YMMagazineForm, YMAdminCreateForm,
} from '../types';
import { API_BASE_URL } from './http';
import { getYMAccessToken, getYMRefreshToken, setYMTokens, clearYMAuth, isYMTokenExpiringSoon } from './yuvalokham-auth';

const YM_BASE = '/yuvalokham';

let ymRefreshing = false;
let ymRefreshPromise: Promise<string> | null = null;

const ymRefreshAccessToken = async (): Promise<string> => {
  const refreshToken = getYMRefreshToken();
  if (!refreshToken) throw new Error('No refresh token');

  const controller = new AbortController();
  const tid = setTimeout(() => controller.abort(), 10000);
  try {
    const res = await fetch(`${API_BASE_URL}${YM_BASE}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: refreshToken }),
      signal: controller.signal,
    });
    clearTimeout(tid);
    if (!res.ok) { clearYMAuth(); throw new Error('Token refresh failed'); }
    const data: YMToken = await res.json();
    setYMTokens(data);
    return data.access_token;
  } catch (err: any) {
    clearTimeout(tid);
    if (err.name === 'AbortError') { clearYMAuth(); throw new Error('Refresh timeout'); }
    throw err;
  }
};

const getValidYMToken = async (): Promise<string | null> => {
  const token = getYMAccessToken();
  if (!token) return null;
  if (!isYMTokenExpiringSoon(60)) return token;

  if (ymRefreshing && ymRefreshPromise) return ymRefreshPromise;
  ymRefreshing = true;
  ymRefreshPromise = ymRefreshAccessToken().finally(() => { ymRefreshing = false; ymRefreshPromise = null; });
  try { return await ymRefreshPromise; } catch { return token; }
};

async function ymFetch<T>(url: string, options: RequestInit & { skipAuth?: boolean } = {}): Promise<T> {
  const finalUrl = `${API_BASE_URL}${url}`;
  const isFormData = options.body instanceof FormData;
  const headers: Record<string, string> = isFormData ? {} : { 'Content-Type': 'application/json' };

  if (!options.skipAuth) {
    const token = await getValidYMToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;
  }

  const controller = new AbortController();
  const tid = setTimeout(() => controller.abort(), 30000);

  try {
    let res = await fetch(finalUrl, { ...options, headers: { ...headers, ...(options.headers as Record<string, string> || {}) }, signal: controller.signal });
    clearTimeout(tid);

    if (res.status === 401 && !options.skipAuth) {
      const refresh = getYMRefreshToken();
      if (refresh) {
        try {
          const newToken = await ymRefreshAccessToken();
          headers['Authorization'] = `Bearer ${newToken}`;
          const retryController = new AbortController();
          const retryTid = setTimeout(() => retryController.abort(), 30000);
          res = await fetch(finalUrl, { ...options, headers: { ...headers, ...(options.headers as Record<string, string> || {}) }, signal: retryController.signal });
          clearTimeout(retryTid);
          if (res.status === 401) {
            clearYMAuth();
            throw Object.assign(new Error('Session expired'), { status: 401 });
          }
        } catch {
          clearYMAuth();
          throw Object.assign(new Error('Session expired'), { status: 401 });
        }
      } else {
        clearYMAuth();
        throw Object.assign(new Error('Session expired'), { status: 401 });
      }
    }

    if (!res.ok) {
      const text = await res.text();
      let msg = `Request failed (${res.status})`;
      try {
        const errData = JSON.parse(text);
        if (typeof errData.detail === 'string') msg = errData.detail;
        else if (Array.isArray(errData.detail)) msg = errData.detail.map((e: any) => e.msg).join(', ');
      } catch { if (text.length < 200) msg = text; }
      throw Object.assign(new Error(msg), { status: res.status });
    }

    if (res.status === 204) return null as T;
    const text = await res.text();
    return text ? JSON.parse(text) : null;
  } catch (err: any) {
    clearTimeout(tid);
    if (err.name === 'AbortError') throw Object.assign(new Error('Request timeout'), { status: 408 });
    throw err;
  }
}

const ymGet = <T>(url: string, query?: Record<string, any>) => {
  let qs = '';
  if (query) {
    const params = Object.entries(query).filter(([, v]) => v !== undefined && v !== null).map(([k, v]) => `${k}=${encodeURIComponent(v)}`);
    if (params.length) qs = `?${params.join('&')}`;
  }
  return ymFetch<T>(`${url}${qs}`);
};
const ymPost = <T>(url: string, body?: any) => ymFetch<T>(url, { method: 'POST', body: JSON.stringify(body) });
const ymPut = <T>(url: string, body?: any) => ymFetch<T>(url, { method: 'PUT', body: JSON.stringify(body) });
const ymPatch = <T>(url: string, body?: any) => ymFetch<T>(url, { method: 'PATCH', body: body !== undefined ? JSON.stringify(body) : undefined });
const ymDel = <T>(url: string) => ymFetch<T>(url, { method: 'DELETE' });
const ymPostForm = <T>(url: string, formData: FormData) => ymFetch<T>(url, { method: 'POST', body: formData });
const ymPutForm = <T>(url: string, formData: FormData) => ymFetch<T>(url, { method: 'PUT', body: formData });

// ==================== AUTH (Public) ====================
export const ymAuth = {
  register: (data: YMRegisterForm) => ymFetch<YMUser>(`${YM_BASE}/auth/register`, { method: 'POST', body: JSON.stringify(data), skipAuth: true }),
  login: (data: YMLoginForm) => ymFetch<YMToken>(`${YM_BASE}/auth/login`, { method: 'POST', body: JSON.stringify(data), skipAuth: true }),
  refresh: (token: string) => ymFetch<YMToken>(`${YM_BASE}/auth/refresh`, { method: 'POST', body: JSON.stringify({ refresh_token: token }), skipAuth: true }),
  getDistricts: () => ymFetch<Array<{ id: number; name: string }>>(`${YM_BASE}/auth/districts`, { skipAuth: true }),
  getUnits: (districtId?: number) => {
    const qs = districtId ? `?district_id=${districtId}` : '';
    return ymFetch<Array<{ id: number; name: string }>>(`${YM_BASE}/auth/units${qs}`, { skipAuth: true });
  },
};

// ==================== USER APIs ====================
export const ymUser = {
  getProfile: () => ymGet<YMUser>(`${YM_BASE}/user/profile`),
  updateProfile: (data: YMProfileUpdateForm) => ymPut<YMUser>(`${YM_BASE}/user/profile`, data),

  getPlans: () => ymGet<YMPlan[]>(`${YM_BASE}/user/plans`),
  subscribe: (planId: number) => ymPost<YMSubscription>(`${YM_BASE}/user/subscribe`, { plan_id: planId }),
  getSubscriptions: (skip = 0, limit = 20) => ymGet<YMPaginated<YMSubscription>>(`${YM_BASE}/user/subscriptions`, { skip, limit }),
  getActiveSubscription: () => ymGet<YMSubscription | null>(`${YM_BASE}/user/subscriptions/active`),

  getQrCode: () => ymGet<YMQrSetting | null>(`${YM_BASE}/user/qr-code`),
  submitPayment: (subscriptionId: number, proof: File) => {
    const fd = new FormData();
    fd.append('subscription_id', subscriptionId.toString());
    fd.append('proof', proof);
    return ymPostForm<YMPayment>(`${YM_BASE}/user/payments`, fd);
  },
  getPayments: (skip = 0, limit = 20) => ymGet<YMPaginated<YMPayment>>(`${YM_BASE}/user/payments`, { skip, limit }),

  getMagazines: () => ymGet<YMMagazine[]>(`${YM_BASE}/user/magazines`),
  getMagazine: (id: number) => ymGet<YMMagazine>(`${YM_BASE}/user/magazines/${id}`),

  createComplaint: (data: YMComplaintForm) => ymPost<YMComplaint>(`${YM_BASE}/user/complaints`, data),
  getComplaints: (skip = 0, limit = 20) => ymGet<YMPaginated<YMComplaint>>(`${YM_BASE}/user/complaints`, { skip, limit }),
};

// ==================== ADMIN APIs ====================
export const ymAdmin = {
  // Users
  getUsers: (params?: { search?: string; is_active?: boolean; district_id?: number; skip?: number; limit?: number }) =>
    ymGet<YMPaginated<YMUser>>(`${YM_BASE}/admin/users`, params),
  getUser: (id: number) => ymGet<YMUser>(`${YM_BASE}/admin/users/${id}`),
  updateUser: (id: number, data: Partial<{ name: string; is_active: boolean }>) => ymPut<YMUser>(`${YM_BASE}/admin/users/${id}`, data),
  resetUserPassword: (userId: number, newPassword: string) => ymPatch<YMUser>(`${YM_BASE}/admin/users/${userId}/reset-password`, { new_password: newPassword }),
  createAdmin: (data: YMAdminCreateForm) => ymPost<YMUser>(`${YM_BASE}/admin/admins`, data),

  // Plans
  getPlans: () => ymGet<YMPlan[]>(`${YM_BASE}/admin/plans`),
  createPlan: (data: YMPlanForm) => ymPost<YMPlan>(`${YM_BASE}/admin/plans`, data),
  updatePlan: (id: number, data: Partial<YMPlanForm>) => ymPut<YMPlan>(`${YM_BASE}/admin/plans/${id}`, data),
  togglePlan: (id: number) => ymPatch<YMPlan>(`${YM_BASE}/admin/plans/${id}/toggle`),

  // Subscriptions
  getSubscriptions: (params?: { status?: string; plan_id?: number; user_id?: number; skip?: number; limit?: number }) =>
    ymGet<YMPaginated<YMSubscription>>(`${YM_BASE}/admin/subscriptions`, params),

  // Payments
  getPayments: (params?: { status?: string; skip?: number; limit?: number }) =>
    ymGet<YMPaginated<YMPayment>>(`${YM_BASE}/admin/payments`, params),
  approvePayment: (id: number) => ymPatch<YMPayment>(`${YM_BASE}/admin/payments/${id}/approve`),
  rejectPayment: (id: number, remarks: string) => ymPatch<YMPayment>(`${YM_BASE}/admin/payments/${id}/reject`, { remarks }),

  // Magazines
  getMagazines: (status?: string) => ymGet<YMMagazine[]>(`${YM_BASE}/admin/magazines`, status ? { status } : undefined),
  createMagazine: (data: YMMagazineForm) => ymPost<YMMagazine>(`${YM_BASE}/admin/magazines`, data),
  updateMagazine: (id: number, data: Partial<YMMagazineForm>) => ymPut<YMMagazine>(`${YM_BASE}/admin/magazines/${id}`, data),
  uploadMagazineFiles: (id: number, files: { cover?: File; pdf?: File }) => {
    const fd = new FormData();
    if (files.cover) fd.append('cover', files.cover);
    if (files.pdf) fd.append('pdf', files.pdf);
    return ymPostForm<YMMagazine>(`${YM_BASE}/admin/magazines/${id}/files`, fd);
  },
  publishMagazine: (id: number) => ymPatch<YMMagazine>(`${YM_BASE}/admin/magazines/${id}/publish`),
  deleteMagazine: (id: number) => ymDel<void>(`${YM_BASE}/admin/magazines/${id}`),

  // Complaints
  getComplaints: (params?: { status?: string; category?: string; skip?: number; limit?: number }) =>
    ymGet<YMPaginated<YMComplaint>>(`${YM_BASE}/admin/complaints`, params),
  respondComplaint: (id: number, response: string) => ymPatch<YMComplaint>(`${YM_BASE}/admin/complaints/${id}/respond`, { response }),
  closeComplaint: (id: number) => ymPatch<YMComplaint>(`${YM_BASE}/admin/complaints/${id}/close`),

  // QR Settings
  getQrSettings: () => ymGet<YMQrSetting>(`${YM_BASE}/admin/qr-settings`),
  updateQrSettings: (data: { qr_image?: File; description?: string }) => {
    const fd = new FormData();
    if (data.qr_image) fd.append('qr_image', data.qr_image);
    if (data.description !== undefined) fd.append('description', data.description);
    return ymPutForm<YMQrSetting>(`${YM_BASE}/admin/qr-settings`, fd);
  },

  // Analytics
  getSummary: () => ymGet<YMAnalyticsSummary>(`${YM_BASE}/admin/analytics/summary`),
  getTrends: (months = 12) => ymGet<YMAnalyticsTrend[]>(`${YM_BASE}/admin/analytics/trends`, { months }),
  getBreakdowns: () => ymGet<YMAnalyticsBreakdowns>(`${YM_BASE}/admin/analytics/breakdowns`),
  getExpiring: (days = 30) => ymGet<YMExpiringSubscription[]>(`${YM_BASE}/admin/analytics/expiring`, { days }),
};
