
import {
  Metric,
  Participant,
  EventItem,
  ScoreEntry,
  ApiResponse,
  AuthTokens,
  AuthUser,
  UnitName,
  DashboardCounts,
  ConferenceItem,
  PaymentRecord,
  PaymentStatus,
  Unit,
  UnitMember,
  UnitOfficial,
  UnitCouncilor,
  TransferRequest,
  MemberInfoChangeRequest,
  OfficialsChangeRequest,
  CouncilorChangeRequest,
  MemberAddRequest,
  UnitStats,
  DistrictWiseData,
  ClergyDistrict,
  RequestStatus,
  ArchivedMember,
  TransferRequestSubmission,
  MemberInfoChangeSubmission,
  OfficialsChangeSubmission,
  CouncilorChangeSubmission,
  MemberAddSubmission,
  // Kalamela types
  IndividualEvent,
  GroupEvent,
  EventParticipant,
  GroupEventTeam,
  EventScore,
  ScoreSubmission,
  KalamelaPayment,
  ScoreAppeal,
  ExcludedMember,
  EventResults,
  DistrictPerformance,
  UnitPerformance,
  TopPerformer,
  KalamelaDashboardStats,
  EventGrade,
  KalamelaCategory,
  KalamelaCategoryCreate,
  KalamelaCategoryUpdate,
  IndividualEventCreate,
  IndividualEventUpdate,
  GroupEventCreate,
  GroupEventUpdate,
  RegistrationFee,
  RegistrationFeeCreate,
  RegistrationFeeUpdate,
  // Site Settings types
  SiteSettings,
  SiteSettingsUpdate,
  LogoUploadResponse,
  Notice,
  NoticeCreate,
  NoticeUpdate,
  NoticeReorderItem,
  QuickLink,
  QuickLinkCreate,
  QuickLinkUpdate,
  // Conference types
  Conference,
  ConferenceCreate,
  ConferenceUpdate,
  ConferenceDelegate,
  ConferenceDelegateCreate,
  ConferencePayment,
  ConferencePaymentSubmit,
  ConferenceFoodPreference,
  ConferenceInfo,
  ConferencePaymentInfo,
  DistrictOfficial,
  DistrictOfficialCreate,
  DistrictOfficialUpdate,
  ConferenceOfficialView,
} from '../types';
import { httpGet, httpPost, httpPut, httpDelete, httpPostFormData } from './http';

class ApiService {
  // -------------------------
  // System
  // -------------------------
  healthCheck() {
    return httpGet<{ status: string }>('/health');
  }

