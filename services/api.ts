
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

  // -------------------------
  // Auth
  // -------------------------
  async login(payload: { username: string; password: string }) {
    try {
      console.log('[API] login: Attempting login for user:', payload.username);
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

  // -------------------------
  // Conference
  // -------------------------
  getConferences(token: string) {
    return httpGet<ConferenceItem[]>('/conference/', { token });
  }

  createConference(payload: { title: string; details?: string }, token: string) {
    return httpPost<ConferenceItem>('/conference/', payload, { token });
  }

  addConferenceDelegate(payload: { conference_id: number; official_user_id: number; member_id?: number }, token: string) {
    return httpPost<{ status: string }>('/conference/delegate', payload, { token });
  }

  addConferencePayment(payload: { conference_id: number; amount_to_pay: number; payment_reference?: string }, token: string) {
    return httpPost<PaymentRecord>('/conference/payment', payload, { token });
  }

  uploadConferencePaymentProof(paymentId: number, file: File, token: string) {
    const formData = new FormData();
    formData.append('file', file);
    return httpPost<PaymentRecord>(`/conference/payment/${paymentId}/proof`, formData, {
      token,
      headers: { 'Content-Type': undefined as any },
    });
  }

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
  createAdminIndividualEvent(payload: { name: string; category?: string; description?: string }, token: string) {
    return httpPost<any>('/kalamela/admin/events/individual', payload, { token });
  }

  createAdminGroupEvent(
    payload: { name: string; description?: string; max_allowed_limit: number; min_allowed_limit: number; per_unit_allowed_limit: number },
    token: string
  ) {
    return httpPost<any>('/kalamela/admin/events/group', payload, { token });
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
  async getUnitStats(): Promise<ApiResponse<UnitStats>> {
    const token = this.getToken();
    if (!token) throw new Error('Authentication required');
    const data = await httpGet<UnitStats>('/admin/units/dashboard', { token });
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
    
    const rawData = await httpGet<ApiUnit[]>('/admin/units', { token });
    
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
    const data = await httpGet<UnitMember[]>('/admin/units/members', { 
      token,
      query: unitId ? { unit_id: unitId } : undefined 
    });
    return { data, status: 200 };
  }

  // GET /admin/units/officials - Get all officials (optionally filtered by unit)
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
    
    const rawData = await httpGet<ApiUnitOfficial[]>('/admin/units/officials', { 
      token,
      query: unitId ? { unit_id: unitId } : undefined 
    });
    
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
    
    const rawData = await httpGet<ApiUnitCouncilor[]>('/admin/units/councilors', { 
      token,
      query: unitId ? { unit_id: unitId } : undefined 
    });
    
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
    
    const rawData = await httpGet<ApiTransferRequest[]>('/admin/units/transfer-requests', { token });
    
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
    
    const rawData = await httpGet<ApiMemberInfoChangeRequest[]>('/admin/units/member-change-requests', { token });
    
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
    
    const rawData = await httpGet<ApiOfficialsChangeRequest[]>('/admin/units/officials-change-requests', { token });
    
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
    
    const rawData = await httpGet<ApiCouncilorChangeRequest[]>('/admin/units/councilor-change-requests', { token });
    
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
    
    const rawData = await httpGet<ApiMemberAddRequest[]>('/admin/units/member-add-requests', { token });
    
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

  // PUT /admin/units/transfer-request/{request_id}/approve
  async approveRequest(requestId: number, type: string, remarks?: string): Promise<ApiResponse<boolean>> {
    const token = this.getToken();
    if (!token) throw new Error('Authentication required');
    const endpoint = `/admin/units/${type}-request/${requestId}/approve`;
    await httpPut<any>(endpoint, remarks ? { remarks } : {}, { token });
    return { data: true, message: `${type} request approved successfully`, status: 200 };
  }

  // PUT /admin/units/{type}-request/{request_id}/reject
  async rejectRequest(requestId: number, type: string, remarks?: string): Promise<ApiResponse<boolean>> {
    const token = this.getToken();
    if (!token) throw new Error('Authentication required');
    const endpoint = `/admin/units/${type}-request/${requestId}/reject`;
    await httpPut<any>(endpoint, remarks ? { remarks } : {}, { token });
    return { data: true, message: `${type} request rejected${remarks ? ' with remarks' : ''}`, status: 200 };
  }

  // PUT /admin/units/{type}-request/{request_id}/revert
  async revertRequest(requestId: number, type: string, remarks?: string): Promise<ApiResponse<boolean>> {
    const token = this.getToken();
    if (!token) throw new Error('Authentication required');
    const endpoint = `/admin/units/${type}-request/${requestId}/revert`;
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

  async getDistrictWiseData(): Promise<ApiResponse<DistrictWiseData[]>> {
    const token = this.getToken();
    if (!token) throw new Error('Authentication required');
    const data = await httpGet<DistrictWiseData[]>('/admin/district-wise-data', { token });
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
    
    const rawData = await httpGet<ApiArchivedMember[]>('/admin/units/archived-members', { 
      token,
      query: unitId ? { unit_id: unitId } : undefined 
    });
    
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
    
    // API returns snake_case fields
    interface ApiIndividualEvent {
      id: number;
      name: string;
      category?: string;
      description?: string;
      created_at?: string;
    }
    
    interface ApiGroupEvent {
      id: number;
      name: string;
      description?: string;
      min_allowed_limit: number;
      max_allowed_limit: number;
      per_unit_allowed_limit?: number;
      created_at?: string;
    }
    
    const rawData = await httpGet<{
      individual_events: ApiIndividualEvent[];
      group_events: ApiGroupEvent[];
    }>('/kalamela/admin/home', { token });
    
    // Transform API response to match frontend interfaces
    const individual_events: IndividualEvent[] = (rawData.individual_events || []).map(event => ({
      id: event.id,
      name: event.name,
      description: event.description || '',
      category: event.category,
      registrationFee: 50, // Default Rs.50 for individual events
      createdAt: event.created_at || new Date().toISOString(),
    }));
    
    const group_events: GroupEvent[] = (rawData.group_events || []).map(event => ({
      id: event.id,
      name: event.name,
      description: event.description || '',
      minAllowedLimit: event.min_allowed_limit,
      maxAllowedLimit: event.max_allowed_limit,
      registrationFee: 100, // Default Rs.100 for group events
      createdAt: event.created_at || new Date().toISOString(),
    }));
    
    return { data: { individual_events, group_events }, status: 200 };
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
  async addIndividualEvent(payload: { name: string; category?: string; description?: string }): Promise<ApiResponse<IndividualEvent>> {
    const token = this.getToken();
    if (!token) throw new Error('Authentication required');
    const response = await httpPost<any>('/kalamela/admin/events/individual', {
      name: payload.name,
      category: payload.category || null,
      description: payload.description || null,
    }, { token });
    return { data: response, message: 'Event created successfully', status: 200 };
  }

  // POST /kalamela/admin/events/group - Create group event
  async addGroupEvent(payload: {
    name: string;
    description?: string;
    max_allowed_limit: number;
    min_allowed_limit: number;
  }): Promise<ApiResponse<GroupEvent>> {
    const token = this.getToken();
    if (!token) throw new Error('Authentication required');
    const response = await httpPost<any>('/kalamela/admin/events/group', {
      name: payload.name,
      description: payload.description || null,
      max_allowed_limit: payload.max_allowed_limit,
      min_allowed_limit: payload.min_allowed_limit,
      per_unit_allowed_limit: payload.max_allowed_limit,
    }, { token });
    return { data: response, message: 'Event created successfully', status: 200 };
  }

  // PUT /kalamela/admin/events/individual/{event_id} - Update individual event
  async updateIndividualEvent(id: number, payload: Partial<{ name: string; category: string; description: string }>): Promise<ApiResponse<IndividualEvent>> {
    const token = this.getToken();
    if (!token) throw new Error('Authentication required');
    const response = await httpPut<any>(`/kalamela/admin/events/individual/${id}`, {
      name: payload.name || null,
      category: payload.category || null,
      description: payload.description || null,
    }, { token });
    return { data: response, message: 'Event updated successfully', status: 200 };
  }

  // PUT /kalamela/admin/events/group/{event_id} - Update group event
  async updateGroupEvent(id: number, payload: Partial<{
    name: string;
    description: string;
    max_allowed_limit: number;
    min_allowed_limit: number;
  }>): Promise<ApiResponse<GroupEvent>> {
    const token = this.getToken();
    if (!token) throw new Error('Authentication required');
    const response = await httpPut<any>(`/kalamela/admin/events/group/${id}`, {
      name: payload.name || null,
      description: payload.description || null,
      max_allowed_limit: payload.max_allowed_limit,
      min_allowed_limit: payload.min_allowed_limit,
    }, { token });
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

  // PUT /kalamela/admin/payment/{payment_id}/approve
  async approveKalamelaPayment(paymentId: number): Promise<ApiResponse<any>> {
    const token = this.getToken();
    if (!token) throw new Error('Authentication required');
    const data = await httpPut<any>(`/kalamela/admin/payment/${paymentId}/approve`, {}, { token });
    return { data, message: 'Payment approved successfully', status: 200 };
  }

  // PUT /kalamela/admin/payment/{payment_id}/decline
  async declineKalamelaPayment(paymentId: number, reason: string): Promise<ApiResponse<any>> {
    const token = this.getToken();
    if (!token) throw new Error('Authentication required');
    const data = await httpPut<any>(`/kalamela/admin/payment/${paymentId}/decline`, { reason }, { token });
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
    await httpPut<any>(`/kalamela/admin/payment/${paymentId}/approve`, {}, { token });
    return { data: true, message: 'Payment approved successfully', status: 200 };
  }

  async rejectPayment(paymentId: number, reason?: string): Promise<ApiResponse<boolean>> {
    const token = this.getToken();
    if (!token) throw new Error('Authentication required');
    await httpPut<any>(`/kalamela/admin/payment/${paymentId}/decline`, { reason }, { token });
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
}

export const api = new ApiService();