  // Helper to get token from localStorage
  private getToken(): string | null {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      console.warn('[API] No auth token found in localStorage');
    }
    return token;
  }

  // Helper to get refresh token from localStorage
  private getRefreshToken(): string | null {
    return localStorage.getItem('refresh_token');
  }

  // -------------------------
  // Auth
  // -------------------------
  async login(payload: { username: string; password: string; portal?: 'kalamela' | 'conference' }) {
    try {
      console.log('[API] login: Attempting login for user:', payload.username, 'portal:', payload.portal);
      const result = await httpPost<AuthTokens>('/auth/login', payload);
      console.log('[API] login: Success, token received');
      return result;
    } catch (err) {
      console.error('[API] login: Failed:', err);
      throw err;
    }
  }

  registerUnit(payload: {
    email: string;
    phone_number: string;
    first_name: string;
    last_name?: string;
    unit_name_id: number;
    clergy_district_id: number;
    password: string;
  }) {
    return httpPost<AuthUser>('/auth/register-unit', payload);
  }

  getUnitNames(districtId?: number) {
    return httpGet<UnitName[]>('/auth/unit-names', { 
      query: districtId ? { district_id: districtId } : undefined 
    });
  }

  async me(token?: string) {
    const authToken = token || this.getToken();
    if (!authToken) {
      console.error('[API] me: No authentication token');
      throw new Error('No authentication token');
    }
    try {
      console.log('[API] me: Fetching user profile...');
      const result = await httpGet<AuthUser>('/auth/me', { token: authToken });
      console.log('[API] me: Success, user type:', result.user_type);
      return result;
    } catch (err) {
      console.error('[API] me: Failed:', err);
      throw err;
    }
  }

  forgotPasswordRequest(payload: { email: string }) {
    return httpPost<{ message: string }>('/auth/forgot-password/request', payload);
  }

  forgotPasswordConfirm(payload: { token: string; new_password: string }) {
    return httpPost<{ message: string }>('/auth/forgot-password/confirm', payload);
  }

  /**
   * Refresh the access token using the refresh token
   * Returns new access and refresh tokens
   */
  async refreshToken(): Promise<AuthTokens> {
    const refreshToken = this.getRefreshToken();
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }
    
    try {
      console.log('[API] refreshToken: Attempting to refresh access token...');
      const result = await httpPost<AuthTokens>('/auth/refresh', { 
        refresh_token: refreshToken 
      });
      console.log('[API] refreshToken: Success, new tokens received');
      
      // Store new tokens
      localStorage.setItem('auth_token', result.access_token);
      if (result.refresh_token) {
        localStorage.setItem('refresh_token', result.refresh_token);
      }
      
      return result;
    } catch (err) {
      console.error('[API] refreshToken: Failed:', err);
      // Clear tokens on refresh failure - user needs to re-login
      localStorage.removeItem('auth_token');
      localStorage.removeItem('refresh_token');
      throw err;
    }
  }

  // -------------------------
  // Admin (role 1)
  // -------------------------
  adminDashboard(token: string) {
    return httpGet<DashboardCounts>('/admin/dashboard', { token });
  }

  adminExportUsers(token: string) {
    return httpGet<Blob>('/admin/exports/users', { token, asBlob: true });
  }

  // Get statistics for all districts
  getDistrictStatistics(token: string) {
    return httpGet<any[]>('/admin/statistics/districts', { token });
  }

  // Get statistics for a single district
  getDistrictStatisticsById(districtId: number, token: string) {
    return httpGet<any>(`/admin/statistics/districts/${districtId}`, { token });
  }

  // =========================================================================
  // CONFERENCE MODULE APIs
  // =========================================================================

  // -------------------------
  // Conference - Public Endpoints
  // -------------------------
  
  // GET /conference/public/list - List all public conferences
  getPublicConferences() {
    return httpGet<Array<{
      id: number;
      title: string;
      details: string;
      added_on: string;
      status: 'Active' | 'Inactive' | 'Completed';
    }>>('/conference/public/list');
  }

  // GET /conference/public/{conference_id} - Get public conference details
  getPublicConferenceDetails(conferenceId: number) {
    return httpGet<{
      id: number;
      title: string;
      details: string;
      added_on: string;
      status: 'Active' | 'Inactive' | 'Completed';
    }>(`/conference/public/${conferenceId}`);
  }

  // -------------------------
  // Conference - Official/Unit Endpoints
  // -------------------------

  // GET /conference/official/view - View conference details for current user's unit
  async getConferenceOfficialView(): Promise<ConferenceOfficialView> {
    const token = this.getToken();
    if (!token) throw new Error('Authentication required');
    
    const rawData = await httpGet<any>('/conference/official/view', { token });
    
    // Transform API response to frontend format
    return {
      conference: {
        id: rawData.conference?.id || 0,
        title: rawData.conference?.title || '',
        details: rawData.conference?.details || '',
        status: rawData.conference?.status || 'Active',
        description: rawData.conference?.details || '',
        venue: '', // Not in API response
        start_date: '', // Not in API response
        end_date: '', // Not in API response
        registration_fee: 0, // Not in API response
      },
      unit_delegates: [], // Will be fetched separately via getConferenceDelegatesOfficial
      unit_payment: undefined, // Will be fetched separately
      registration_open: rawData.conference?.status === 'Active' && rawData.rem_count > 0,
      available_members: (rawData.unit_members || []).map((m: any) => ({
        id: m.id,
        name: m.name,
        gender: m.gender,
        phone: m.number,
      })),
      rem_count: rawData.rem_count || 0,
      max_count: rawData.max_count || 0,
      allowed_count: rawData.allowed_count || 0,
      member_count: rawData.member_count || 0,
      district: rawData.district || '',
    };
  }

  // POST /conference/official/delegates/{member_id} - Add a delegate from unit
  addConferenceDelegateOfficial(memberId: number, data?: ConferenceDelegateCreate) {
    const token = this.getToken();
    if (!token) throw new Error('Authentication required');
    return httpPost<ConferenceDelegate>(`/conference/official/delegates/${memberId}`, data || {}, { token });
  }

  // GET /conference/official/delegates - Get delegates list for current unit
  async getConferenceDelegatesOfficial() {
    const token = this.getToken();
    if (!token) throw new Error('Authentication required');
    
    const rawData = await httpGet<any>('/conference/official/delegates', { token });
    
    // Return the full response structure for the delegates page to use
    return {
      delegate_members: rawData.delegate_members || [],
      delegate_officials: rawData.delegate_officials || [],
      delegates_count: rawData.delegates_count || 0,
      max_count: rawData.max_count || 0,
      payment_status: rawData.payment_status || 'PENDING',
      amount_to_pay: rawData.amount_to_pay || 0,
      food_preference: rawData.food_preference || { veg_count: 0, non_veg_count: 0 },
    };
  }

  // DELETE /conference/official/delegates/members/{member_id} - Remove a delegate
  removeConferenceDelegateOfficial(memberId: number) {
    const token = this.getToken();
    if (!token) throw new Error('Authentication required');
    return httpDelete<{ message: string }>(`/conference/official/delegates/members/${memberId}`, { token });
  }

  // POST /conference/official/payment - Submit payment for conference
  submitConferencePaymentOfficial(data: { amount_to_pay: number; payment_reference?: string }) {
    const token = this.getToken();
    if (!token) throw new Error('Authentication required');
    return httpPost<{ message: string; payment_id: number }>('/conference/official/payment', data, { token });
  }

  // Upload payment proof for official conference payment (same endpoint, with file)
  uploadConferencePaymentProofOfficial(file: File, paymentData?: { amount_to_pay: number; payment_reference?: string }) {
    const token = this.getToken();
    if (!token) throw new Error('Authentication required');
    const formData = new FormData();
    formData.append('file', file);
    if (paymentData) {
      formData.append('amount_to_pay', String(paymentData.amount_to_pay));
      if (paymentData.payment_reference) {
        formData.append('payment_reference', paymentData.payment_reference);
      }
    }
    return httpPostFormData<{ message: string; payment_id: number }>('/conference/official/payment', formData, token);
  }

  // POST /conference/official/food-preference - Set food preference counts
  setConferenceFoodPreference(data: { conference_id: number; veg_count: number; non_veg_count: number }) {
    const token = this.getToken();
    if (!token) throw new Error('Authentication required');
    return httpPost<{
      id: number;
      conference_id: number;
      veg_count: number;
      non_veg_count: number;
      uploaded_by_id: number;
      created_at: string;
      updated_at: string;
    }>('/conference/official/food-preference', data, { token });
  }

  // GET /conference/official/export-excel - Export unit's conference data to Excel
  async getConferenceExportData() {
    const token = this.getToken();
    if (!token) throw new Error('Authentication required');
    return httpGet<{
      message: string;
      district: string;
      data: {
        officials: Array<{ id: number; name: string; phone: string; gender?: string }>;
        members: Array<{ id: number; name: string; phone: string; gender: string }>;
        payments: Array<{
          amount_to_pay: number;
          uploaded_by: string;
          date: string;
          status: string;
          proof_path: string | null;
          payment_reference: string | null;
        }>;
        count_of_officials: number;
        count_of_members: number;
        count_of_male_members: number;
        count_of_female_members: number;
        veg_count: number;
        non_veg_count: number;
      };
    }>('/conference/official/export-excel', { token });
  }

  // -------------------------
  // Conference - Admin Endpoints
  // -------------------------

  // Conference Public Type for API responses
  private conferencePublicType = {} as {
    id: number;
    title: string;
    details: string;
    added_on: string;
    status: 'Active' | 'Inactive' | 'Completed';
  };

  // GET /admin/conference/home - List all conferences (admin)
  getConferencesAdmin() {
    const token = this.getToken();
    if (!token) throw new Error('Authentication required');
    return httpGet<Array<typeof this.conferencePublicType>>('/admin/conference/home', { token });
  }

  // POST /admin/conference - Create a new conference
  createConferenceAdmin(data: { title: string; details?: string }) {
    const token = this.getToken();
    if (!token) throw new Error('Authentication required');
    return httpPost<typeof this.conferencePublicType>('/admin/conference', data, { token });
  }

  // PUT /admin/conference/{conference_id} - Update a conference
  updateConferenceAdmin(conferenceId: number, data: { title?: string; details?: string; status?: string }) {
    const token = this.getToken();
    if (!token) throw new Error('Authentication required');
    return httpPut<typeof this.conferencePublicType>(`/admin/conference/${conferenceId}`, data, { token });
  }

  // DELETE /admin/conference/{conference_id} - Delete a conference
  deleteConferenceAdmin(conferenceId: number) {
    const token = this.getToken();
    if (!token) throw new Error('Authentication required');
    return httpDelete<{ message: string }>(`/admin/conference/${conferenceId}`, { token });
  }

  // GET /admin/conference/{conference_id}/info - Get conference info with district statistics
  getConferenceInfoAdmin(conferenceId: number) {
    const token = this.getToken();
    if (!token) throw new Error('Authentication required');
    return httpGet<{
      conference_id: number;
      district_info: Record<string, {
        officials: Array<{ id: number; name: string; phone: string; gender?: string }>;
        members: Array<{ id: number; name: string; phone: string; gender: string }>;
        payments: Array<{
          amount_to_pay: number;
          uploaded_by: string;
          date: string;
          status: string;
          proof_path: string | null;
          payment_reference: string | null;
        }>;
        count_of_officials: number;
        count_of_members: number;
        count_of_male_members: number;
        count_of_female_members: number;
        count_of_male_officials: number;
        count_of_female_officials: number;
        count_of_total_male: number;
        count_of_total_female: number;
        total_count: number;
        veg_count: number;
        non_veg_count: number;
      }>;
    }>(`/admin/conference/${conferenceId}/info`, { token });
  }

  // POST /admin/conference/{conference_id}/info/export - Export conference info to Excel
  exportConferenceInfoAdmin(conferenceId: number) {
    const token = this.getToken();
    if (!token) throw new Error('Authentication required');
    return httpPost<{
      message: string;
      conference_id: number;
      data: Record<string, any>;
    }>(`/admin/conference/${conferenceId}/info/export`, {}, { token });
  }

  // GET /admin/conference/{conference_id}/payment-info - Get payment info for conference
  getConferencePaymentInfoAdmin(conferenceId: number) {
    const token = this.getToken();
    if (!token) throw new Error('Authentication required');
    return httpGet<{
      conference_id: number;
      district_info: Record<string, {
        officials: Array<{ id: number; name: string; phone: string }>;
        members: Array<{ id: number; name: string; phone: string }>;
        payments: Array<{
          amount_to_pay: number;
          uploaded_by: string;
          date: string;
          status: string;
          proof_path: string | null;
          payment_reference: string | null;
        }>;
        count_of_officials: number;
        count_of_members: number;
      }>;
    }>(`/admin/conference/${conferenceId}/payment-info`, { token });
  }

  // POST /admin/conference/{conference_id}/payment-info/export - Export payment info to Excel
  exportConferencePaymentInfoAdmin(conferenceId: number) {
    const token = this.getToken();
    if (!token) throw new Error('Authentication required');
    return httpPost<{
      message: string;
      conference_id: number;
      data: Record<string, any>;
    }>(`/admin/conference/${conferenceId}/payment-info/export`, {}, { token });
  }

  // GET /admin/conference/officials - Get all district officials
  getConferenceOfficialsAdmin() {
    const token = this.getToken();
    if (!token) throw new Error('Authentication required');
    return httpGet<Array<{
      id: number;
      name: string;
      phone: string;
      district: string | null;
      conference_id: number | null;
      conference_official_count: number;
      conference_member_count: number;
    }>>('/admin/conference/officials', { token });
  }

  // POST /admin/conference/officials - Add a district official
  addConferenceOfficialAdmin(data: { conference_id: number; member_id: number }) {
    const token = this.getToken();
    if (!token) throw new Error('Authentication required');
    return httpPost<{
      message: string;
      official_id: number;
      username: string;
    }>('/admin/conference/officials', data, { token });
  }

  // PUT /admin/conference/officials/{official_id} - Update district official counts
  updateConferenceOfficialAdmin(officialId: number, data: { conference_official_count?: number; conference_member_count?: number }) {
    const token = this.getToken();
    if (!token) throw new Error('Authentication required');
    return httpPut<{
      message: string;
      official_id: number;
    }>(`/admin/conference/officials/${officialId}`, data, { token });
  }

  // DELETE /admin/conference/officials/{official_id} - Delete a district official
  deleteConferenceOfficialAdmin(officialId: number) {
    const token = this.getToken();
    if (!token) throw new Error('Authentication required');
    return httpDelete<{ message: string }>(`/admin/conference/officials/${officialId}`, { token });
  }

  // GET /admin/conference/{conference_id}/districts/{district_id}/members - Get members for a district
  getConferenceDistrictMembersAdmin(conferenceId: number, districtId: number) {
    const token = this.getToken();
    if (!token) throw new Error('Authentication required');
    return httpGet<Array<{
      id: number;
      name: string;
      number: string;
      gender: string;
      dob: string;
    }>>(`/admin/conference/${conferenceId}/districts/${districtId}/members`, { token });
  }

  // Legacy aliases for backward compatibility
  getDistrictOfficialsAdmin() {
    return this.getConferenceOfficialsAdmin();
  }

  createDistrictOfficialAdmin(data: { conference_id: number; member_id: number }) {
    return this.addConferenceOfficialAdmin(data);
  }

  updateDistrictOfficialAdmin(officialId: number, data: { conference_official_count?: number; conference_member_count?: number }) {
    return this.updateConferenceOfficialAdmin(officialId, data);
  }

  deleteDistrictOfficialAdmin(officialId: number) {
    return this.deleteConferenceOfficialAdmin(officialId);
  }

  // -------------------------
  // Conference - Legacy/Backward Compatible Endpoints
  // -------------------------
  
  // Legacy: Get conferences (old endpoint)
  getConferences(token: string) {
    return httpGet<ConferenceItem[]>('/conference/', { token });
  }

  // Legacy: Create conference (old endpoint)
  createConference(payload: { title: string; details?: string }, token: string) {
    return httpPost<ConferenceItem>('/conference/', payload, { token });
  }

  // Legacy: Add conference delegate (old endpoint)
  addConferenceDelegate(payload: { conference_id: number; official_user_id: number; member_id?: number }, token: string) {
    return httpPost<{ status: string }>('/conference/delegate', payload, { token });
  }

  // Legacy: Add conference payment (old endpoint)
  addConferencePayment(payload: { conference_id: number; amount_to_pay: number; payment_reference?: string }, token: string) {
    return httpPost<PaymentRecord>('/conference/payment', payload, { token });
  }

  // Legacy: Upload conference payment proof (old endpoint)
  uploadConferencePaymentProof(paymentId: number, file: File, token: string) {
    const formData = new FormData();
    formData.append('file', file);
    return httpPost<PaymentRecord>(`/conference/payment/${paymentId}/proof`, formData, {
      token,
      headers: { 'Content-Type': undefined as any },
    });
  }

  // Legacy: Update conference payment status (old endpoint)
  updateConferencePaymentStatus(paymentId: number, status_value: PaymentStatus, token: string) {
    return httpPost<PaymentRecord>(`/conference/payment/${paymentId}/status`, { status_value }, { token });
  }

  // -------------------------
  // Kalamela Public
  // -------------------------
  // List all individual events
  getKalamelaIndividualEvents() {
    return httpGet<any[]>('/kalamela/events/individual');
  }

  // List all group events
  getKalamelaGroupEvents() {
    return httpGet<any[]>('/kalamela/events/group');
  }

  // Get individual event details with participations
  getKalamelaIndividualEventDetails(eventId: number) {
    return httpGet<any>(`/kalamela/events/individual/${eventId}`);
  }

  // Get group event details with participations
  getKalamelaGroupEventDetails(eventId: number) {
    return httpGet<any>(`/kalamela/events/group/${eventId}`);
  }

  // List individual participations with optional filters
  getKalamelaIndividualParticipations(filters?: { event_id?: number; district_id?: number }) {
    return httpGet<any[]>('/kalamela/participations/individual', { query: filters });
  }

  // List group participations with optional filters
  getKalamelaGroupParticipations(filters?: { event_id?: number; district_id?: number }) {
    return httpGet<any[]>('/kalamela/participations/group', { query: filters });
  }

  // Get results (top 3 by default)
  getKalamelaIndividualResults() {
    return httpGet<any[]>('/kalamela/results/individual');
  }

  getKalamelaGroupResults() {
    return httpGet<any[]>('/kalamela/results/group');
  }

  submitKalamelaAppeal(payload: { participant_id: number; chest_number: string; event_name: string; statement: string }) {
    return httpPost<any>('/kalamela/appeals', payload);
  }

  // -------------------------
  // Kalamela Official (role 2 or 3)
  // -------------------------
  addOfficialIndividualParticipation(
    payload: { individual_event_id: number; participant_id: number; seniority_category?: 'Junior' | 'Senior' },
    token: string
  ) {
    return httpPost<any>('/kalamela/official/individual-participations', payload, { token });
  }

  addOfficialGroupParticipation(payload: { group_event_id: number; participant_id: number }, token: string) {
    return httpPost<any>('/kalamela/official/group-participations', payload, { token });
  }

  addOfficialPayments(payload: { individual_events_count: number; group_events_count: number }, token: string) {
    return httpPost<any>('/kalamela/official/payments', payload, { token });
  }

  uploadOfficialPaymentProof(paymentId: number, file: File, token: string) {
    const formData = new FormData();
    formData.append('file', file);
    return httpPost<any>(`/kalamela/official/payments/${paymentId}/proof`, formData, {
      token,
      headers: { 'Content-Type': undefined as any },
    });
  }

  // -------------------------
  // Kalamela Admin (role 1)
  // -------------------------
  createAdminIndividualEvent(payload: IndividualEventCreate, token: string) {
    return httpPost<IndividualEvent>('/kalamela/admin/events/individual', payload, { token });
  }

  createAdminGroupEvent(payload: GroupEventCreate, token: string) {
    return httpPost<GroupEvent>('/kalamela/admin/events/group', payload, { token });
  }

  addAdminIndividualScore(payload: { participation_id: number; awarded_mark: number; grade?: string; total_points: number }, token: string) {
    return httpPost<any>('/kalamela/admin/scores/individual', payload, { token });
  }

  addAdminGroupScore(payload: { event_name: string; chest_number: string; awarded_mark: number; grade?: string; total_points: number }, token: string) {
    return httpPost<any>('/kalamela/admin/scores/group', payload, { token });
  }

  updateAdminPaymentStatus(paymentId: number, status_value: PaymentStatus, token: string) {
    return httpPost<any>(`/kalamela/admin/payments/${paymentId}/status`, { status_value }, { token });
  }

  // -------------------------
  // Dashboard & Data Methods (No Mock Fallback)
  // -------------------------
  async getDashboardMetrics(): Promise<ApiResponse<Metric[]>> {
    const token = this.getToken();
    if (!token) throw new Error('Authentication required');
    const data = await httpGet<Metric[]>('/admin/dashboard/metrics', { token });
    return { data, status: 200 };
  }

  async getRecentRegistrations(token?: string): Promise<ApiResponse<Participant[]>> {
    const authToken = token || this.getToken();
    if (!authToken) throw new Error('Authentication required');
    
    const participations = await this.getKalamelaIndividualParticipations();
    const mapped: Participant[] = participations.map((p: any) => ({
      id: String(p.id),
      chestNumber: p.chest_number,
      name: `Participant ${p.participant_id}`,
      unit: 'N/A',
      district: 'N/A',
      category: p.seniority_category || 'N/A',
      points: 0,
    }));
    return { data: mapped, status: 200 };
  }

  async getChartData(token?: string): Promise<ApiResponse<any[]>> {
    const authToken = token || this.getToken();
    if (!authToken) throw new Error('Authentication required');
    
    const stats = await this.getDistrictStatistics(authToken);
    const chartData = stats.map((s: any) => ({
      name: s.district_name,
      participants: s.members,
    }));
    return { data: chartData, status: 200 };
  }

  async getEvents(token?: string): Promise<ApiResponse<EventItem[]>> {
    const [individual, group] = await Promise.all([
      this.getKalamelaIndividualEvents(),
      this.getKalamelaGroupEvents()
    ]);
    
    const mapped: EventItem[] = [
      ...individual.map((e: any) => ({
        id: String(e.id),
        name: e.name,
        type: 'Individual' as const,
        status: 'Scheduled' as const,
        registeredCount: 0,
        totalSlots: 100,
      })),
      ...group.map((e: any) => ({
        id: String(e.id),
        name: e.name,
        type: 'Group' as const,
        status: 'Scheduled' as const,
        registeredCount: 0,
        totalSlots: e.max_allowed_limit,
      }))
    ];
    return { data: mapped, status: 200 };
  }

  async getScores(eventId: string, token?: string): Promise<ApiResponse<ScoreEntry[]>> {
    const authToken = token || this.getToken();
    if (!authToken) throw new Error('Authentication required');
    
    const results = await this.getKalamelaIndividualResults();
    const mapped: ScoreEntry[] = results.map((r: any) => ({
      chestNumber: String(r.id),
      name: `Participant ${r.participant_id}`,
      judge1: Math.floor(r.awarded_mark / 3),
      judge2: Math.floor(r.awarded_mark / 3),
      judge3: Math.floor(r.awarded_mark / 3),
      total: r.awarded_mark,
      grade: r.grade,
    }));
    return { data: mapped, status: 200 };
  }

  async saveScores(eventId: string, scores: ScoreEntry[], token?: string): Promise<ApiResponse<boolean>> {
    if (scores.some(s => s.total > 100)) {
      throw new Error('Validation Error: Score cannot exceed 100');
    }
    
    const authToken = token || this.getToken();
    if (!authToken) throw new Error('Authentication required');
    
    for (const score of scores) {
      await this.addAdminIndividualScore({
        participation_id: Number(eventId),
        awarded_mark: score.total,
        grade: score.grade,
        total_points: score.total,
      }, authToken);
    }
    return { data: true, message: 'Scores saved successfully', status: 200 };
  }

  async searchParticipant(query: string, token?: string): Promise<ApiResponse<Participant | null>> {
    const authToken = token || this.getToken();
    if (!authToken) throw new Error('Authentication required');
    
    const participations = await this.getKalamelaIndividualParticipations();
    const found = participations.find((p: any) => 
      p.chest_number === query || 
      p.chest_number.toLowerCase().includes(query.toLowerCase())
    );
    
    if (found) {
      return {
        data: {
          id: String(found.id),
          chestNumber: found.chest_number,
          name: `Participant ${found.participant_id}`,
          unit: 'N/A',
          district: 'N/A',
          category: found.seniority_category || 'N/A',
          points: 0,
        },
        status: 200
      };
    }
    return { data: null, status: 200 };
  }

  // -------------------------
  // ==================== ADMIN UNITS ENDPOINTS ====================

  // GET /admin/units/dashboard - Units Admin Dashboard Stats
  // Supports ?refresh=true to bypass cache and fetch fresh data
  async getUnitStats(options?: { refresh?: boolean }): Promise<ApiResponse<UnitStats>> {
    const token = this.getToken();
    if (!token) throw new Error('Authentication required');
    
    // API returns snake_case fields
    interface ApiUnitStats {
      total_dist_count: number;
      total_units_count: number;
      completed_dist_count: number;
      completed_units_count: number;
      completed_dists_percent: string;
      completed_units_percent: string;
      total_unit_members: number;
      total_male_members: number;
      total_female_members: number;
      max_member_unit: string;
      max_member_unit_count: number;
      pending_requests?: number;
    }
    
    const endpoint = options?.refresh ? '/admin/units/dashboard?refresh=true' : '/admin/units/dashboard';
    const rawData = await httpGet<ApiUnitStats>(endpoint, { token });
    
    // Transform API response to match UnitStats interface
    const data: UnitStats = {
      totalDistricts: rawData.total_dist_count,
      completedDistricts: rawData.completed_dist_count,
      totalUnits: rawData.total_units_count,
      completedUnits: rawData.completed_units_count,
      totalMembers: rawData.total_unit_members,
      maleMembers: rawData.total_male_members,
      femaleMembers: rawData.total_female_members,
      pendingRequests: rawData.pending_requests || 0,
      maxMemberUnit: rawData.max_member_unit,
      maxMemberCount: rawData.max_member_unit_count,
    };
    
    return { data, status: 200 };
  }

  // GET /admin/units - Get all units
  async getUnits(): Promise<ApiResponse<Unit[]>> {
    const token = this.getToken();
    if (!token) throw new Error('Authentication required');
    
    // API returns: { id, user_id, username, unit_name, status }
    interface ApiUnit {
      id: number;
      user_id: number;
      username: string;
      unit_name: string;
      status: string;
    }
    
    // API may return paginated response or direct array
    interface PaginatedResponse {
      data?: ApiUnit[];
      items?: ApiUnit[];
      total?: number;
      page?: number;
      page_size?: number;
    }
    
    const rawResponse = await httpGet<ApiUnit[] | PaginatedResponse>('/admin/units', { 
      token,
      query: { page: 1, page_size: 1000 }
    });
    
    // Handle both array and paginated response formats (API may return { data: [...] } or { items: [...] } or direct array)
    const rawData: ApiUnit[] = Array.isArray(rawResponse) ? rawResponse : (rawResponse.data || rawResponse.items || []);
    
    // Transform API response to match Unit interface
    const data: Unit[] = rawData.map(unit => ({
      id: unit.id,
      unitNumber: unit.username,
      name: unit.unit_name,
      clergyDistrict: this.extractClergyDistrict(unit.username),
      registrationYear: new Date().getFullYear(), // Default to current year since API doesn't provide it
      status: this.mapUnitStatus(unit.status),
      membersCount: 0, // API doesn't provide this
      officialsCount: 0, // API doesn't provide this
      councilorsCount: 0, // API doesn't provide this
    }));
    
    return { data, status: 200 };
  }
  
  // Helper to extract clergy district code from username (e.g., "MKDYM/MAV/002" -> "MAV")
  private extractClergyDistrict(username: string): string {
    const parts = username.split('/');
    return parts.length >= 2 ? parts[1] : 'Unknown';
  }
  
  // Helper to map API status to Unit status
  private mapUnitStatus(apiStatus: string): 'Completed' | 'Pending' | 'Not Registered' {
    if (apiStatus === 'Registration Completed') return 'Completed';
    if (apiStatus.includes('Started') || apiStatus.includes('Completed') || apiStatus.includes('Accepted')) return 'Pending';
    return 'Not Registered';
  }

  // GET /admin/units/{unit_id} - Get unit by ID
  async getUnitById(id: number): Promise<ApiResponse<Unit>> {
    const token = this.getToken();
    if (!token) throw new Error('Authentication required');
    const data = await httpGet<Unit>(`/admin/units/${id}`, { token });
    return { data, status: 200 };
  }

  // GET /admin/units/members - Get all members (optionally filtered by unit)
  async getUnitMembers(unitId?: number): Promise<ApiResponse<UnitMember[]>> {
    const token = this.getToken();
    if (!token) throw new Error('Authentication required');
    
    interface ApiMember {
      id: number;
      registered_user_id: number;
      unit_name: string;
      district: string;
      name: string;
      gender: string;
      dob: string;
      age: number;
      number: string;
      qualification: string;
      blood_group: string;
    }
    
    const response = await httpGet<{ data: ApiMember[], total: number, page: number, page_size: number, pages: number }>('/admin/units/members', { 
      token,
      query: unitId ? { unit_id: unitId } : undefined 
    });
    
    // Transform snake_case API response to camelCase
    const members: UnitMember[] = response.data.map(m => ({
      id: m.id,
      name: m.name,
      gender: m.gender as 'M' | 'F',
      number: m.number,
      dob: m.dob,
      age: m.age,
      qualification: m.qualification || undefined,
      bloodGroup: m.blood_group || undefined,
      unitId: m.registered_user_id,
      unitName: m.unit_name,
    }));
    
    return { data: members, status: 200 };
  }

  // GET /admin/units/officials - Get all officials (optionally filtered by unit)
  // API uses pagination: ?page=1&page_size=50
  async getUnitOfficials(unitId?: number): Promise<ApiResponse<UnitOfficial[]>> {
    const token = this.getToken();
    if (!token) throw new Error('Authentication required');
    
    // API returns snake_case fields
    interface ApiUnitOfficial {
      id: number;
      registered_user_id: number;
      unit_name: string;
      district: string;
      president_designation: string;
      president_name: string;
      president_phone: string;
      vice_president_name: string;
      vice_president_phone: string;
      secretary_name: string;
      secretary_phone: string;
      joint_secretary_name: string;
      joint_secretary_phone: string;
      treasurer_name: string;
      treasurer_phone: string;
    }
    
    // API may return paginated response or direct array
    interface PaginatedResponse {
      data?: ApiUnitOfficial[];
      items?: ApiUnitOfficial[];
      total?: number;
      page?: number;
      page_size?: number;
    }
    
    const query: Record<string, any> = unitId ? { unit_id: unitId } : {};
    // Request large page size to get all records
    query.page = 1;
    query.page_size = 1000;
    
    const rawResponse = await httpGet<ApiUnitOfficial[] | PaginatedResponse>('/admin/units/officials', { 
      token,
      query 
    });
    
    // Handle both array and paginated response formats (API may return { data: [...] } or { items: [...] } or direct array)
    const rawData: ApiUnitOfficial[] = Array.isArray(rawResponse) ? rawResponse : (rawResponse.data || rawResponse.items || []);
    
    // Transform API response to match UnitOfficial interface
    const data: UnitOfficial[] = rawData.map(official => ({
      id: official.id,
      unitId: official.registered_user_id,
      unitName: official.unit_name,
      presidentDesignation: official.president_designation,
      presidentName: official.president_name,
      presidentPhone: official.president_phone,
      vicePresidentName: official.vice_president_name,
      vicePresidentPhone: official.vice_president_phone,
      secretaryName: official.secretary_name,
      secretaryPhone: official.secretary_phone,
      jointSecretaryName: official.joint_secretary_name,
      jointSecretaryPhone: official.joint_secretary_phone,
      treasurerName: official.treasurer_name,
      treasurerPhone: official.treasurer_phone,
    }));
    
    return { data, status: 200 };
  }

  // GET /admin/units/councilors - Get all councilors (optionally filtered by unit)
  // API uses pagination: ?page=1&page_size=50
  async getUnitCouncilors(unitId?: number): Promise<ApiResponse<UnitCouncilor[]>> {
    const token = this.getToken();
    if (!token) throw new Error('Authentication required');
    
    // API returns snake_case fields
    interface ApiUnitCouncilor {
      id: number;
      registered_user_id: number;
      unit_name: string;
      district: string;
      unit_member_id: number;
      member_name: string;
      member_gender: string;
      member_phone: string;
    }
    
    // API may return paginated response or direct array
    interface PaginatedResponse {
      data?: ApiUnitCouncilor[];
      items?: ApiUnitCouncilor[];
      total?: number;
      page?: number;
      page_size?: number;
    }
    
    const query: Record<string, any> = unitId ? { unit_id: unitId } : {};
    // Request large page size to get all records
    query.page = 1;
    query.page_size = 1000;
    
    const rawResponse = await httpGet<ApiUnitCouncilor[] | PaginatedResponse>('/admin/units/councilors', { 
      token,
      query 
    });
    
    // Handle both array and paginated response formats (API may return { data: [...] } or { items: [...] } or direct array)
    const rawData: ApiUnitCouncilor[] = Array.isArray(rawResponse) ? rawResponse : (rawResponse.data || rawResponse.items || []);
    
    // Transform API response to match UnitCouncilor interface
    const data: UnitCouncilor[] = rawData.map(councilor => ({
      id: councilor.id,
      unitId: councilor.registered_user_id,
      unitName: councilor.unit_name,
      memberId: councilor.unit_member_id,
      memberName: councilor.member_name,
      memberPhone: councilor.member_phone,
      memberGender: councilor.member_gender,
      memberDob: '', // API doesn't provide this
      memberQualification: undefined, // API doesn't provide this
    }));
    
    return { data, status: 200 };
  }

  // GET /admin/units/transfer-requests - Get all transfer requests
  async getTransferRequests(): Promise<ApiResponse<TransferRequest[]>> {
    const token = this.getToken();
    if (!token) throw new Error('Authentication required');
    
    // API returns snake_case fields
    interface ApiTransferRequest {
      id: number;
      unit_member_id: number;
      destination_unit_id: number;
      reason: string;
      current_unit_id: number;
      original_registered_user_id: number | null;
      proof?: string;
      status: string;
      created_at: string;
      updated_at: string;
      member_name?: string;
      current_unit_name?: string;
      destination_unit_name?: string;
    }
    
    // API may return paginated response or direct array
    interface PaginatedResponse {
      data?: ApiTransferRequest[];
      items?: ApiTransferRequest[];
      total?: number;
      page?: number;
      page_size?: number;
    }
    
    const rawResponse = await httpGet<ApiTransferRequest[] | PaginatedResponse>('/admin/units/transfer-requests', { 
      token,
      query: { page: 1, page_size: 1000 }
    });
    
    // Handle both array and paginated response formats (API may return { data: [...] } or { items: [...] } or direct array)
    const rawData: ApiTransferRequest[] = Array.isArray(rawResponse) ? rawResponse : (rawResponse.data || rawResponse.items || []);
    
    // Transform API response to match TransferRequest interface
    const data: TransferRequest[] = rawData.map(request => ({
      id: request.id,
      createdAt: request.created_at,
      memberId: request.unit_member_id,
      memberName: request.member_name || `Member #${request.unit_member_id}`,
      currentUnitId: request.current_unit_id,
      currentUnitName: request.current_unit_name || `Unit #${request.current_unit_id}`,
      destinationUnitId: request.destination_unit_id,
      destinationUnitName: request.destination_unit_name || `Unit #${request.destination_unit_id}`,
      reason: request.reason,
      status: request.status as RequestStatus,
      proof: request.proof,
    }));
    
    return { data, status: 200 };
  }

  // GET /admin/units/member-change-requests - Get member info change requests
  async getMemberInfoChangeRequests(): Promise<ApiResponse<MemberInfoChangeRequest[]>> {
    const token = this.getToken();
    if (!token) throw new Error('Authentication required');
    
    // API returns snake_case fields with original values and requested changes
    interface ApiMemberInfoChangeRequest {
      id: number;
      unit_member_id: number;
      reason: string;
      name: string | null;
      gender: string | null;
      dob: string | null;
      blood_group: string | null;
      qualification: string | null;
      original_name: string;
      original_gender: string;
      original_dob: string;
      original_blood_group: string;
      original_qualification: string;
      proof?: string;
      status: string;
      created_at: string;
      updated_at: string;
      unit_name?: string;
    }
    
    // API may return paginated response or direct array
    interface PaginatedResponse {
      data?: ApiMemberInfoChangeRequest[];
      items?: ApiMemberInfoChangeRequest[];
      total?: number;
      page?: number;
      page_size?: number;
    }
    
    const rawResponse = await httpGet<ApiMemberInfoChangeRequest[] | PaginatedResponse>('/admin/units/member-change-requests', { 
      token,
      query: { page: 1, page_size: 1000 }
    });
    
    // Handle both array and paginated response formats (API may return { data: [...] } or { items: [...] } or direct array)
    const rawData: ApiMemberInfoChangeRequest[] = Array.isArray(rawResponse) ? rawResponse : (rawResponse.data || rawResponse.items || []);
    
    // Transform API response to match MemberInfoChangeRequest interface
    const data: MemberInfoChangeRequest[] = rawData.map(request => ({
      id: request.id,
      createdAt: request.created_at,
      memberId: request.unit_member_id,
      memberName: request.original_name,
      unitName: request.unit_name || '',
      changes: {
        name: request.name || undefined,
        gender: request.gender || undefined,
        dob: request.dob || undefined,
        bloodGroup: request.blood_group || undefined,
        qualification: request.qualification || undefined,
      },
      reason: request.reason,
      status: request.status as RequestStatus,
      proof: request.proof,
    }));
    
    return { data, status: 200 };
  }

  // GET /admin/units/officials-change-requests - Get officials change requests
  async getOfficialsChangeRequests(): Promise<ApiResponse<OfficialsChangeRequest[]>> {
    const token = this.getToken();
    if (!token) throw new Error('Authentication required');
    
    // API returns flat snake_case fields with original_ prefix for current values
    interface ApiOfficialsChangeRequest {
      id: number;
      unit_official_id: number;
      reason: string;
      // Requested changes (null if not changing)
      president_designation: string | null;
      president_name: string | null;
      president_phone: string | null;
      vice_president_name: string | null;
      vice_president_phone: string | null;
      secretary_name: string | null;
      secretary_phone: string | null;
      joint_secretary_name: string | null;
      joint_secretary_phone: string | null;
      treasurer_name: string | null;
      treasurer_phone: string | null;
      // Original values
      original_president_designation: string;
      original_president_name: string;
      original_president_phone: string;
      original_vice_president_name: string;
      original_vice_president_phone: string;
      original_secretary_name: string;
      original_secretary_phone: string;
      original_joint_secretary_name: string;
      original_joint_secretary_phone: string;
      original_treasurer_name: string;
      original_treasurer_phone: string;
      proof?: string;
      status: string;
      created_at: string;
      updated_at: string;
      unit_name?: string;
    }
    
    // API may return paginated response or direct array
    interface PaginatedResponse {
      data?: ApiOfficialsChangeRequest[];
      items?: ApiOfficialsChangeRequest[];
      total?: number;
      page?: number;
      page_size?: number;
    }
    
    const rawResponse = await httpGet<ApiOfficialsChangeRequest[] | PaginatedResponse>('/admin/units/officials-change-requests', { 
      token,
      query: { page: 1, page_size: 1000 }
    });
    
    // Handle both array and paginated response formats (API may return { data: [...] } or { items: [...] } or direct array)
    const rawData: ApiOfficialsChangeRequest[] = Array.isArray(rawResponse) ? rawResponse : (rawResponse.data || rawResponse.items || []);
    
    // Transform API response to match OfficialsChangeRequest interface
    const data: OfficialsChangeRequest[] = rawData.map(request => ({
      id: request.id,
      createdAt: request.created_at,
      unitId: request.unit_official_id,
      unitName: request.unit_name || '',
      originalOfficials: {
        presidentDesignation: request.original_president_designation || undefined,
        presidentName: request.original_president_name,
        presidentPhone: request.original_president_phone,
        vicePresidentName: request.original_vice_president_name,
        vicePresidentPhone: request.original_vice_president_phone,
        secretaryName: request.original_secretary_name,
        secretaryPhone: request.original_secretary_phone,
        jointSecretaryName: request.original_joint_secretary_name,
        jointSecretaryPhone: request.original_joint_secretary_phone,
        treasurerName: request.original_treasurer_name,
        treasurerPhone: request.original_treasurer_phone,
      },
      requestedChanges: {
        presidentDesignation: request.president_designation || undefined,
        presidentName: request.president_name || undefined,
        presidentPhone: request.president_phone || undefined,
        vicePresidentName: request.vice_president_name || undefined,
        vicePresidentPhone: request.vice_president_phone || undefined,
        secretaryName: request.secretary_name || undefined,
        secretaryPhone: request.secretary_phone || undefined,
        jointSecretaryName: request.joint_secretary_name || undefined,
        jointSecretaryPhone: request.joint_secretary_phone || undefined,
        treasurerName: request.treasurer_name || undefined,
        treasurerPhone: request.treasurer_phone || undefined,
      },
      reason: request.reason,
      status: request.status as RequestStatus,
      proof: request.proof,
    }));
    
    return { data, status: 200 };
  }

  // GET /admin/units/councilor-change-requests - Get councilor change requests
  async getCouncilorChangeRequests(): Promise<ApiResponse<CouncilorChangeRequest[]>> {
    const token = this.getToken();
    if (!token) throw new Error('Authentication required');
    
    // API returns snake_case fields
    interface ApiCouncilorChangeRequest {
      id: number;
      unit_councilor_id: number;
      reason: string;
      unit_member_id: number; // New member ID
      original_unit_member_id: number;
      proof?: string;
      status: string;
      created_at: string;
      updated_at: string;
      unit_id?: number;
      unit_name?: string;
      new_member_name?: string;
      original_member_name?: string;
    }
    
    // API may return paginated response or direct array
    interface PaginatedResponse {
      data?: ApiCouncilorChangeRequest[];
      items?: ApiCouncilorChangeRequest[];
      total?: number;
      page?: number;
      page_size?: number;
    }
    
    const rawResponse = await httpGet<ApiCouncilorChangeRequest[] | PaginatedResponse>('/admin/units/councilor-change-requests', { 
      token,
      query: { page: 1, page_size: 1000 }
    });
    
    // Handle both array and paginated response formats (API may return { data: [...] } or { items: [...] } or direct array)
    const rawData: ApiCouncilorChangeRequest[] = Array.isArray(rawResponse) ? rawResponse : (rawResponse.data || rawResponse.items || []);
    
    // Transform API response to match CouncilorChangeRequest interface
    const data: CouncilorChangeRequest[] = rawData.map(request => ({
      id: request.id,
      createdAt: request.created_at,
      unitId: request.unit_id || 0,
      unitName: request.unit_name || '',
      councilorId: request.unit_councilor_id,
      originalMemberId: request.original_unit_member_id,
      originalMemberName: request.original_member_name || `Member #${request.original_unit_member_id}`,
      newMemberId: request.unit_member_id,
      newMemberName: request.new_member_name || `Member #${request.unit_member_id}`,
      reason: request.reason,
      status: request.status as RequestStatus,
      proof: request.proof,
    }));
    
    return { data, status: 200 };
  }

  // GET /admin/units/member-add-requests - Get member add requests
  async getMemberAddRequests(): Promise<ApiResponse<MemberAddRequest[]>> {
    const token = this.getToken();
    if (!token) throw new Error('Authentication required');
    
    // API returns snake_case fields
    interface ApiMemberAddRequest {
      id: number;
      registered_user_id: number;
      name: string;
      gender: string;
      dob: string;
      number: string;
      qualification?: string;
      blood_group?: string;
      reason: string;
      proof?: string;
      status: string;
      created_at: string;
      updated_at: string;
      unit_name?: string;
    }
    
    // API may return paginated response or direct array
    interface PaginatedResponse {
      data?: ApiMemberAddRequest[];
      items?: ApiMemberAddRequest[];
      total?: number;
      page?: number;
      page_size?: number;
    }
    
    const rawResponse = await httpGet<ApiMemberAddRequest[] | PaginatedResponse>('/admin/units/member-add-requests', { 
      token,
      query: { page: 1, page_size: 1000 }
    });
    
    // Handle both array and paginated response formats (API may return { data: [...] } or { items: [...] } or direct array)
    const rawData: ApiMemberAddRequest[] = Array.isArray(rawResponse) ? rawResponse : (rawResponse.data || rawResponse.items || []);
    
    // Transform API response to match MemberAddRequest interface
    const data: MemberAddRequest[] = rawData.map(request => ({
      id: request.id,
      createdAt: request.created_at,
      unitId: request.registered_user_id,
      unitName: request.unit_name || '',
      name: request.name,
      gender: request.gender as 'M' | 'F',
      number: request.number,
      dob: request.dob,
      qualification: request.qualification || undefined,
      bloodGroup: request.blood_group || undefined,
      reason: request.reason,
      status: request.status as RequestStatus,
      proof: request.proof || undefined,
    }));
    
    return { data, status: 200 };
  }

  // Helper to map request type to API endpoint path
  private getRequestEndpointPath(type: string): string {
    const typeMap: Record<string, string> = {
      'Transfer': 'transfer-requests',
      'Member Info Change': 'member-change-requests',
      'Officials Change': 'officials-change-requests',
      'Councilor Change': 'councilor-change-requests',
      'Member Add': 'member-add-requests',
    };
    return typeMap[type] || type.toLowerCase().replace(/\s+/g, '-') + 's';
  }

  // PUT /admin/units/{type}/{request_id}/approve
  async approveRequest(requestId: number, type: string, remarks?: string): Promise<ApiResponse<boolean>> {
    const token = this.getToken();
    if (!token) throw new Error('Authentication required');
    const endpointPath = this.getRequestEndpointPath(type);
    const endpoint = `/admin/units/${endpointPath}/${requestId}/approve`;
    await httpPut<any>(endpoint, remarks ? { remarks } : {}, { token });
    return { data: true, message: `${type} request approved successfully`, status: 200 };
  }

  // PUT /admin/units/{type}/{request_id}/reject
  async rejectRequest(requestId: number, type: string, remarks?: string): Promise<ApiResponse<boolean>> {
    const token = this.getToken();
    if (!token) throw new Error('Authentication required');
    const endpointPath = this.getRequestEndpointPath(type);
    const endpoint = `/admin/units/${endpointPath}/${requestId}/reject`;
    await httpPut<any>(endpoint, remarks ? { remarks } : {}, { token });
    return { data: true, message: `${type} request rejected${remarks ? ' with remarks' : ''}`, status: 200 };
  }

  // PUT /admin/units/{type}/{request_id}/revert
  async revertRequest(requestId: number, type: string, remarks?: string): Promise<ApiResponse<boolean>> {
    const token = this.getToken();
    if (!token) throw new Error('Authentication required');
    const endpointPath = this.getRequestEndpointPath(type);
    const endpoint = `/admin/units/${endpointPath}/${requestId}/revert`;
    await httpPut<any>(endpoint, remarks ? { remarks } : {}, { token });
    return { data: true, message: `${type} request reverted`, status: 200 };
  }

  // POST /admin/units/{unit_id}/archive-member/{member_id} - Archive a member
  async archiveMember(unitId: number, memberId: number, reason: string): Promise<ApiResponse<any>> {
    const token = this.getToken();
    if (!token) throw new Error('Authentication required');
    const data = await httpPost<any>(
      `/admin/units/${unitId}/archive-member/${memberId}`,
      { reason },
      { token }
    );
    return { data, message: 'Member archived successfully', status: 200 };
  }

  // POST /admin/units/restore-member/{member_id} - Restore archived member
  async restoreMember(memberId: number): Promise<ApiResponse<any>> {
    const token = this.getToken();
    if (!token) throw new Error('Authentication required');
    const data = await httpPost<any>(`/admin/units/restore-member/${memberId}`, {}, { token });
    return { data, message: 'Member restored successfully', status: 200 };
  }

  // GET /admin/units/export/{export_type} - Export various unit data
  async exportData(type: string, id?: number): Promise<ApiResponse<Blob>> {
    const token = this.getToken();
    if (!token) throw new Error('Authentication required');
    let endpoint = `/admin/units/export/${type}`;
    if (id) endpoint += `?id=${id}`;
    const blob = await httpGet<Blob>(endpoint, { token, asBlob: true });
    return { data: blob, message: 'Data exported successfully', status: 200 };
  }

  // GET /admin/district-wise-data - District-wise member data
  // Supports ?refresh=true to bypass cache and fetch fresh data
  async getDistrictWiseData(options?: { refresh?: boolean }): Promise<ApiResponse<DistrictWiseData[]>> {
    const token = this.getToken();
    if (!token) throw new Error('Authentication required');
    
    // API returns detailed district data
    interface ApiDistrictData {
      id: number;
      name: string;
      total_units: number;
      registered_units: number;
      completed_units: number;
      total_members: number;
      male_members: number;
      female_members: number;
    }
    
    // API may return paginated response or direct array
    interface PaginatedResponse {
      data?: ApiDistrictData[];
      items?: ApiDistrictData[];
      total?: number;
      page?: number;
      page_size?: number;
    }
    
    const query: Record<string, any> = { page: 1, page_size: 1000 };
    if (options?.refresh) {
      query.refresh = 'true';
    }
    
    const rawResponse = await httpGet<ApiDistrictData[] | PaginatedResponse>('/admin/district-wise-data', { 
      token,
      query
    });
    
    // Handle both array and paginated response formats (API may return { data: [...] } or { items: [...] } or direct array)
    const rawData: ApiDistrictData[] = Array.isArray(rawResponse) ? rawResponse : (rawResponse.data || rawResponse.items || []);
    
    // Transform to match DistrictWiseData interface (name + participants for the bar chart)
    const data: DistrictWiseData[] = rawData.map(district => ({
      name: district.name,
      participants: district.total_members,
    }));
    
    return { data, status: 200 };
  }

  // ==================== SYSTEM ADMIN ENDPOINTS ====================

  // GET /system/districts - Get all districts
  async getClergyDistricts(): Promise<ApiResponse<ClergyDistrict[]>> {
    const token = this.getToken();
    if (!token) throw new Error('Authentication required');
    const data = await httpGet<ClergyDistrict[]>('/system/districts', { token });
    return { data, status: 200 };
  }

  // POST /system/district - Create district
  async createDistrict(name: string): Promise<ApiResponse<any>> {
    const token = this.getToken();
    if (!token) throw new Error('Authentication required');
    const data = await httpPost<any>('/system/district', { name }, { token });
    return { data, message: 'District created successfully', status: 200 };
  }

  // PUT /system/district/{district_id} - Update district
  async updateDistrict(districtId: number, name: string): Promise<ApiResponse<any>> {
    const token = this.getToken();
    if (!token) throw new Error('Authentication required');
    const data = await httpPut<any>(`/system/district/${districtId}`, { name }, { token });
    return { data, message: 'District updated successfully', status: 200 };
  }

  // DELETE /system/district/{district_id} - Delete district
  async deleteDistrict(districtId: number): Promise<ApiResponse<any>> {
    const token = this.getToken();
    if (!token) throw new Error('Authentication required');
    const data = await httpDelete<any>(`/system/district/${districtId}`, { token });
    return { data, message: 'District deleted successfully', status: 200 };
  }

  // POST /system/create-user - Create new user
  async createSystemUser(data: {
    district_id: number;
    unit_name_id: number;
    password: string;
    role: number;
  }): Promise<ApiResponse<any>> {
    const token = this.getToken();
    if (!token) throw new Error('Authentication required');
    const response = await httpPost<any>('/system/create-user', data, { token });
    return { data: response, message: 'User created successfully', status: 200 };
  }

  // GET /admin/units/archived-members - Get archived members
  // API uses pagination: ?page=1&page_size=50
  async getArchivedMembers(unitId?: number): Promise<ApiResponse<ArchivedMember[]>> {
    const token = this.getToken();
    if (!token) throw new Error('Authentication required');
    
    // API returns snake_case fields
    interface ApiArchivedMember {
      id: number;
      registered_user_id: number;
      name: string;
      gender: string;
      dob: string;
      age: number;
      number: string;
      qualification?: string;
      blood_group?: string;
      archived_at: string;
      archived_by?: string;
      archive_reason?: string;
      unit_name?: string;
    }
    
    // API may return paginated response or direct array
    interface PaginatedResponse {
      data?: ApiArchivedMember[];
      items?: ApiArchivedMember[];
      total?: number;
      page?: number;
      page_size?: number;
    }
    
    const query: Record<string, any> = unitId ? { unit_id: unitId } : {};
    // Request large page size to get all records
    query.page = 1;
    query.page_size = 1000;
    
    const rawResponse = await httpGet<ApiArchivedMember[] | PaginatedResponse>('/admin/units/archived-members', { 
      token,
      query 
    });
    
    // Handle both array and paginated response formats (API may return { data: [...] } or { items: [...] } or direct array)
    const rawData: ApiArchivedMember[] = Array.isArray(rawResponse) ? rawResponse : (rawResponse.data || rawResponse.items || []);
    
    // Transform API response to match ArchivedMember interface
    const data: ArchivedMember[] = rawData.map(member => ({
      id: member.id,
      name: member.name,
      gender: member.gender as 'M' | 'F' | 'Male' | 'Female',
      number: member.number,
      dob: member.dob,
      age: member.age,
      qualification: member.qualification,
      bloodGroup: member.blood_group,
      unitId: member.registered_user_id,
      unitName: member.unit_name || '',
      isArchived: true,
      archivedAt: member.archived_at,
      archivedBy: member.archived_by || 'System',
      archiveReason: member.archive_reason,
    }));
    
    return { data, status: 200 };
  }

  // User Request Submissions
  async submitTransferRequest(payload: TransferRequestSubmission): Promise<ApiResponse<boolean>> {
    const token = this.getToken();
    if (!token) throw new Error('Authentication required');
    await httpPost<any>('/units/transfer-request', payload, { token });
    return { data: true, message: 'Transfer request submitted successfully', status: 200 };
  }

  async submitMemberInfoChange(payload: MemberInfoChangeSubmission): Promise<ApiResponse<boolean>> {
    const token = this.getToken();
    if (!token) throw new Error('Authentication required');
    await httpPost<any>('/units/member-info-change', payload, { token });
    return { data: true, message: 'Member info change request submitted successfully', status: 200 };
  }

  async submitOfficialsChange(payload: OfficialsChangeSubmission): Promise<ApiResponse<boolean>> {
    const token = this.getToken();
    if (!token) throw new Error('Authentication required');
    await httpPost<any>('/units/officials-change', payload, { token });
    return { data: true, message: 'Officials change request submitted successfully', status: 200 };
  }

  async submitCouncilorChange(payload: CouncilorChangeSubmission): Promise<ApiResponse<boolean>> {
    const token = this.getToken();
    if (!token) throw new Error('Authentication required');
    await httpPost<any>('/units/councilor-change', payload, { token });
    return { data: true, message: 'Councilor change request submitted successfully', status: 200 };
  }

  async submitMemberAdd(payload: MemberAddSubmission): Promise<ApiResponse<boolean>> {
    const token = this.getToken();
    if (!token) throw new Error('Authentication required');
    await httpPost<any>('/units/member-add', payload, { token });
    return { data: true, message: 'Member add request submitted successfully', status: 200 };
  }

  // Get requests for a specific unit (for unit officials)
  async getMyRequests(unitId: number): Promise<ApiResponse<{
    transfers: TransferRequest[];
    memberInfoChanges: MemberInfoChangeRequest[];
    officialsChanges: OfficialsChangeRequest[];
    councilorChanges: CouncilorChangeRequest[];
    memberAdds: MemberAddRequest[];
  }>> {
    const token = this.getToken();
    if (!token) throw new Error('Authentication required');
    const data = await httpGet<{
      transfers: TransferRequest[];
      memberInfoChanges: MemberInfoChangeRequest[];
      officialsChanges: OfficialsChangeRequest[];
      councilorChanges: CouncilorChangeRequest[];
      memberAdds: MemberAddRequest[];
    }>(`/units/${unitId}/my-requests`, { token });
    return { data, status: 200 };
  }

  // ==================== KALAMELA API FUNCTIONS ====================

  private calculateGrade(marks: number): EventGrade {
    const percentage = marks / 100;
    if (percentage >= 0.6) return 'A';
    if (percentage > 0.5) return 'B';
    if (percentage > 0.4) return 'C';
    return 'No Grade';
  }

  private calculatePoints(marks: number, position: number, isGroup: boolean): { grade: EventGrade; positionPoints: number; gradePoints: number; totalPoints: number } {
    const grade = this.calculateGrade(marks);
    let gradePoints = 0;
    let positionPoints = 0;
    
    // Position points
    if (isGroup) {
      if (position === 1) positionPoints = 10;
      else if (position === 2) positionPoints = 5;
      else if (position === 3) positionPoints = 3;
    } else {
      if (position === 1) positionPoints = 5;
      else if (position === 2) positionPoints = 3;
      else if (position === 3) positionPoints = 1;
      
      // Grade bonus points (only for individual)
      if (grade === 'A') gradePoints = 5;
      else if (grade === 'B') gradePoints = 3;
      else if (grade === 'C') gradePoints = 1;
    }
    
    return {
      grade,
      positionPoints,
      gradePoints,
      totalPoints: positionPoints + gradePoints,
    };
  }

  // ==================== KALAMELA PUBLIC ENDPOINTS ====================

  // GET /kalamela/home - Landing page stats
  async getKalamelaHome(): Promise<ApiResponse<{
    total_individual_events: number;
    total_group_events: number;
    total_individual_participants: number;
    total_group_teams: number;
    message: string;
  }>> {
    const data = await httpGet<any>('/kalamela/home');
    return { data, status: 200 };
  }

  // POST /kalamela/find-participant - Search by chest number
  async findParticipantByChestNumber(chestNumber: string): Promise<ApiResponse<any>> {
    const data = await httpPost<any>('/kalamela/find-participant', {}, { query: { chest_number: chestNumber } });
    return { data, status: 200 };
  }

  // GET /kalamela/results - Public results (top 3)
  async getPublicKalamelaResults(): Promise<ApiResponse<any>> {
    const data = await httpGet<any>('/kalamela/results');
    return { data, status: 200 };
  }

  // GET /kalamela/kalaprathibha - Top performers
  async getKalaprathibha(): Promise<ApiResponse<any>> {
    const data = await httpGet<any>('/kalamela/kalaprathibha');
    return { data, status: 200 };
  }

  // POST /kalamela/appeal/check - Check appeal eligibility
  async checkAppealEligibility(chestNumber: string, eventName: string): Promise<ApiResponse<any>> {
    const data = await httpPost<any>('/kalamela/appeal/check', {}, {
      query: { chest_number: chestNumber, event_name: eventName }
    });
    return { data, status: 200 };
  }

  // POST /kalamela/appeal/submit - Submit appeal
  async submitAppeal(payload: {
    participant_id: number;
    chest_number: string;
    event_name: string;
    statement: string;
    payment_type: string;
  }): Promise<ApiResponse<any>> {
    const response = await httpPost('/kalamela/appeal/submit', payload);
    return { data: response, message: 'Appeal submitted successfully', status: 200 };
  }

  // GET /kalamela/appeals/status - View appeal status
  async getAppealStatus(participantId?: number, chestNumber?: string): Promise<ApiResponse<any[]>> {
    const data = await httpGet<any[]>('/kalamela/appeals/status', {
      query: { participant_id: participantId, chest_number: chestNumber }
    });
    return { data, status: 200 };
  }

  // ==================== KALAMELA OFFICIAL ENDPOINTS ====================

  // GET /kalamela/official/home - Official home page
  async getKalamelaOfficialHome(): Promise<ApiResponse<any>> {
    const token = this.getToken();
    if (!token) throw new Error('Authentication required');
    const data = await httpGet<any>('/kalamela/official/home', { token });
    return { data, status: 200 };
  }

  // POST /kalamela/official/events/individual/select - Select event and view members
  async selectIndividualEvent(eventId: number, unitId?: number): Promise<ApiResponse<any>> {
    const token = this.getToken();
    if (!token) throw new Error('Authentication required');
    const data = await httpPost<any>('/kalamela/official/events/individual/select', {
      event_id: eventId,
      unit_id: unitId || null,
    }, { token });
    return { data, status: 200 };
  }

  // POST /kalamela/official/events/individual/add - Add participant to individual event
  async addIndividualParticipant(payload: {
    individual_event_id: number;
    participant_id: number;
    seniority_category: 'NA' | 'Junior' | 'Senior';
  }): Promise<ApiResponse<any>> {
    const token = this.getToken();
    if (!token) throw new Error('Authentication required');
    const response = await httpPost('/kalamela/official/events/individual/add', payload, { token });
    return { data: response, message: 'Participant added successfully', status: 200 };
  }

  // GET /kalamela/official/participants/individual - View all individual participants
  async getOfficialIndividualParticipants(): Promise<ApiResponse<any>> {
    const token = this.getToken();
    if (!token) throw new Error('Authentication required');
    const data = await httpGet<any>('/kalamela/official/participants/individual', { token });
    return { data, status: 200 };
  }

  // DELETE /kalamela/official/participants/individual/{participation_id}
  async removeIndividualParticipant(participationId: number): Promise<ApiResponse<any>> {
    const token = this.getToken();
    if (!token) throw new Error('Authentication required');
    const data = await httpDelete<any>(`/kalamela/official/participants/individual/${participationId}`, { token });
    return { data, message: 'Participant removed successfully', status: 200 };
  }

  // POST /kalamela/official/events/group/select - Select group event
  async selectGroupEvent(eventId: number, unitId?: number): Promise<ApiResponse<any>> {
    const token = this.getToken();
    if (!token) throw new Error('Authentication required');
    const data = await httpPost<any>('/kalamela/official/events/group/select', {
      event_id: eventId,
      unit_id: unitId || null,
    }, { token });
    return { data, status: 200 };
  }

  // POST /kalamela/official/events/group/add - Add team to group event
  async addGroupTeam(payload: {
    group_event_id: number;
    participant_ids: number[];
  }): Promise<ApiResponse<any>> {
    const token = this.getToken();
    if (!token) throw new Error('Authentication required');
    const response = await httpPost('/kalamela/official/events/group/add', payload, { token });
    return { data: response, message: `Added ${payload.participant_ids.length} participants successfully`, status: 200 };
  }

  // Alias for addGroupTeam (for compatibility with hooks)
  async addGroupParticipants(payload: {
    group_event_id: number;
    participant_ids: number[];
  }): Promise<ApiResponse<any>> {
    return this.addGroupTeam(payload);
  }

  // GET /kalamela/official/participants/group - View all group participants
  async getOfficialGroupParticipants(): Promise<ApiResponse<any>> {
    const token = this.getToken();
    if (!token) throw new Error('Authentication required');
    const data = await httpGet<any>('/kalamela/official/participants/group', { token });
    return { data, status: 200 };
  }

  // DELETE /kalamela/official/participants/group/{participation_id}
  async removeGroupParticipant(participationId: number): Promise<ApiResponse<any>> {
    const token = this.getToken();
    if (!token) throw new Error('Authentication required');
    const data = await httpDelete<any>(`/kalamela/official/participants/group/${participationId}`, { token });
    return { data, message: 'Participant removed successfully', status: 200 };
  }

  // GET /kalamela/official/preview - Preview with payment calculation
  async getOfficialPreview(): Promise<ApiResponse<any>> {
    const token = this.getToken();
    if (!token) throw new Error('Authentication required');
    const data = await httpGet<any>('/kalamela/official/preview', { token });
    return { data, status: 200 };
  }

  // POST /kalamela/official/payment - Create payment
  async createKalamelaPayment(): Promise<ApiResponse<any>> {
    const token = this.getToken();
    if (!token) throw new Error('Authentication required');
    const data = await httpPost<any>('/kalamela/official/payment', {}, { token });
    return { data, message: 'Payment record created successfully', status: 200 };
  }

  // POST /kalamela/official/payment/{payment_id}/proof - Upload payment proof
  async uploadKalamelaPaymentProof(paymentId: number, file: File): Promise<ApiResponse<any>> {
    const token = this.getToken();
    if (!token) throw new Error('Authentication required');
    const formData = new FormData();
    formData.append('file', file);
    const data = await httpPost<any>(`/kalamela/official/payment/${paymentId}/proof`, formData, { token });
    return { data, message: 'Payment proof uploaded successfully', status: 200 };
  }

  // GET /kalamela/official/print - Print view
  async getOfficialPrintView(): Promise<ApiResponse<any>> {
    const token = this.getToken();
    if (!token) throw new Error('Authentication required');
    const data = await httpGet<any>('/kalamela/official/print', { token });
    return { data, status: 200 };
  }

  // ==================== KALAMELA ADMIN ENDPOINTS ====================

  // GET /kalamela/admin/home - Admin home with all events
  async getKalamelaAdminHome(): Promise<ApiResponse<{
    individual_events: IndividualEvent[];
    group_events: GroupEvent[];
  }>> {
    const token = this.getToken();
    if (!token) throw new Error('Authentication required');
    
    const rawData = await httpGet<{
      individual_events: IndividualEvent[];
      group_events: GroupEvent[];
    }>('/kalamela/admin/home', { token });
    
    return { 
      data: { 
        individual_events: rawData.individual_events || [], 
        group_events: rawData.group_events || [] 
      }, 
      status: 200 
    };
  }

  // Kalamela Events Management
  async getIndividualEvents(): Promise<ApiResponse<IndividualEvent[]>> {
    const token = this.getToken();
    if (!token) throw new Error('Authentication required');
    const response = await this.getKalamelaAdminHome();
    return { data: response.data.individual_events || [], status: 200 };
  }

  async getGroupEvents(): Promise<ApiResponse<GroupEvent[]>> {
    const token = this.getToken();
    if (!token) throw new Error('Authentication required');
    const response = await this.getKalamelaAdminHome();
    return { data: response.data.group_events || [], status: 200 };
  }

  // POST /kalamela/admin/events/individual - Create individual event
  async addIndividualEvent(payload: IndividualEventCreate): Promise<ApiResponse<IndividualEvent>> {
    const token = this.getToken();
    if (!token) throw new Error('Authentication required');
    const response = await httpPost<IndividualEvent>('/kalamela/admin/events/individual', payload, { token });
    return { data: response, message: 'Event created successfully', status: 200 };
  }

  // POST /kalamela/admin/events/group - Create group event
  async addGroupEvent(payload: GroupEventCreate): Promise<ApiResponse<GroupEvent>> {
    const token = this.getToken();
    if (!token) throw new Error('Authentication required');
    const response = await httpPost<GroupEvent>('/kalamela/admin/events/group', payload, { token });
    return { data: response, message: 'Event created successfully', status: 200 };
  }

  // PUT /kalamela/admin/events/individual/{event_id} - Update individual event
  async updateIndividualEvent(id: number, payload: IndividualEventUpdate): Promise<ApiResponse<IndividualEvent>> {
    const token = this.getToken();
    if (!token) throw new Error('Authentication required');
    const response = await httpPut<IndividualEvent>(`/kalamela/admin/events/individual/${id}`, payload, { token });
    return { data: response, message: 'Event updated successfully', status: 200 };
  }

  // PUT /kalamela/admin/events/group/{event_id} - Update group event
  async updateGroupEvent(id: number, payload: GroupEventUpdate): Promise<ApiResponse<GroupEvent>> {
    const token = this.getToken();
    if (!token) throw new Error('Authentication required');
    const response = await httpPut<GroupEvent>(`/kalamela/admin/events/group/${id}`, payload, { token });
    return { data: response, message: 'Event updated successfully', status: 200 };
  }

  async deleteEvent(id: number, type: 'INDIVIDUAL' | 'GROUP'): Promise<ApiResponse<boolean>> {
    const token = this.getToken();
    if (!token) throw new Error('Authentication required');
    const endpoint = type === 'INDIVIDUAL' 
      ? `/kalamela/admin/events/individual/${id}`
      : `/kalamela/admin/events/group/${id}`;
    await httpDelete<any>(endpoint, { token });
    return { data: true, message: 'Event deleted successfully', status: 200 };
  }

  // ==================== KALAMELA CATEGORY MASTER ====================

  // GET /kalamela/admin/categories - List all categories
  async getKalamelaCategories(): Promise<ApiResponse<KalamelaCategory[]>> {
    const token = this.getToken();
    if (!token) throw new Error('Authentication required');
    const data = await httpGet<KalamelaCategory[]>('/kalamela/admin/categories', { token });
    return { data, status: 200 };
  }

  // POST /kalamela/admin/categories - Create a new category
  async createKalamelaCategory(payload: KalamelaCategoryCreate): Promise<ApiResponse<KalamelaCategory>> {
    const token = this.getToken();
    if (!token) throw new Error('Authentication required');
    const data = await httpPost<KalamelaCategory>('/kalamela/admin/categories', payload, { token });
    return { data, message: 'Category created successfully', status: 201 };
  }

  // GET /kalamela/admin/categories/{category_id} - Get category by ID
  async getKalamelaCategoryById(categoryId: number): Promise<ApiResponse<KalamelaCategory>> {
    const token = this.getToken();
    if (!token) throw new Error('Authentication required');
    const data = await httpGet<KalamelaCategory>(`/kalamela/admin/categories/${categoryId}`, { token });
    return { data, status: 200 };
  }

  // PUT /kalamela/admin/categories/{category_id} - Update a category
  async updateKalamelaCategory(categoryId: number, payload: KalamelaCategoryUpdate): Promise<ApiResponse<KalamelaCategory>> {
    const token = this.getToken();
    if (!token) throw new Error('Authentication required');
    const data = await httpPut<KalamelaCategory>(`/kalamela/admin/categories/${categoryId}`, payload, { token });
    return { data, message: 'Category updated successfully', status: 200 };
  }

  // DELETE /kalamela/admin/categories/{category_id} - Delete a category
  async deleteKalamelaCategory(categoryId: number): Promise<ApiResponse<boolean>> {
    const token = this.getToken();
    if (!token) throw new Error('Authentication required');
    await httpDelete<any>(`/kalamela/admin/categories/${categoryId}`, { token });
    return { data: true, message: 'Category deleted successfully', status: 200 };
  }

  // ==================== KALAMELA REGISTRATION FEE MASTER ====================

  // GET /kalamela/admin/registration-fees - List all registration fees
  async getRegistrationFees(): Promise<ApiResponse<RegistrationFee[]>> {
    const token = this.getToken();
    if (!token) throw new Error('Authentication required');
    const data = await httpGet<RegistrationFee[]>('/kalamela/admin/registration-fees', { token });
    return { data, status: 200 };
  }

  // POST /kalamela/admin/registration-fees - Create a new registration fee
  async createRegistrationFee(payload: RegistrationFeeCreate): Promise<ApiResponse<RegistrationFee>> {
    const token = this.getToken();
    if (!token) throw new Error('Authentication required');
    const data = await httpPost<RegistrationFee>('/kalamela/admin/registration-fees', payload, { token });
    return { data, message: 'Registration fee created successfully', status: 201 };
  }

  // GET /kalamela/admin/registration-fees/{fee_id} - Get registration fee by ID
  async getRegistrationFeeById(feeId: number): Promise<ApiResponse<RegistrationFee>> {
    const token = this.getToken();
    if (!token) throw new Error('Authentication required');
    const data = await httpGet<RegistrationFee>(`/kalamela/admin/registration-fees/${feeId}`, { token });
    return { data, status: 200 };
  }

  // PUT /kalamela/admin/registration-fees/{fee_id} - Update a registration fee
  async updateRegistrationFee(feeId: number, payload: RegistrationFeeUpdate): Promise<ApiResponse<RegistrationFee>> {
    const token = this.getToken();
    if (!token) throw new Error('Authentication required');
    const data = await httpPut<RegistrationFee>(`/kalamela/admin/registration-fees/${feeId}`, payload, { token });
    return { data, message: 'Registration fee updated successfully', status: 200 };
  }

  // DELETE /kalamela/admin/registration-fees/{fee_id} - Delete a registration fee
  async deleteRegistrationFee(feeId: number): Promise<ApiResponse<boolean>> {
    const token = this.getToken();
    if (!token) throw new Error('Authentication required');
    await httpDelete<any>(`/kalamela/admin/registration-fees/${feeId}`, { token });
    return { data: true, message: 'Registration fee deleted successfully', status: 200 };
  }

  // ==================== KALAMELA RULES MASTER ====================

  // GET /kalamela/admin/rules/grouped - Get all rules grouped by category
  async getKalamelaRulesGrouped(): Promise<{
    age_restrictions: {
      senior_dob_start: string;
      senior_dob_end: string;
      junior_dob_start: string;
      junior_dob_end: string;
    };
    participation_limits: {
      max_individual_events_per_person: string;
      max_participants_per_unit_per_event: string;
      max_groups_per_unit_per_group_event: string;
    };
    fees: {
      individual_event_fee: string;
      group_event_fee: string;
      appeal_fee: string;
    };
  }> {
    const token = this.getToken();
    if (!token) throw new Error('Authentication required');
    return httpGet('/kalamela/admin/rules/grouped', { token });
  }

  // GET /kalamela/admin/rules - Get all rules as list
  async getKalamelaRules(params?: {
    category?: 'age_restriction' | 'participation_limit' | 'fee';
    active_only?: boolean;
  }): Promise<Array<{
    id: number;
    rule_key: string;
    rule_category: 'age_restriction' | 'participation_limit' | 'fee';
    rule_value: string;
    display_name: string;
    description: string | null;
    is_active: boolean;
    created_on: string;
    updated_on: string;
    updated_by_id: number | null;
  }>> {
    const token = this.getToken();
    if (!token) throw new Error('Authentication required');
    
    const query: Record<string, string | boolean> = {};
    if (params?.category) query.category = params.category;
    if (params?.active_only !== undefined) query.active_only = params.active_only;
    
    return httpGet('/kalamela/admin/rules', { token, query });
  }

  // GET /kalamela/admin/rules/{rule_id} - Get single rule
  async getKalamelaRuleById(ruleId: number): Promise<{
    id: number;
    rule_key: string;
    rule_category: 'age_restriction' | 'participation_limit' | 'fee';
    rule_value: string;
    display_name: string;
    description: string | null;
    is_active: boolean;
    created_on: string;
    updated_on: string;
    updated_by_id: number | null;
  }> {
    const token = this.getToken();
    if (!token) throw new Error('Authentication required');
    return httpGet(`/kalamela/admin/rules/${ruleId}`, { token });
  }

  // PUT /kalamela/admin/rules/{rule_id} - Update a rule
  async updateKalamelaRule(ruleId: number, data: {
    rule_value?: string;
    display_name?: string;
    description?: string;
    is_active?: boolean;
  }): Promise<{
    id: number;
    rule_key: string;
    rule_category: string;
    rule_value: string;
    display_name: string;
    description: string | null;
    is_active: boolean;
    created_on: string;
    updated_on: string;
    updated_by_id: number | null;
  }> {
    const token = this.getToken();
    if (!token) throw new Error('Authentication required');
    return httpPut(`/kalamela/admin/rules/${ruleId}`, data, { token });
  }

  // POST /kalamela/admin/rules - Create a new rule
  async createKalamelaRule(data: {
    rule_key: string;
    rule_category: 'age_restriction' | 'participation_limit' | 'fee';
    rule_value: string;
    display_name: string;
    description?: string;
    is_active?: boolean;
  }): Promise<{
    id: number;
    rule_key: string;
    rule_category: string;
    rule_value: string;
    display_name: string;
    description: string | null;
    is_active: boolean;
    created_on: string;
    updated_on: string;
    updated_by_id: number | null;
  }> {
    const token = this.getToken();
    if (!token) throw new Error('Authentication required');
    return httpPost('/kalamela/admin/rules', data, { token });
  }

  // DELETE /kalamela/admin/rules/{rule_id} - Delete a rule
  async deleteKalamelaRule(ruleId: number): Promise<void> {
    const token = this.getToken();
    if (!token) throw new Error('Authentication required');
    await httpDelete(`/kalamela/admin/rules/${ruleId}`, { token });
  }

  // ==================== KALAMELA DISTRICT MEMBERS ====================

  // GET /kalamela/official/district-members - Get district members with optional event filtering
  async getDistrictMembers(params?: {
    unit_id?: number;
    participation_category?: 'Junior' | 'Senior' | 'Ineligible';
    search?: string;
    event_id?: number;
    event_type?: 'individual' | 'group';
  }): Promise<{
    members: Array<{
      id: number;
      name: string;
      phone_number?: string;
      dob?: string;
      age: number;
      gender: string;
      unit_id?: number;
      unit_name?: string;
      participation_category: 'Junior' | 'Senior' | 'Ineligible';
      is_excluded?: boolean;
      is_eligible?: boolean;
      is_already_registered?: boolean;
      ineligibility_reasons?: string[];
    }>;
    total_count: number;
    summary: {
      junior_count: number;
      senior_count: number;
      ineligible_count: number;
      excluded_count: number;
      eligible_count?: number;
    };
    units?: Array<{ id: number; name: string }>;
    filters_applied?: {
      unit_id: number | null;
      participation_category: string | null;
      search: string | null;
    };
    age_restrictions?: {
      junior_dob_start: string;
      junior_dob_end: string;
      senior_dob_start: string;
      senior_dob_end: string;
    };
    event_context?: {
      id: number;
      name: string;
      type: string;
      gender_restriction?: string;
      seniority_restriction?: string;
      is_mandatory?: boolean;
      already_registered_count?: number;
    };
  }> {
    const token = this.getToken();
    if (!token) throw new Error('Authentication required');
    
    const query: Record<string, string | number> = {};
    if (params?.unit_id) query.unit_id = params.unit_id;
    if (params?.participation_category) query.participation_category = params.participation_category;
    if (params?.search) query.search = params.search;
    if (params?.event_id) query.event_id = params.event_id;
    if (params?.event_type) query.event_type = params.event_type;
    
    return httpGet('/kalamela/official/district-members', { token, query });
  }

  // GET /kalamela/admin/units - View all units with stats
  async getKalamelaAdminUnits(): Promise<ApiResponse<any[]>> {
    const token = this.getToken();
    if (!token) throw new Error('Authentication required');
    const data = await httpGet<any[]>('/kalamela/admin/units', { token });
    return { data, status: 200 };
  }

  // GET /kalamela/admin/unit/{unit_id}/members - View unit members with age
  async getKalamelaUnitMembers(unitId: number): Promise<ApiResponse<any[]>> {
    const token = this.getToken();
    if (!token) throw new Error('Authentication required');
    const data = await httpGet<any[]>(`/kalamela/admin/unit/${unitId}/members`, { token });
    return { data, status: 200 };
  }

  // PUT /kalamela/admin/unit/member/{member_id} - Edit member DOB
  async updateKalamelaUnitMemberDob(memberId: number, dob: string): Promise<ApiResponse<any>> {
    const token = this.getToken();
    if (!token) throw new Error('Authentication required');
    const data = await httpPut<any>(`/kalamela/admin/unit/member/${memberId}`, { dob }, { token });
    return { data, message: 'Member DOB updated successfully', status: 200 };
  }

  // POST /kalamela/admin/exclude-member - Exclude member from Kalamela
  async excludeMemberFromKalamela(payload: { unit_member_id: number; reason: string }): Promise<ApiResponse<any>> {
    const token = this.getToken();
    if (!token) throw new Error('Authentication required');
    const response = await httpPost<any>('/kalamela/admin/exclude-member', payload, { token });
    return { data: response, message: 'Member excluded from Kalamela successfully', status: 200 };
  }

  // GET /kalamela/admin/excluded-members - View all excluded members
  async getKalamelaExcludedMembers(): Promise<ApiResponse<any[]>> {
    const token = this.getToken();
    if (!token) throw new Error('Authentication required');
    const data = await httpGet<any[]>('/kalamela/admin/excluded-members', { token });
    return { data, status: 200 };
  }

  // DELETE /kalamela/admin/excluded-member/{exclusion_id}
  async removeExcludedMember(exclusionId: number): Promise<ApiResponse<any>> {
    const token = this.getToken();
    if (!token) throw new Error('Authentication required');
    const data = await httpDelete<any>(`/kalamela/admin/excluded-member/${exclusionId}`, { token });
    return { data, message: 'Member re-included in Kalamela successfully', status: 200 };
  }

  // GET /kalamela/admin/participants/individual - All individual participants
  async getAdminIndividualParticipants(): Promise<ApiResponse<any>> {
    const token = this.getToken();
    if (!token) throw new Error('Authentication required');
    const data = await httpGet<any>('/kalamela/admin/participants/individual', { token });
    return { data, status: 200 };
  }

  // GET /kalamela/admin/participants/group - All group participants
  async getAdminGroupParticipants(): Promise<ApiResponse<any>> {
    const token = this.getToken();
    if (!token) throw new Error('Authentication required');
    const data = await httpGet<any>('/kalamela/admin/participants/group', { token });
    return { data, status: 200 };
  }

  // PUT /kalamela/admin/participants/group/{participation_id}/chest-number
  async updateGroupChestNumber(participationId: number, chestNumber: string): Promise<ApiResponse<any>> {
    const token = this.getToken();
    if (!token) throw new Error('Authentication required');
    const data = await httpPut<any>(
      `/kalamela/admin/participants/group/${participationId}/chest-number`,
      { chest_number: chestNumber },
      { token }
    );
    return { data, message: 'Chest number updated successfully', status: 200 };
  }

  // GET /kalamela/admin/events-preview - Events preview with counts
  async getAdminEventsPreview(): Promise<ApiResponse<any>> {
    const token = this.getToken();
    if (!token) throw new Error('Authentication required');
    const data = await httpGet<any>('/kalamela/admin/events-preview', { token });
    return { data, status: 200 };
  }

  // GET /kalamela/admin/payments - All unit payments
  async getKalamelaAdminPayments(): Promise<ApiResponse<any[]>> {
    const token = this.getToken();
    if (!token) throw new Error('Authentication required');
    const data = await httpGet<any[]>('/kalamela/admin/payments', { token });
    return { data, status: 200 };
  }

  // PUT /kalamela/admin/payments/{payment_id}/approve
  async approveKalamelaPayment(paymentId: number): Promise<ApiResponse<any>> {
    const token = this.getToken();
    if (!token) throw new Error('Authentication required');
    const data = await httpPut<any>(`/kalamela/admin/payments/${paymentId}/approve`, {}, { token });
    return { data, message: 'Payment approved successfully', status: 200 };
  }

  // PUT /kalamela/admin/payments/{payment_id}/decline
  async declineKalamelaPayment(paymentId: number, reason: string): Promise<ApiResponse<any>> {
    const token = this.getToken();
    if (!token) throw new Error('Authentication required');
    const data = await httpPut<any>(`/kalamela/admin/payments/${paymentId}/decline`, { reason }, { token });
    return { data, message: 'Payment declined', status: 200 };
  }

  // POST /kalamela/admin/scores/individual/event/{event_id} - Bulk add individual scores
  async bulkAddIndividualScores(eventId: number, scores: Array<{
    participant_id: number;
    marks: number;
    position: number;
  }>): Promise<ApiResponse<any>> {
    const token = this.getToken();
    if (!token) throw new Error('Authentication required');
    const data = await httpPost<any>(`/kalamela/admin/scores/individual/event/${eventId}`, { scores }, { token });
    return { data, message: `${scores.length} scores added successfully`, status: 200 };
  }

  // GET /kalamela/admin/scores/individual/event/{event_id}/candidates - Get candidates for scoring
  async getIndividualEventCandidates(eventId: number): Promise<ApiResponse<any>> {
    const token = this.getToken();
    if (!token) throw new Error('Authentication required');
    const data = await httpGet<any>(`/kalamela/admin/scores/individual/event/${eventId}/candidates`, { token });
    return { data, status: 200 };
  }

  // POST /kalamela/admin/scores/group/event/{event_id} - Bulk add group scores
  async bulkAddGroupScores(eventId: number, scores: Array<{
    participation_id: number;
    marks: number;
    position: number;
  }>): Promise<ApiResponse<any>> {
    const token = this.getToken();
    if (!token) throw new Error('Authentication required');
    const data = await httpPost<any>(`/kalamela/admin/scores/group/event/${eventId}`, { scores }, { token });
    return { data, message: `${scores.length} scores added successfully`, status: 200 };
  }

  // GET /kalamela/admin/scores/group/event/{event_id}/candidates - Get candidates for scoring
  async getGroupEventCandidates(eventId: number): Promise<ApiResponse<any>> {
    const token = this.getToken();
    if (!token) throw new Error('Authentication required');
    const data = await httpGet<any>(`/kalamela/admin/scores/group/event/${eventId}/candidates`, { token });
    return { data, status: 200 };
  }

  // GET /kalamela/admin/scores/individual - View all individual scores
  async getAdminIndividualScores(): Promise<ApiResponse<any>> {
    const token = this.getToken();
    if (!token) throw new Error('Authentication required');
    const data = await httpGet<any>('/kalamela/admin/scores/individual', { token });
    return { data, status: 200 };
  }

  // GET /kalamela/admin/scores/group - View all group scores
  async getAdminGroupScores(): Promise<ApiResponse<any>> {
    const token = this.getToken();
    if (!token) throw new Error('Authentication required');
    const data = await httpGet<any>('/kalamela/admin/scores/group', { token });
    return { data, status: 200 };
  }

  // PUT /kalamela/admin/scores/individual/event/{event_id} - Bulk update individual scores
  async bulkUpdateIndividualScores(eventId: number, scores: Array<{
    score_id: number;
    marks?: number;
    position?: number;
  }>): Promise<ApiResponse<any>> {
    const token = this.getToken();
    if (!token) throw new Error('Authentication required');
    const data = await httpPut<any>(`/kalamela/admin/scores/individual/event/${eventId}`, { scores }, { token });
    return { data, message: `${scores.length} scores updated successfully`, status: 200 };
  }

  // PUT /kalamela/admin/scores/group/event/{event_id} - Bulk update group scores
  async bulkUpdateGroupScores(eventId: number, scores: Array<{
    score_id: number;
    marks?: number;
    position?: number;
  }>): Promise<ApiResponse<any>> {
    const token = this.getToken();
    if (!token) throw new Error('Authentication required');
    const data = await httpPut<any>(`/kalamela/admin/scores/group/event/${eventId}`, { scores }, { token });
    return { data, message: `${scores.length} scores updated successfully`, status: 200 };
  }

  // GET /kalamela/admin/scores/individual/event/{event_id}/edit - Get scores for editing
  async getIndividualEventScoresForEdit(eventId: number): Promise<ApiResponse<any>> {
    const token = this.getToken();
    if (!token) throw new Error('Authentication required');
    const data = await httpGet<any>(`/kalamela/admin/scores/individual/event/${eventId}/edit`, { token });
    return { data, status: 200 };
  }

  // GET /kalamela/admin/scores/group/event/{event_id}/edit - Get scores for editing
  async getGroupEventScoresForEdit(eventId: number): Promise<ApiResponse<any>> {
    const token = this.getToken();
    if (!token) throw new Error('Authentication required');
    const data = await httpGet<any>(`/kalamela/admin/scores/group/event/${eventId}/edit`, { token });
    return { data, status: 200 };
  }

  // GET /kalamela/admin/appeals - View all appeals
  async getKalamelaAdminAppeals(): Promise<ApiResponse<any[]>> {
    const token = this.getToken();
    if (!token) throw new Error('Authentication required');
    const data = await httpGet<any[]>('/kalamela/admin/appeals', { token });
    return { data, status: 200 };
  }

  // PUT /kalamela/admin/appeal/{appeal_id}/reply - Reply to appeal
  async replyToAppeal(appealId: number, reply: string, newPosition?: number): Promise<ApiResponse<any>> {
    const token = this.getToken();
    if (!token) throw new Error('Authentication required');
    const data = await httpPut<any>(`/kalamela/admin/appeal/${appealId}/reply`, {
      reply,
      new_position: newPosition || null,
    }, { token });
    return { data, message: 'Reply sent successfully', status: 200 };
  }

  // GET /kalamela/admin/results/unit-wise - Unit-wise results
  async getKalamelaUnitWiseResults(): Promise<ApiResponse<any>> {
    const token = this.getToken();
    if (!token) throw new Error('Authentication required');
    const data = await httpGet<any>('/kalamela/admin/results/unit-wise', { token });
    return { data, status: 200 };
  }

  // GET /kalamela/admin/results/district-wise - District-wise results
  async getKalamelaDistrictWiseResults(): Promise<ApiResponse<any>> {
    const token = this.getToken();
    if (!token) throw new Error('Authentication required');
    const data = await httpGet<any>('/kalamela/admin/results/district-wise', { token });
    return { data, status: 200 };
  }

  // GET /kalamela/admin/export/events - Export events
  async exportKalamelaEvents(): Promise<Blob> {
    const token = this.getToken();
    if (!token) throw new Error('Authentication required');
    return httpGet<Blob>('/kalamela/admin/export/events', { token, asBlob: true });
  }

  // GET /kalamela/admin/export/chest-numbers - Export chest numbers
  async exportKalamelaChestNumbers(): Promise<Blob> {
    const token = this.getToken();
    if (!token) throw new Error('Authentication required');
    return httpGet<Blob>('/kalamela/admin/export/chest-numbers', { token, asBlob: true });
  }

  // GET /kalamela/admin/export/results - Export results
  async exportKalamelaResults(): Promise<Blob> {
    const token = this.getToken();
    if (!token) throw new Error('Authentication required');
    return httpGet<Blob>('/kalamela/admin/export/results', { token, asBlob: true });
  }

  // Kalamela Participant Registration
  async registerIndividualParticipant(payload: { eventId: number; memberId: number }): Promise<ApiResponse<EventParticipant>> {
    const token = this.getToken();
    if (!token) throw new Error('Authentication required');
    const data = await httpPost<EventParticipant>('/kalamela/official/events/individual/add', {
      individual_event_id: payload.eventId,
      participant_id: payload.memberId,
      seniority_category: 'NA',
    }, { token });
    return { data, message: 'Participant registered successfully', status: 200 };
  }

  async registerGroupTeam(payload: { eventId: number; memberIds: number[] }): Promise<ApiResponse<GroupEventTeam>> {
    const token = this.getToken();
    if (!token) throw new Error('Authentication required');
    const data = await httpPost<GroupEventTeam>('/kalamela/official/events/group/add', {
      group_event_id: payload.eventId,
      participant_ids: payload.memberIds,
    }, { token });
    return { data, message: 'Team registered successfully', status: 200 };
  }

  async getEventParticipants(eventId: number, type: 'INDIVIDUAL' | 'GROUP'): Promise<ApiResponse<EventParticipant[]>> {
    const token = this.getToken();
    if (!token) throw new Error('Authentication required');
    const endpoint = type === 'INDIVIDUAL' 
      ? `/kalamela/admin/scores/individual/event/${eventId}/candidates`
      : `/kalamela/admin/scores/group/event/${eventId}/candidates`;
    const data = await httpGet<any>(endpoint, { token });
    return { data: data.participants || data.teams || [], status: 200 };
  }

  async getAllIndividualParticipants(): Promise<ApiResponse<EventParticipant[]>> {
    const token = this.getToken();
    if (!token) throw new Error('Authentication required');
    const data = await httpGet<any>('/kalamela/admin/participants/individual', { token });
    return { data: data.individual_event_participations || [], status: 200 };
  }

  async getAllGroupTeams(): Promise<ApiResponse<GroupEventTeam[]>> {
    const token = this.getToken();
    if (!token) throw new Error('Authentication required');
    const data = await httpGet<any>('/kalamela/admin/participants/group', { token });
    return { data: data.group_event_participations || [], status: 200 };
  }

  async removeParticipant(participantId: number): Promise<ApiResponse<boolean>> {
    const token = this.getToken();
    if (!token) throw new Error('Authentication required');
    await httpDelete<any>(`/kalamela/official/participants/individual/${participantId}`, { token });
    return { data: true, message: 'Participant removed successfully', status: 200 };
  }

  async updateChestNumber(participantId: number, newChestNumber: string): Promise<ApiResponse<boolean>> {
    const token = this.getToken();
    if (!token) throw new Error('Authentication required');
    await httpPut<any>(`/kalamela/admin/participants/group/${participantId}/chest-number`, {
      chest_number: newChestNumber,
    }, { token });
    return { data: true, message: 'Chest number updated successfully', status: 200 };
  }

  // Kalamela Score Entry
  async submitEventScores(eventId: number, eventType: 'INDIVIDUAL' | 'GROUP', scores: ScoreSubmission[]): Promise<ApiResponse<EventScore[]>> {
    const token = this.getToken();
    if (!token) throw new Error('Authentication required');
    
    const endpoint = eventType === 'INDIVIDUAL'
      ? `/kalamela/admin/scores/individual/event/${eventId}`
      : `/kalamela/admin/scores/group/event/${eventId}`;
    
    const formattedScores = scores.map((score, index) => ({
      participant_id: score.eventParticipationId,
      marks: score.awardedMarks,
      position: index + 1,
    }));
    
    const data = await httpPost<EventScore[]>(endpoint, { scores: formattedScores }, { token });
    return { data, message: 'Scores submitted successfully', status: 200 };
  }

  async getEventScores(eventId: number): Promise<ApiResponse<EventScore[]>> {
    const token = this.getToken();
    if (!token) throw new Error('Authentication required');
    const data = await httpGet<any>(`/kalamela/admin/scores/individual/event/${eventId}/edit`, { token });
    return { data: data.scores || [], status: 200 };
  }

  async updateEventScore(scoreId: number, marks: number): Promise<ApiResponse<EventScore>> {
    const token = this.getToken();
    if (!token) throw new Error('Authentication required');
    const data = await httpPut<EventScore>(`/kalamela/admin/scores/individual/${scoreId}`, { marks }, { token });
    return { data, message: 'Score updated successfully', status: 200 };
  }

  // Kalamela Results
  async getAllResults(): Promise<ApiResponse<EventResults[]>> {
    const token = this.getToken();
    if (!token) throw new Error('Authentication required');
    const data = await httpGet<EventResults[]>('/kalamela/admin/results', { token });
    return { data, status: 200 };
  }

  async getDistrictResults(districtId?: number): Promise<ApiResponse<DistrictPerformance[]>> {
    const token = this.getToken();
    if (!token) throw new Error('Authentication required');
    const data = await httpGet<any>('/kalamela/admin/results/district-wise', { token });
    const results = data.districts || [];
    return { data: districtId ? results.filter((r: DistrictPerformance) => r.districtId === districtId) : results, status: 200 };
  }

  async getUnitResults(unitId?: number): Promise<ApiResponse<UnitPerformance[]>> {
    const token = this.getToken();
    if (!token) throw new Error('Authentication required');
    const data = await httpGet<any>('/kalamela/admin/results/unit-wise', { token });
    const results = data.units || [];
    return { data: unitId ? results.filter((r: UnitPerformance) => r.unitId === unitId) : results, status: 200 };
  }

  async getTopPerformers(limit: number = 10): Promise<ApiResponse<TopPerformer[]>> {
    const token = this.getToken();
    if (!token) throw new Error('Authentication required');
    const data = await httpGet<TopPerformer[]>('/kalamela/admin/results/top-performers', { token, query: { limit } });
    return { data, status: 200 };
  }

  // Kalamela Payments
  async getKalamelaPayments(): Promise<ApiResponse<KalamelaPayment[]>> {
    const token = this.getToken();
    if (!token) throw new Error('Authentication required');
    const data = await httpGet<KalamelaPayment[]>('/kalamela/admin/payments', { token });
    return { data, status: 200 };
  }

  async approvePayment(paymentId: number): Promise<ApiResponse<boolean>> {
    const token = this.getToken();
    if (!token) throw new Error('Authentication required');
    await httpPut<any>(`/kalamela/admin/payments/${paymentId}/approve`, {}, { token });
    return { data: true, message: 'Payment approved successfully', status: 200 };
  }

  async rejectPayment(paymentId: number, reason?: string): Promise<ApiResponse<boolean>> {
    const token = this.getToken();
    if (!token) throw new Error('Authentication required');
    await httpPut<any>(`/kalamela/admin/payments/${paymentId}/decline`, { reason }, { token });
    return { data: true, message: 'Payment marked as invalid', status: 200 };
  }

  // Kalamela Appeals
  async getAppeals(): Promise<ApiResponse<ScoreAppeal[]>> {
    const token = this.getToken();
    if (!token) throw new Error('Authentication required');
    const data = await httpGet<ScoreAppeal[]>('/kalamela/admin/appeals', { token });
    return { data, status: 200 };
  }

  async respondToAppeal(appealId: number, reply: string): Promise<ApiResponse<boolean>> {
    const token = this.getToken();
    if (!token) throw new Error('Authentication required');
    await httpPut<any>(`/kalamela/admin/appeal/${appealId}/reply`, { reply }, { token });
    return { data: true, message: 'Appeal response submitted successfully', status: 200 };
  }

  // Kalamela Exclusions
  async getExcludedMembers(): Promise<ApiResponse<ExcludedMember[]>> {
    const token = this.getToken();
    if (!token) throw new Error('Authentication required');
    const data = await httpGet<ExcludedMember[]>('/kalamela/admin/excluded-members', { token });
    return { data, status: 200 };
  }

  async restoreExcludedMember(memberId: number): Promise<ApiResponse<boolean>> {
    const token = this.getToken();
    if (!token) throw new Error('Authentication required');
    await httpDelete<any>(`/kalamela/admin/excluded-member/${memberId}`, { token });
    return { data: true, message: 'Member restored to Kalamela', status: 200 };
  }

  // Kalamela Dashboard
  async getKalamelaDashboardStats(): Promise<ApiResponse<KalamelaDashboardStats>> {
    const token = this.getToken();
    if (!token) throw new Error('Authentication required');
    const data = await httpGet<KalamelaDashboardStats>('/kalamela/admin/dashboard', { token });
    return { data, status: 200 };
  }

  // ============================================
  // Site Settings APIs
  // ============================================

  async getSiteSettings(): Promise<SiteSettings> {
    return httpGet<SiteSettings>('/site-settings');
  }

  async updateSiteSettings(data: SiteSettingsUpdate): Promise<SiteSettings> {
    return httpPut<SiteSettings>('/site-settings', data, { token: this.getToken() || undefined });
  }

  async uploadLogo(logoType: 'primary' | 'secondary' | 'tertiary', file: File): Promise<LogoUploadResponse> {
    const formData = new FormData();
    formData.append('logo_type', logoType);
    formData.append('file', file);
    return httpPostFormData<LogoUploadResponse>('/site-settings/logo', formData, this.getToken() || undefined);
  }

  // Notices APIs
  async getNotices(activeOnly: boolean = false): Promise<Notice[]> {
    return httpGet<Notice[]>(`/notices?active_only=${activeOnly}`);
  }

  async createNotice(data: NoticeCreate): Promise<Notice> {
    return httpPost<Notice>('/notices', data, { token: this.getToken() || undefined });
  }

  async updateNotice(id: number, data: NoticeUpdate): Promise<Notice> {
    return httpPut<Notice>(`/notices/${id}`, data, { token: this.getToken() || undefined });
  }

  async deleteNotice(id: number): Promise<{ message: string }> {
    return httpDelete<{ message: string }>(`/notices/${id}`, { token: this.getToken() || undefined });
  }

  async reorderNotices(order: NoticeReorderItem[]): Promise<{ message: string }> {
    return httpPut<{ message: string }>('/notices/reorder', { order }, { token: this.getToken() || undefined });
  }

  // Quick Links APIs
  async getQuickLinks(): Promise<QuickLink[]> {
    return httpGet<QuickLink[]>('/quick-links');
  }

  async createQuickLink(data: QuickLinkCreate): Promise<QuickLink> {
    return httpPost<QuickLink>('/quick-links', data, { token: this.getToken() || undefined });
  }

  async updateQuickLink(id: number, data: QuickLinkUpdate): Promise<QuickLink> {
    return httpPut<QuickLink>(`/quick-links/${id}`, data, { token: this.getToken() || undefined });
  }

  async deleteQuickLink(id: number): Promise<{ message: string }> {
    return httpDelete<{ message: string }>(`/quick-links/${id}`, { token: this.getToken() || undefined });
  }

  // ==================== USER MANAGEMENT ====================

  // User types for user management
  private userTypes = {
    UNIT: 'UNIT',
    DISTRICT_OFFICIAL: 'DISTRICT_OFFICIAL',
  } as const;

  // GET /admin/users - List all users with optional filters
  async getUsers(params?: {
    user_type?: 'UNIT' | 'DISTRICT_OFFICIAL';
    district_id?: number;
    search?: string;
    is_active?: boolean;
  }): Promise<Array<{
    id: number;
    username: string;
    email?: string;
    phone_number?: string;
    user_type: string;
    is_active: boolean;
    unit_name?: string;
    district_name?: string;
  }>> {
    const token = this.getToken();
    if (!token) throw new Error('Authentication required');
    
    const query: Record<string, string | number | boolean | undefined> = {};
    if (params?.user_type) query.user_type = params.user_type;
    if (params?.district_id) query.district_id = params.district_id;
    if (params?.search) query.search = params.search;
    if (params?.is_active !== undefined) query.is_active = params.is_active;
    
    return httpGet('/admin/users', { token, query });
  }

  // GET /admin/users/summary - Get users count summary
  async getUsersSummary(): Promise<{
    unit_officials: number;
    district_officials: number;
    total: number;
  }> {
    const token = this.getToken();
    if (!token) throw new Error('Authentication required');
    return httpGet('/admin/users/summary', { token });
  }

  // POST /admin/users/reset-password - Reset single user password
  async resetUserPassword(data: {
    user_id: number;
    new_password: string;
  }): Promise<{
    message: string;
    user_id: number;
    username: string;
  }> {
    const token = this.getToken();
    if (!token) throw new Error('Authentication required');
    return httpPost('/admin/users/reset-password', data, { token });
  }

  // POST /admin/users/bulk-reset-password - Bulk reset passwords
  async bulkResetPasswords(data: {
    user_ids: number[];
    new_password: string;
  }): Promise<{
    message: string;
    total_requested: number;
    total_reset: number;
    reset_users: Array<{
      user_id: number;
      username: string;
      user_type: string;
    }>;
    failed_users: Array<{
      user_id: number;
      reason: string;
    }>;
  }> {
    const token = this.getToken();
    if (!token) throw new Error('Authentication required');
    return httpPost('/admin/users/bulk-reset-password', data, { token });
  }

  // POST /admin/users/reset-all-by-type - Reset all passwords by user type
  async resetAllPasswordsByType(params: {
    user_type: 'UNIT' | 'DISTRICT_OFFICIAL';
    new_password: string;
    district_id?: number;
  }): Promise<{
    message: string;
    total_requested: number;
    total_reset: number;
    reset_users: Array<{
      user_id: number;
      username: string;
      user_type: string;
    }>;
    failed_users: Array<{
      user_id: number;
      reason: string;
    }>;
  }> {
    const token = this.getToken();
    if (!token) throw new Error('Authentication required');
    
    const query: Record<string, string | number> = {
      user_type: params.user_type,
      new_password: params.new_password,
    };
    if (params.district_id) query.district_id = params.district_id;
    
    return httpPost('/admin/users/reset-all-by-type', null, { token, query });
  }

  // GET /admin/users/district-officials - List all district officials
  async getDistrictOfficials(): Promise<Array<{
    id: number;
    username: string;
    email?: string;
    phone_number?: string;
    user_type: string;
    is_active: boolean;
    district_id?: number;
    district_name?: string;
    official_name?: string;
  }>> {
    const token = this.getToken();
    if (!token) throw new Error('Authentication required');
    return httpGet('/admin/users/district-officials', { token });
  }

  // GET /admin/users/districts - List districts with official status
  async getDistrictsWithOfficialStatus(): Promise<Array<{
    id: number;
    name: string;
    has_official: boolean;
    official_id?: number;
    official_name?: string;
    official_phone?: string;
    official_username?: string;
  }>> {
    const token = this.getToken();
    if (!token) throw new Error('Authentication required');
    return httpGet('/admin/users/districts', { token });
  }

  // POST /admin/users/district-officials - Create a district official
  async createDistrictOfficial(data: {
    district_id: number;
    official_name: string;
    phone_number: string;
  }): Promise<{
    message: string;
    official_id: number;
    username: string;
    district_name: string;
    default_password_hint: string;
  }> {
    const token = this.getToken();
    if (!token) throw new Error('Authentication required');
    return httpPost('/admin/users/district-officials', data, { token });
  }
}

export const api = new ApiService();
