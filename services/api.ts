
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
import { MOCK_METRICS, RECENT_REGISTRATIONS, EVENTS_LIST, MOCK_SCORES, CHART_DATA } from '../constants';
import { httpGet, httpPost, httpPut, httpDelete, httpPostFormData } from './http';

// Simulator for legacy mock delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

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
  // Hybrid methods (try real API, fallback to mock)
  // -------------------------
  async getDashboardMetrics(): Promise<ApiResponse<Metric[]>> {
    try {
      // This is now handled directly in AdminDashboard via adminDashboard()
      await delay(600);
      return { data: MOCK_METRICS, status: 200 };
    } catch {
      return { data: MOCK_METRICS, status: 200 };
    }
  }

  async getRecentRegistrations(token?: string): Promise<ApiResponse<Participant[]>> {
    try {
      if (token) {
        // Fetch real participations from API
        const participations = await this.getKalamelaIndividualParticipations();
        // Map to Participant format
        const mapped: Participant[] = participations.map((p: any) => ({
          id: String(p.id),
          chestNumber: p.chest_number,
          name: `Participant ${p.participant_id}`, // TODO: Need participant details endpoint
          unit: 'N/A',
          district: 'N/A',
          category: p.seniority_category || 'N/A',
          points: 0,
        }));
        return { data: mapped, status: 200 };
      }
    } catch (err) {
      console.warn('Failed to fetch real registrations, using mock', err);
    }
    await delay(800);
    return { data: RECENT_REGISTRATIONS, status: 200 };
  }

  async getChartData(token?: string): Promise<ApiResponse<any[]>> {
    try {
      if (token) {
        // Fetch real district statistics
        const stats = await this.getDistrictStatistics(token);
        const chartData = stats.map((s: any) => ({
          name: s.district_name,
          participants: s.members,
        }));
        return { data: chartData, status: 200 };
      }
    } catch (err) {
      console.warn('Failed to fetch real chart data, using mock', err);
    }
    await delay(500);
    return { data: CHART_DATA, status: 200 };
  }

  async getEvents(token?: string): Promise<ApiResponse<EventItem[]>> {
    try {
      if (token) {
        // Fetch real events from API
        const [individual, group] = await Promise.all([
          this.getKalamelaIndividualEvents(),
          this.getKalamelaGroupEvents()
        ]);
        
        const mapped: EventItem[] = [
          ...individual.map((e: any) => ({
            id: String(e.id),
            name: e.name,
            type: 'Individual' as const,
            status: 'Scheduled' as const, // TODO: Status not in API response
            registeredCount: 0, // TODO: Need to fetch participation count
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
    } catch (err) {
      console.warn('Failed to fetch real events, using mock', err);
    }
    await delay(400);
    return { data: EVENTS_LIST, status: 200 };
  }

  async getScores(eventId: string, token?: string): Promise<ApiResponse<ScoreEntry[]>> {
    try {
      if (token) {
        // Fetch real results from API
        const results = await this.getKalamelaIndividualResults();
        const mapped: ScoreEntry[] = results.map((r: any) => ({
          chestNumber: String(r.id), // TODO: Chest number not in response
          name: `Participant ${r.participant_id}`,
          judge1: Math.floor(r.awarded_mark / 3),
          judge2: Math.floor(r.awarded_mark / 3),
          judge3: Math.floor(r.awarded_mark / 3),
          total: r.awarded_mark,
          grade: r.grade,
        }));
        return { data: mapped, status: 200 };
      }
    } catch (err) {
      console.warn('Failed to fetch real scores, using mock', err);
    }
    await delay(700);
    return { data: MOCK_SCORES, status: 200 };
  }

  async saveScores(eventId: string, scores: ScoreEntry[], token?: string): Promise<ApiResponse<boolean>> {
    if (scores.some(s => s.total > 100)) {
      throw new Error('Validation Error: Score cannot exceed 100');
    }
    
    try {
      if (token) {
        // Save scores via API
        for (const score of scores) {
          await this.addAdminIndividualScore({
            participation_id: Number(eventId), // TODO: Need participation ID mapping
            awarded_mark: score.total,
            grade: score.grade,
            total_points: score.total,
          }, token);
        }
        return { data: true, message: 'Scores saved successfully', status: 200 };
      }
    } catch (err) {
      console.warn('Failed to save real scores, using mock', err);
    }
    
    await delay(1200);
    return { data: true, message: 'Scores saved successfully', status: 200 };
  }

  async searchParticipant(query: string, token?: string): Promise<ApiResponse<Participant | null>> {
    try {
      if (token) {
        // Search in real participations
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
      }
    } catch (err) {
      console.warn('Failed to search real participant, using mock', err);
    }
    
    await delay(600);
    const result = RECENT_REGISTRATIONS.find(
      p => p.chestNumber === query || p.name.toLowerCase().includes(query.toLowerCase())
    );
    return { data: result || null, status: 200 };
  }

  // -------------------------
  // Unit Admin Mock API Methods
  // -------------------------

  // Mock data generators
  private generateMockUnits(): Unit[] {
    const districts = ['Kottayam', 'Changanassery', 'Thiruvalla', 'Mallappally', 'Tiruvalla West'];
    const units: Unit[] = [];
    
    for (let i = 1; i <= 35; i++) {
      units.push({
        id: i,
        unitNumber: `MKD${String(i).padStart(3, '0')}`,
        name: `St. ${['Thomas', 'George', 'Mary', 'John', 'Peter', 'Paul'][i % 6]} Church Unit ${i}`,
        clergyDistrict: districts[i % districts.length],
        registrationYear: 2024,
        status: i <= 28 ? 'Completed' : i <= 32 ? 'Pending' : 'Not Registered',
        membersCount: Math.floor(Math.random() * 50) + 15,
        officialsCount: 5,
        councilorsCount: Math.floor(Math.random() * 8) + 3,
      });
    }
    return units;
  }

  private generateMockMembers(): UnitMember[] {
    const units = this.generateMockUnits();
    const members: UnitMember[] = [];
    const firstNames = ['Arun', 'Anjali', 'Biju', 'Divya', 'Deepak', 'Elsa', 'Francis', 'George', 'Hannah', 'Isaac', 
                        'John', 'Jyothi', 'Kurian', 'Lina', 'Mathew', 'Mary', 'Nikhil', 'Priya', 'Raju', 'Sarah',
                        'Thomas', 'Tina', 'Varghese', 'Wincy', 'Xavier', 'Zeba'];
    const lastNames = ['Abraham', 'Chacko', 'Daniel', 'George', 'Jacob', 'Joseph', 'Kurian', 'Mathew', 
                       'Paul', 'Philip', 'Samuel', 'Simon', 'Thomas', 'Varghese'];
    const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', ''];
    const qualifications = ['BSc', 'BA', 'BCom', 'BTech', 'MSc', 'MA', 'MBA', 'MCA', 'Plus Two', 'Degree Student', ''];
    
    let memberId = 1;
    units.forEach(unit => {
      const count = unit.membersCount;
      for (let i = 0; i < count; i++) {
        const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
        const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
        const dob = new Date(1995 + Math.floor(Math.random() * 16), Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1);
        const age = new Date().getFullYear() - dob.getFullYear();
        
        members.push({
          id: memberId++,
          name: `${firstName} ${lastName}`,
          gender: Math.random() > 0.5 ? 'M' : 'F',
          number: `${Math.floor(Math.random() * 900000000) + 6000000000}`,
          dob: dob.toISOString().split('T')[0],
          age,
          qualification: qualifications[Math.floor(Math.random() * qualifications.length)] || undefined,
          bloodGroup: bloodGroups[Math.floor(Math.random() * bloodGroups.length)] || undefined,
          unitId: unit.id,
          unitName: unit.name,
          isArchived: false,
        });
      }
    });
    return members;
  }

  private generateMockOfficials(): UnitOfficial[] {
    const units = this.generateMockUnits();
    const designations = ['Rev.', 'Rev. Fr.', 'Catechist', 'Reader', ''];
    
    return units.slice(0, 28).map(unit => ({
      id: unit.id,
      unitId: unit.id,
      unitName: unit.name,
      presidentDesignation: designations[Math.floor(Math.random() * designations.length)] || undefined,
      presidentName: `Rev. ${['John', 'Thomas', 'George', 'Paul'][unit.id % 4]} ${['Abraham', 'Chacko', 'Mathew'][unit.id % 3]}`,
      presidentPhone: `${Math.floor(Math.random() * 900000000) + 9400000000}`,
      vicePresidentName: `${['Biju', 'Arun', 'Raju', 'Mathew'][unit.id % 4]} ${['Joseph', 'Philip', 'Samuel'][unit.id % 3]}`,
      vicePresidentPhone: `${Math.floor(Math.random() * 900000000) + 9400000000}`,
      secretaryName: `${['Sarah', 'Mary', 'Anjali', 'Priya'][unit.id % 4]} ${['Thomas', 'George', 'Jacob'][unit.id % 3]}`,
      secretaryPhone: `${Math.floor(Math.random() * 900000000) + 9400000000}`,
      jointSecretaryName: `${['Deepak', 'Francis', 'Kurian', 'Nikhil'][unit.id % 4]} ${['Daniel', 'Simon', 'Paul'][unit.id % 3]}`,
      jointSecretaryPhone: `${Math.floor(Math.random() * 900000000) + 9400000000}`,
      treasurerName: `${['Hannah', 'Divya', 'Lina', 'Elsa'][unit.id % 4]} ${['Varghese', 'Abraham', 'Chacko'][unit.id % 3]}`,
      treasurerPhone: `${Math.floor(Math.random() * 900000000) + 9400000000}`,
    }));
  }

  private generateMockCouncilors(): UnitCouncilor[] {
    const members = this.generateMockMembers();
    const councilors: UnitCouncilor[] = [];
    const units = this.generateMockUnits();
    
    units.slice(0, 28).forEach(unit => {
      const unitMembers = members.filter(m => m.unitId === unit.id);
      const count = Math.min(unit.councilorsCount, unitMembers.length);
      
      for (let i = 0; i < count; i++) {
        const member = unitMembers[i];
        councilors.push({
          id: councilors.length + 1,
          unitId: unit.id,
          unitName: unit.name,
          memberId: member.id,
          memberName: member.name,
          memberPhone: member.number,
          memberGender: member.gender,
          memberDob: member.dob,
          memberQualification: member.qualification,
        });
      }
    });
    return councilors;
  }

  private generateMockTransferRequests(): TransferRequest[] {
    const units = this.generateMockUnits();
    const members = this.generateMockMembers();
    const statuses: RequestStatus[] = ['PENDING', 'APPROVED', 'REJECTED'];
    
    return Array.from({ length: 12 }, (_, i) => {
      const member = members[i * 5];
      const currentUnit = units.find(u => u.id === member.unitId)!;
      const destUnit = units[(member.unitId + 3) % units.length];
      const createdDate = new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000);
      
      return {
        id: i + 1,
        createdAt: createdDate.toISOString(),
        memberId: member.id,
        memberName: member.name,
        currentUnitId: currentUnit.id,
        currentUnitName: currentUnit.name,
        destinationUnitId: destUnit.id,
        destinationUnitName: destUnit.name,
        reason: ['Family relocation', 'Job transfer', 'Marriage', 'Higher studies'][i % 4],
        status: statuses[i % 3],
        proof: i % 3 !== 2 ? '/files/proof-document.pdf' : undefined,
      };
    });
  }

  private generateMockMemberInfoChangeRequests(): MemberInfoChangeRequest[] {
    const members = this.generateMockMembers();
    const statuses: RequestStatus[] = ['PENDING', 'APPROVED', 'REJECTED'];
    
    return Array.from({ length: 8 }, (_, i) => {
      const member = members[i * 7];
      const createdDate = new Date(Date.now() - Math.random() * 20 * 24 * 60 * 60 * 1000);
      const units = this.generateMockUnits();
      const unit = units.find(u => u.id === member.unitId)!;
      
      return {
        id: i + 1,
        createdAt: createdDate.toISOString(),
        memberId: member.id,
        memberName: member.name,
        unitName: unit.name,
        changes: {
          name: i % 4 === 0 ? `${member.name} Updated` : undefined,
          bloodGroup: i % 3 === 0 ? 'B+' : undefined,
          qualification: i % 2 === 0 ? 'Updated Qualification' : undefined,
        },
        reason: 'Correction in personal information',
        status: statuses[i % 3],
        proof: i % 3 !== 2 ? '/files/proof-document.pdf' : undefined,
      };
    });
  }

  private generateMockOfficialsChangeRequests(): OfficialsChangeRequest[] {
    const officials = this.generateMockOfficials();
    const statuses: RequestStatus[] = ['PENDING', 'APPROVED', 'REJECTED'];
    
    return Array.from({ length: 6 }, (_, i) => {
      const official = officials[i * 2];
      const createdDate = new Date(Date.now() - Math.random() * 25 * 24 * 60 * 60 * 1000);
      
      return {
        id: i + 1,
        createdAt: createdDate.toISOString(),
        unitId: official.unitId,
        unitName: official.unitName,
        originalOfficials: {
          presidentDesignation: official.presidentDesignation,
          presidentName: official.presidentName,
          presidentPhone: official.presidentPhone,
          vicePresidentName: official.vicePresidentName,
          vicePresidentPhone: official.vicePresidentPhone,
          secretaryName: official.secretaryName,
          secretaryPhone: official.secretaryPhone,
          jointSecretaryName: official.jointSecretaryName,
          jointSecretaryPhone: official.jointSecretaryPhone,
          treasurerName: official.treasurerName,
          treasurerPhone: official.treasurerPhone,
        },
        requestedChanges: {
          secretaryName: i % 2 === 0 ? 'New Secretary Name' : undefined,
          secretaryPhone: i % 2 === 0 ? '9876543210' : undefined,
          treasurerName: i % 3 === 0 ? 'New Treasurer Name' : undefined,
          treasurerPhone: i % 3 === 0 ? '9876543211' : undefined,
        },
        reason: 'Change in unit leadership',
        status: statuses[i % 3],
        proof: i % 3 !== 2 ? '/files/proof-document.pdf' : undefined,
      };
    });
  }

  private generateMockCouncilorChangeRequests(): CouncilorChangeRequest[] {
    const councilors = this.generateMockCouncilors();
    const members = this.generateMockMembers();
    const statuses: RequestStatus[] = ['PENDING', 'APPROVED', 'REJECTED'];
    
    return Array.from({ length: 7 }, (_, i) => {
      const councilor = councilors[i * 3];
      const unitMembers = members.filter(m => m.unitId === councilor.unitId && m.id !== councilor.memberId);
      const newMember = unitMembers[0];
      const createdDate = new Date(Date.now() - Math.random() * 15 * 24 * 60 * 60 * 1000);
      
      return {
        id: i + 1,
        createdAt: createdDate.toISOString(),
        unitId: councilor.unitId,
        unitName: councilor.unitName,
        councilorId: councilor.id,
        originalMemberId: councilor.memberId,
        originalMemberName: councilor.memberName,
        newMemberId: newMember?.id,
        newMemberName: newMember?.name,
        reason: 'Councilor resignation/replacement',
        status: statuses[i % 3],
        proof: i % 3 !== 2 ? '/files/proof-document.pdf' : undefined,
      };
    });
  }

  private generateMockMemberAddRequests(): MemberAddRequest[] {
    const units = this.generateMockUnits();
    const statuses: RequestStatus[] = ['PENDING', 'APPROVED', 'REJECTED'];
    const firstNames = ['Anoop', 'Betty', 'Cyril', 'Diana', 'Edwin', 'Feba', 'Gokul', 'Hanna'];
    
    return Array.from({ length: 10 }, (_, i) => {
      const unit = units[i % units.length];
      const createdDate = new Date(Date.now() - Math.random() * 10 * 24 * 60 * 60 * 1000);
      
      return {
        id: i + 1,
        createdAt: createdDate.toISOString(),
        unitId: unit.id,
        unitName: unit.name,
        name: `${firstNames[i % firstNames.length]} New Member`,
        gender: i % 2 === 0 ? 'M' : 'F',
        number: `${Math.floor(Math.random() * 900000000) + 9400000000}`,
        dob: new Date(2000 + i, i % 12, (i % 28) + 1).toISOString().split('T')[0],
        qualification: ['BSc', 'BA', 'Plus Two'][i % 3],
        bloodGroup: ['A+', 'B+', 'O+'][i % 3],
        reason: 'New member joining the unit',
        status: statuses[i % 3],
        proof: i % 3 !== 2 ? '/files/proof-document.pdf' : undefined,
      };
    });
  }

  // ==================== ADMIN UNITS ENDPOINTS ====================

  // GET /admin/units/dashboard - Units Admin Dashboard Stats
  async getUnitStats(): Promise<ApiResponse<UnitStats>> {
    const token = this.getToken();
    if (!token) throw new Error('Authentication required');
    try {
      const data = await httpGet<any>('/admin/units/dashboard', { token });
      return { data, status: 200 };
    } catch (err) {
      // Fallback to mock
      await delay(600);
      const units = this.generateMockUnits();
      const members = this.generateMockMembers();
      const requests = [
        ...this.generateMockTransferRequests(),
        ...this.generateMockMemberInfoChangeRequests(),
        ...this.generateMockOfficialsChangeRequests(),
        ...this.generateMockCouncilorChangeRequests(),
        ...this.generateMockMemberAddRequests(),
      ];
      
      const districts = new Set(units.map(u => u.clergyDistrict));
      const completedDistricts = new Set(units.filter(u => u.status === 'Completed').map(u => u.clergyDistrict));
      const maxMemberUnit = units.reduce((max, unit) => unit.membersCount > max.membersCount ? unit : max);
      
      return {
        data: {
          totalDistricts: districts.size,
          completedDistricts: completedDistricts.size,
          totalUnits: units.length,
          completedUnits: units.filter(u => u.status === 'Completed').length,
          totalMembers: members.length,
          maleMembers: members.filter(m => m.gender === 'M').length,
          femaleMembers: members.filter(m => m.gender === 'F').length,
          pendingRequests: requests.filter(r => r.status === 'PENDING').length,
          maxMemberUnit: maxMemberUnit.name,
          maxMemberCount: maxMemberUnit.membersCount,
        },
        status: 200,
      };
    }
  }

  // GET /admin/units - Get all units
  async getUnits(): Promise<ApiResponse<Unit[]>> {
    const token = this.getToken();
    if (!token) {
      console.error('[API] getUnits: Authentication required - no token found');
      throw new Error('Authentication required');
    }
    try {
      console.log('[API] getUnits: Fetching from backend...');
      const data = await httpGet<any[]>('/admin/units', { token });
      console.log('[API] getUnits: Success, received', data?.length || 0, 'units');
      return { data, status: 200 };
    } catch (err) {
      console.warn('[API] getUnits: Backend failed, using mock data:', err);
      await delay(500);
      return { data: this.generateMockUnits(), status: 200 };
    }
  }

  // GET /admin/units/{unit_id} - Get unit by ID
  async getUnitById(id: number): Promise<ApiResponse<Unit>> {
    const token = this.getToken();
    if (!token) throw new Error('Authentication required');
    try {
      const data = await httpGet<any>(`/admin/units/${id}`, { token });
      return { data, status: 200 };
    } catch (err) {
      await delay(400);
      const units = this.generateMockUnits();
      const unit = units.find(u => u.id === id);
      if (!unit) throw new Error('Unit not found');
      return { data: unit, status: 200 };
    }
  }

  // GET /admin/units/members - Get all members (optionally filtered by unit)
  async getUnitMembers(unitId?: number): Promise<ApiResponse<UnitMember[]>> {
    const token = this.getToken();
    if (!token) throw new Error('Authentication required');
    try {
      const data = await httpGet<any[]>('/admin/units/members', { 
        token,
        query: unitId ? { unit_id: unitId } : undefined 
      });
      return { data, status: 200 };
    } catch (err) {
      await delay(600);
      const members = this.generateMockMembers();
      return { 
        data: unitId ? members.filter(m => m.unitId === unitId) : members, 
        status: 200 
      };
    }
  }

  // GET /admin/units/officials - Get all officials (optionally filtered by unit)
  async getUnitOfficials(unitId?: number): Promise<ApiResponse<UnitOfficial[]>> {
    const token = this.getToken();
    if (!token) throw new Error('Authentication required');
    try {
      const data = await httpGet<any[]>('/admin/units/officials', { 
        token,
        query: unitId ? { unit_id: unitId } : undefined 
      });
      return { data, status: 200 };
    } catch (err) {
      await delay(500);
      const officials = this.generateMockOfficials();
      return { 
        data: unitId ? officials.filter(o => o.unitId === unitId) : officials, 
        status: 200 
      };
    }
  }

  // GET /admin/units/councilors - Get all councilors (optionally filtered by unit)
  async getUnitCouncilors(unitId?: number): Promise<ApiResponse<UnitCouncilor[]>> {
    const token = this.getToken();
    if (!token) throw new Error('Authentication required');
    try {
      const data = await httpGet<any[]>('/admin/units/councilors', { 
        token,
        query: unitId ? { unit_id: unitId } : undefined 
      });
      return { data, status: 200 };
    } catch (err) {
      await delay(500);
      const councilors = this.generateMockCouncilors();
      return { 
        data: unitId ? councilors.filter(c => c.unitId === unitId) : councilors, 
        status: 200 
      };
    }
  }

  // GET /admin/units/transfer-requests - Get all transfer requests
  async getTransferRequests(): Promise<ApiResponse<TransferRequest[]>> {
    const token = this.getToken();
    if (!token) throw new Error('Authentication required');
    try {
      const data = await httpGet<any[]>('/admin/units/transfer-requests', { token });
      return { data, status: 200 };
    } catch (err) {
      await delay(700);
      return { data: this.generateMockTransferRequests(), status: 200 };
    }
  }

  // GET /admin/units/member-change-requests - Get member info change requests
  async getMemberInfoChangeRequests(): Promise<ApiResponse<MemberInfoChangeRequest[]>> {
    const token = this.getToken();
    if (!token) throw new Error('Authentication required');
    try {
      const data = await httpGet<any[]>('/admin/units/member-change-requests', { token });
      return { data, status: 200 };
    } catch (err) {
      await delay(700);
      return { data: this.generateMockMemberInfoChangeRequests(), status: 200 };
    }
  }

  // GET /admin/units/officials-change-requests - Get officials change requests
  async getOfficialsChangeRequests(): Promise<ApiResponse<OfficialsChangeRequest[]>> {
    const token = this.getToken();
    if (!token) throw new Error('Authentication required');
    try {
      const data = await httpGet<any[]>('/admin/units/officials-change-requests', { token });
      return { data, status: 200 };
    } catch (err) {
      await delay(700);
      return { data: this.generateMockOfficialsChangeRequests(), status: 200 };
    }
  }

  // GET /admin/units/councilor-change-requests - Get councilor change requests
  async getCouncilorChangeRequests(): Promise<ApiResponse<CouncilorChangeRequest[]>> {
    const token = this.getToken();
    if (!token) throw new Error('Authentication required');
    try {
      const data = await httpGet<any[]>('/admin/units/councilor-change-requests', { token });
      return { data, status: 200 };
    } catch (err) {
      await delay(700);
      return { data: this.generateMockCouncilorChangeRequests(), status: 200 };
    }
  }

  // GET /admin/units/member-add-requests - Get member add requests
  async getMemberAddRequests(): Promise<ApiResponse<MemberAddRequest[]>> {
    const token = this.getToken();
    if (!token) throw new Error('Authentication required');
    try {
      const data = await httpGet<any[]>('/admin/units/member-add-requests', { token });
      return { data, status: 200 };
    } catch (err) {
      await delay(700);
      return { data: this.generateMockMemberAddRequests(), status: 200 };
    }
  }

  // PUT /admin/units/transfer-request/{request_id}/approve
  // PUT /admin/units/member-change-request/{request_id}/approve
  // PUT /admin/units/officials-change-request/{request_id}/approve
  // PUT /admin/units/councilor-change-request/{request_id}/approve
  // PUT /admin/units/member-add-request/{request_id}/approve
  async approveRequest(requestId: number, type: string, remarks?: string): Promise<ApiResponse<boolean>> {
    const token = this.getToken();
    if (!token) throw new Error('Authentication required');
    try {
      const endpoint = `/admin/units/${type}-request/${requestId}/approve`;
      await httpPut<any>(endpoint, remarks ? { remarks } : {}, { token });
      return { data: true, message: `${type} request approved successfully`, status: 200 };
    } catch (err) {
      await delay(800);
      return { data: true, message: `${type} request approved successfully (mock)`, status: 200 };
    }
  }

  // PUT /admin/units/{type}-request/{request_id}/reject
  async rejectRequest(requestId: number, type: string, remarks?: string): Promise<ApiResponse<boolean>> {
    const token = this.getToken();
    if (!token) throw new Error('Authentication required');
    try {
      const endpoint = `/admin/units/${type}-request/${requestId}/reject`;
      await httpPut<any>(endpoint, remarks ? { remarks } : {}, { token });
      return { data: true, message: `${type} request rejected${remarks ? ' with remarks' : ''}`, status: 200 };
    } catch (err) {
      await delay(800);
      return { data: true, message: `${type} request rejected (mock)`, status: 200 };
    }
  }

  // PUT /admin/units/{type}-request/{request_id}/revert
  async revertRequest(requestId: number, type: string, remarks?: string): Promise<ApiResponse<boolean>> {
    const token = this.getToken();
    if (!token) throw new Error('Authentication required');
    try {
      const endpoint = `/admin/units/${type}-request/${requestId}/revert`;
      await httpPut<any>(endpoint, remarks ? { remarks } : {}, { token });
      return { data: true, message: `${type} request reverted`, status: 200 };
    } catch (err) {
      await delay(800);
      return { data: true, message: `${type} request reverted (mock)`, status: 200 };
    }
  }

  // POST /admin/units/{unit_id}/archive-member/{member_id} - Archive a member
  async archiveMember(unitId: number, memberId: number, reason: string): Promise<ApiResponse<any>> {
    const token = this.getToken();
    if (!token) throw new Error('Authentication required');
    try {
      const data = await httpPost<any>(
        `/admin/units/${unitId}/archive-member/${memberId}`,
        { reason },
        { token }
      );
      return { data, message: 'Member archived successfully', status: 200 };
    } catch (err) {
      await delay(600);
      return { data: {}, message: 'Member archived successfully (mock)', status: 200 };
    }
  }

  // POST /admin/units/restore-member/{member_id} - Restore archived member
  async restoreMember(memberId: number): Promise<ApiResponse<any>> {
    const token = this.getToken();
    if (!token) throw new Error('Authentication required');
    try {
      const data = await httpPost<any>(`/admin/units/restore-member/${memberId}`, {}, { token });
      return { data, message: 'Member restored successfully', status: 200 };
    } catch (err) {
      await delay(600);
      return { data: {}, message: 'Member restored successfully (mock)', status: 200 };
    }
  }

  // GET /admin/units/export/{export_type} - Export various unit data
  async exportData(type: string, id?: number): Promise<ApiResponse<Blob>> {
    const token = this.getToken();
    if (!token) throw new Error('Authentication required');
    try {
      let endpoint = `/admin/units/export/${type}`;
      if (id) endpoint += `?id=${id}`;
      const blob = await httpGet<Blob>(endpoint, { token, asBlob: true });
      return { data: blob, message: 'Data exported successfully', status: 200 };
    } catch (err) {
      await delay(1000);
      const blob = new Blob(['Mock Excel Data'], { type: 'application/vnd.ms-excel' });
      return { data: blob, message: 'Data exported successfully (mock)', status: 200 };
    }
  }

  async getDistrictWiseData(): Promise<ApiResponse<DistrictWiseData[]>> {
    await delay(500);
    const units = this.generateMockUnits();
    const districtMap = new Map<string, number>();
    
    units.forEach(unit => {
      const count = districtMap.get(unit.clergyDistrict) || 0;
      districtMap.set(unit.clergyDistrict, count + unit.membersCount);
    });
    
    const data = Array.from(districtMap.entries()).map(([name, participants]) => ({
      name,
      participants,
    }));
    
    return { data, status: 200 };
  }

  // ==================== SYSTEM ADMIN ENDPOINTS ====================

  // GET /system/districts - Get all districts
  async getClergyDistricts(): Promise<ApiResponse<ClergyDistrict[]>> {
    const token = this.getToken();
    try {
      if (token) {
        const data = await httpGet<any[]>('/system/districts', { token });
        return { data, status: 200 };
      }
    } catch (err) {
      console.log('Backend unavailable, using mock data');
    }
    await delay(300);
    return {
      data: [
        { id: 1, name: 'Kottayam' },
        { id: 2, name: 'Changanassery' },
        { id: 3, name: 'Thiruvalla' },
        { id: 4, name: 'Mallappally' },
        { id: 5, name: 'Tiruvalla West' },
      ],
      status: 200,
    };
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
    await delay(600);
    const members = this.generateMockMembers();
    const archivedMembers: ArchivedMember[] = members.slice(0, 5).map((member, index) => ({
      ...member,
      isArchived: true,
      archivedAt: new Date(Date.now() - (index + 1) * 5 * 24 * 60 * 60 * 1000).toISOString(),
      archivedBy: 'Admin User',
      archiveReason: ['Age limit exceeded', 'Transferred to other diocese', 'Moved abroad', 'Personal request', 'Inactive member'][index],
    }));
    
    return { 
      data: unitId ? archivedMembers.filter(m => m.unitId === unitId) : archivedMembers,
      status: 200 
    };
  }

  // User Request Submissions
  async submitTransferRequest(data: TransferRequestSubmission): Promise<ApiResponse<boolean>> {
    await delay(800);
    return { data: true, message: 'Transfer request submitted successfully', status: 200 };
  }

  async submitMemberInfoChange(data: MemberInfoChangeSubmission): Promise<ApiResponse<boolean>> {
    await delay(800);
    return { data: true, message: 'Member info change request submitted successfully', status: 200 };
  }

  async submitOfficialsChange(data: OfficialsChangeSubmission): Promise<ApiResponse<boolean>> {
    await delay(800);
    return { data: true, message: 'Officials change request submitted successfully', status: 200 };
  }

  async submitCouncilorChange(data: CouncilorChangeSubmission): Promise<ApiResponse<boolean>> {
    await delay(800);
    return { data: true, message: 'Councilor change request submitted successfully', status: 200 };
  }

  async submitMemberAdd(data: MemberAddSubmission): Promise<ApiResponse<boolean>> {
    await delay(800);
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
    await delay(700);
    const allTransfers = this.generateMockTransferRequests();
    const allMemberInfoChanges = this.generateMockMemberInfoChangeRequests();
    const allOfficialsChanges = this.generateMockOfficialsChangeRequests();
    const allCouncilorChanges = this.generateMockCouncilorChangeRequests();
    const allMemberAdds = this.generateMockMemberAddRequests();
    
    return {
      data: {
        transfers: allTransfers.filter(r => r.currentUnitId === unitId).slice(0, 3),
        memberInfoChanges: allMemberInfoChanges.slice(0, 2),
        officialsChanges: allOfficialsChanges.filter(r => r.unitId === unitId).slice(0, 2),
        councilorChanges: allCouncilorChanges.filter(r => r.unitId === unitId).slice(0, 2),
        memberAdds: allMemberAdds.filter(r => r.unitId === unitId).slice(0, 3),
      },
      status: 200,
    };
  }

  // ==================== KALAMELA API FUNCTIONS ====================

  // Mock Data Generators for Kalamela
  private generateMockIndividualEvents(): IndividualEvent[] {
    return [
      { id: 1, name: 'Classical Singing', description: 'Classical music performance', category: 'Music', registrationFee: 50, remainingSlots: 50, createdAt: new Date().toISOString() },
      { id: 2, name: 'Light Music', description: 'Light music performance', category: 'Music', registrationFee: 50, remainingSlots: 45, createdAt: new Date().toISOString() },
      { id: 3, name: 'Classical Dance', description: 'Classical dance performance', category: 'Dance', registrationFee: 50, remainingSlots: 40, createdAt: new Date().toISOString() },
      { id: 4, name: 'Folk Dance', description: 'Folk dance performance', category: 'Dance', registrationFee: 50, remainingSlots: 35, createdAt: new Date().toISOString() },
      { id: 5, name: 'Drawing', description: 'Drawing competition', category: 'Arts', registrationFee: 50, remainingSlots: 60, createdAt: new Date().toISOString() },
      { id: 6, name: 'Painting', description: 'Painting competition', category: 'Arts', registrationFee: 50, remainingSlots: 55, createdAt: new Date().toISOString() },
      { id: 7, name: 'Poetry Writing', description: 'Poetry writing in Malayalam', category: 'Literary', registrationFee: 50, remainingSlots: 50, createdAt: new Date().toISOString() },
      { id: 8, name: 'Essay Writing', description: 'Essay writing competition', category: 'Literary', registrationFee: 50, remainingSlots: 48, createdAt: new Date().toISOString() },
      { id: 9, name: 'Pencil Drawing', description: 'Pencil drawing competition', category: 'Arts', registrationFee: 50, remainingSlots: 52, createdAt: new Date().toISOString() },
      { id: 10, name: 'Bible Quiz', description: 'Bible knowledge quiz', category: 'Religious', registrationFee: 50, remainingSlots: 45, createdAt: new Date().toISOString() },
    ];
  }

  private generateMockGroupEvents(): GroupEvent[] {
    return [
      { id: 1, name: 'Group Dance', description: 'Group dance performance', minAllowedLimit: 5, maxAllowedLimit: 10, registrationFee: 100, remainingSlots: 20, createdAt: new Date().toISOString() },
      { id: 2, name: 'Choir', description: 'Choir singing performance', minAllowedLimit: 8, maxAllowedLimit: 15, registrationFee: 100, remainingSlots: 15, createdAt: new Date().toISOString() },
      { id: 3, name: 'Drama', description: 'Drama performance', minAllowedLimit: 5, maxAllowedLimit: 12, registrationFee: 100, remainingSlots: 18, createdAt: new Date().toISOString() },
      { id: 4, name: 'Group Song', description: 'Group song performance', minAllowedLimit: 4, maxAllowedLimit: 8, registrationFee: 100, remainingSlots: 22, createdAt: new Date().toISOString() },
      { id: 5, name: 'Thiruvachanam', description: 'Bible verse recitation', minAllowedLimit: 3, maxAllowedLimit: 6, registrationFee: 100, remainingSlots: 25, createdAt: new Date().toISOString() },
    ];
  }

  private generateMockEventParticipants(): EventParticipant[] {
    const participants: EventParticipant[] = [];
    const districts = ['Kottayam', 'Changanassery', 'Thiruvalla', 'Mallappally'];
    const units = this.generateMockUnits();
    const members = this.generateMockMembers();
    
    // Generate some mock registrations
    for (let i = 0; i < 50; i++) {
      const member = members[i % members.length];
      const district = districts[i % districts.length];
      const eventId = (i % 10) + 1;
      
      participants.push({
        id: i + 1,
        eventId,
        eventName: this.generateMockIndividualEvents()[eventId - 1].name,
        eventType: 'INDIVIDUAL',
        memberId: member.id,
        memberName: member.name,
        unitId: member.unitId,
        unitName: member.unitName,
        districtId: (i % 4) + 1,
        districtName: district,
        memberPhone: member.number,
        chestNumber: `${district.substring(0, 3).toUpperCase()}-IE${eventId}-${String(i + 1).padStart(3, '0')}`,
        registeredAt: new Date(Date.now() - Math.random() * 10 * 24 * 60 * 60 * 1000).toISOString(),
      });
    }
    
    return participants;
  }

  private generateMockGroupTeams(): GroupEventTeam[] {
    const teams: GroupEventTeam[] = [];
    const units = this.generateMockUnits();
    const members = this.generateMockMembers();
    const groupEvents = this.generateMockGroupEvents();
    
    for (let i = 0; i < 10; i++) {
      const unit = units[i % units.length];
      const event = groupEvents[i % groupEvents.length];
      const teamSize = event.minAllowedLimit + Math.floor(Math.random() * (event.maxAllowedLimit - event.minAllowedLimit));
      const teamMembers: EventParticipant[] = [];
      
      for (let j = 0; j < teamSize; j++) {
        const member = members[(i * 5 + j) % members.length];
        teamMembers.push({
          id: i * 100 + j,
          eventId: event.id,
          eventName: event.name,
          eventType: 'GROUP',
          memberId: member.id,
          memberName: member.name,
          unitId: unit.id,
          unitName: unit.name,
          districtId: (i % 4) + 1,
          districtName: unit.clergyDistrict,
          memberPhone: member.number,
          chestNumber: `${unit.clergyDistrict.substring(0, 3).toUpperCase()}-GE${event.id}-T${i + 1}`,
          registeredAt: new Date(Date.now() - Math.random() * 10 * 24 * 60 * 60 * 1000).toISOString(),
        });
      }
      
      teams.push({
        id: i + 1,
        eventId: event.id,
        eventName: event.name,
        chestNumber: `${unit.clergyDistrict.substring(0, 3).toUpperCase()}-GE${event.id}-T${i + 1}`,
        teamMembers,
        unitId: unit.id,
        unitName: unit.name,
        districtId: (i % 4) + 1,
        districtName: unit.clergyDistrict,
        registeredAt: new Date(Date.now() - Math.random() * 10 * 24 * 60 * 60 * 1000).toISOString(),
      });
    }
    
    return teams;
  }

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
    try {
      const data = await httpGet<any>('/kalamela/home');
      return { data, status: 200 };
    } catch (err) {
      await delay(400);
      return {
        data: {
          total_individual_events: 10,
          total_group_events: 5,
          total_individual_participants: 100,
          total_group_teams: 20,
          message: 'Welcome to CSI Madhya Kerala Diocese Youth Movement Kalamela',
        },
        status: 200,
      };
    }
  }

  // POST /kalamela/find-participant - Search by chest number
  async findParticipantByChestNumber(chestNumber: string): Promise<ApiResponse<any>> {
    try {
      const data = await httpPost<any>('/kalamela/find-participant', {}, { query: { chest_number: chestNumber } });
      return { data, status: 200 };
    } catch (err) {
      throw err;
    }
  }

  // GET /kalamela/results - Public results (top 3)
  async getPublicKalamelaResults(): Promise<ApiResponse<any>> {
    try {
      const data = await httpGet<any>('/kalamela/results');
      return { data, status: 200 };
    } catch (err) {
      await delay(600);
      return { data: { individual_results: {}, group_results: {} }, status: 200 };
    }
  }

  // GET /kalamela/kalaprathibha - Top performers
  async getKalaprathibha(): Promise<ApiResponse<any>> {
    try {
      const data = await httpGet<any>('/kalamela/kalaprathibha');
      return { data, status: 200 };
    } catch (err) {
      await delay(600);
      return { data: { kalaprathibha: [], kalathilakam: [] }, status: 200 };
    }
  }

  // POST /kalamela/appeal/check - Check appeal eligibility
  async checkAppealEligibility(chestNumber: string, eventName: string): Promise<ApiResponse<any>> {
    try {
      const data = await httpPost<any>('/kalamela/appeal/check', {}, {
        query: { chest_number: chestNumber, event_name: eventName }
      });
      return { data, status: 200 };
    } catch (err) {
      throw err;
    }
  }

  // POST /kalamela/appeal/submit - Submit appeal
  async submitAppeal(data: {
    participant_id: number;
    chest_number: string;
    event_name: string;
    statement: string;
    payment_type: string;
  }): Promise<ApiResponse<any>> {
    try {
      const response = await httpPost('/kalamela/appeal/submit', data);
      return { data: response, message: 'Appeal submitted successfully', status: 200 };
    } catch (err) {
      throw err;
    }
  }

  // GET /kalamela/appeals/status - View appeal status
  async getAppealStatus(participantId?: number, chestNumber?: string): Promise<ApiResponse<any[]>> {
    try {
      const data = await httpGet<any[]>('/kalamela/appeals/status', {
        query: { participant_id: participantId, chest_number: chestNumber }
      });
      return { data, status: 200 };
    } catch (err) {
      throw err;
    }
  }

  // ==================== KALAMELA OFFICIAL ENDPOINTS ====================

  // GET /kalamela/official/home - Official home page
  async getKalamelaOfficialHome(): Promise<ApiResponse<any>> {
    const token = this.getToken();
    if (!token) throw new Error('Authentication required');
    try {
      const data = await httpGet<any>('/kalamela/official/home', { token });
      return { data, status: 200 };
    } catch (err) {
      await delay(600);
      return {
        data: {
          individual_events: this.generateMockIndividualEvents(),
          group_events: this.generateMockGroupEvents(),
          district_id: 1,
        },
        status: 200,
      };
    }
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
  async addIndividualParticipant(data: {
    individual_event_id: number;
    participant_id: number;
    seniority_category: 'NA' | 'Junior' | 'Senior';
  }): Promise<ApiResponse<any>> {
    const token = this.getToken();
    if (!token) throw new Error('Authentication required');
    const response = await httpPost('/kalamela/official/events/individual/add', data, { token });
    return { data: response, message: 'Participant added successfully', status: 200 };
  }

  // GET /kalamela/official/participants/individual - View all individual participants
  async getOfficialIndividualParticipants(): Promise<ApiResponse<any>> {
    const token = this.getToken();
    if (!token) throw new Error('Authentication required');
    try {
      const data = await httpGet<any>('/kalamela/official/participants/individual', { token });
      return { data, status: 200 };
    } catch (err) {
      await delay(600);
      return { data: { individual_event_participations: {} }, status: 200 };
    }
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
  async addGroupTeam(data: {
    group_event_id: number;
    participant_ids: number[];
  }): Promise<ApiResponse<any>> {
    const token = this.getToken();
    if (!token) throw new Error('Authentication required');
    const response = await httpPost('/kalamela/official/events/group/add', data, { token });
    return { data: response, message: `Added ${data.participant_ids.length} participants successfully`, status: 200 };
  }

  // GET /kalamela/official/participants/group - View all group participants
  async getOfficialGroupParticipants(): Promise<ApiResponse<any>> {
    const token = this.getToken();
    if (!token) throw new Error('Authentication required');
    try {
      const data = await httpGet<any>('/kalamela/official/participants/group', { token });
      return { data, status: 200 };
    } catch (err) {
      await delay(600);
      return { data: { group_event_participations: {} }, status: 200 };
    }
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
    try {
      const data = await httpGet<any>('/kalamela/official/preview', { token });
      return { data, status: 200 };
    } catch (err) {
      await delay(600);
      return {
        data: {
          individual_events_count: 0,
          group_events_count: 0,
          individual_event_amount: 0,
          group_event_amount: 0,
          total_amount_to_pay: 0,
          payment_status: null,
          individual_event_participations: {},
          group_event_participations: {},
        },
        status: 200,
      };
    }
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
    try {
      const data = await httpGet<any>('/kalamela/admin/home', { token });
      return { data, status: 200 };
    } catch (err) {
      await delay(600);
      return {
        data: {
          individual_events: this.generateMockIndividualEvents(),
          group_events: this.generateMockGroupEvents(),
        },
        status: 200,
      };
    }
  }

  // Kalamela Events Management
  async getIndividualEvents(): Promise<ApiResponse<IndividualEvent[]>> {
    const token = this.getToken();
    try {
      if (token) {
        const data = await httpGet<any>('/kalamela/admin/home', { token });
        return { data: data.individual_events || [], status: 200 };
      }
    } catch (err) {
      console.log('Backend unavailable, using mock data');
    }
    await delay(400);
    return { data: this.generateMockIndividualEvents(), status: 200 };
  }

  async getGroupEvents(): Promise<ApiResponse<GroupEvent[]>> {
    const token = this.getToken();
    try {
      if (token) {
        const data = await httpGet<any>('/kalamela/admin/home', { token });
        return { data: data.group_events || [], status: 200 };
      }
    } catch (err) {
      console.log('Backend unavailable, using mock data');
    }
    await delay(400);
    return { data: this.generateMockGroupEvents(), status: 200 };
  }

  // POST /kalamela/admin/events/individual - Create individual event
  async addIndividualEvent(data: { name: string; category?: string; description?: string }): Promise<ApiResponse<IndividualEvent>> {
    const token = this.getToken();
    if (!token) throw new Error('Authentication required');
    try {
      const response = await httpPost<any>('/kalamela/admin/events/individual', {
        name: data.name,
        category: data.category || null,
        description: data.description || null,
      }, { token });
      return { data: response, message: 'Event created successfully', status: 200 };
    } catch (err) {
      await delay(600);
      const newEvent: IndividualEvent = {
        id: Date.now(),
        name: data.name,
        description: data.description || '',
        category: data.category,
        registrationFee: 50,
        createdAt: new Date().toISOString(),
      };
      return { data: newEvent, message: 'Event created successfully (mock)', status: 200 };
    }
  }

  // POST /kalamela/admin/events/group - Create group event
  async addGroupEvent(data: {
    name: string;
    description?: string;
    max_allowed_limit: number;
    min_allowed_limit: number;
  }): Promise<ApiResponse<GroupEvent>> {
    const token = this.getToken();
    if (!token) throw new Error('Authentication required');
    try {
      const response = await httpPost<any>('/kalamela/admin/events/group', {
        name: data.name,
        description: data.description || null,
        max_allowed_limit: data.max_allowed_limit,
        min_allowed_limit: data.min_allowed_limit,
        per_unit_allowed_limit: data.max_allowed_limit, // Default same as max
      }, { token });
      return { data: response, message: 'Event created successfully', status: 200 };
    } catch (err) {
      await delay(600);
      const newEvent: GroupEvent = {
        id: Date.now(),
        name: data.name,
        description: data.description || '',
        minAllowedLimit: data.min_allowed_limit,
        maxAllowedLimit: data.max_allowed_limit,
        registrationFee: 100,
        createdAt: new Date().toISOString(),
      };
      return { data: newEvent, message: 'Event created successfully (mock)', status: 200 };
    }
  }

  // PUT /kalamela/admin/events/individual/{event_id} - Update individual event
  async updateIndividualEvent(id: number, data: Partial<{ name: string; category: string; description: string }>): Promise<ApiResponse<IndividualEvent>> {
    const token = this.getToken();
    if (!token) throw new Error('Authentication required');
    try {
      const response = await httpPut<any>(`/kalamela/admin/events/individual/${id}`, {
        name: data.name || null,
        category: data.category || null,
        description: data.description || null,
      }, { token });
      return { data: response, message: 'Event updated successfully', status: 200 };
    } catch (err) {
      await delay(600);
      const events = this.generateMockIndividualEvents();
      const event = events.find(e => e.id === id);
      if (!event) throw new Error('Event not found');
      const updated = { ...event, ...data };
      return { data: updated, message: 'Event updated successfully (mock)', status: 200 };
    }
  }

  // PUT /kalamela/admin/events/group/{event_id} - Update group event
  async updateGroupEvent(id: number, data: Partial<{
    name: string;
    description: string;
    max_allowed_limit: number;
    min_allowed_limit: number;
  }>): Promise<ApiResponse<GroupEvent>> {
    const token = this.getToken();
    if (!token) throw new Error('Authentication required');
    try {
      const response = await httpPut<any>(`/kalamela/admin/events/group/${id}`, {
        name: data.name || null,
        description: data.description || null,
        max_allowed_limit: data.max_allowed_limit,
        min_allowed_limit: data.min_allowed_limit,
      }, { token });
      return { data: response, message: 'Event updated successfully', status: 200 };
    } catch (err) {
      await delay(600);
      const events = this.generateMockGroupEvents();
      const event = events.find(e => e.id === id);
      if (!event) throw new Error('Event not found');
      const updated = { ...event, ...data };
      return { data: updated, message: 'Event updated successfully (mock)', status: 200 };
    }
  }

  async deleteEvent(id: number, type: 'INDIVIDUAL' | 'GROUP'): Promise<ApiResponse<boolean>> {
    const token = this.getToken();
    if (!token) throw new Error('Authentication required');
    try {
      const endpoint = type === 'INDIVIDUAL' 
        ? `/kalamela/admin/events/individual/${id}`
        : `/kalamela/admin/events/group/${id}`;
      await httpDelete<any>(endpoint, { token });
      return { data: true, message: 'Event deleted successfully', status: 200 };
    } catch (err) {
      await delay(500);
      return { data: true, message: 'Event deleted successfully (mock)', status: 200 };
    }
  }

  // GET /kalamela/admin/units - View all units with stats
  async getKalamelaAdminUnits(): Promise<ApiResponse<any[]>> {
    const token = this.getToken();
    if (!token) throw new Error('Authentication required');
    try {
      const data = await httpGet<any[]>('/kalamela/admin/units', { token });
      return { data, status: 200 };
    } catch (err) {
      await delay(600);
      return { data: [], status: 200 };
    }
  }

  // GET /kalamela/admin/unit/{unit_id}/members - View unit members with age
  async getKalamelaUnitMembers(unitId: number): Promise<ApiResponse<any[]>> {
    const token = this.getToken();
    if (!token) throw new Error('Authentication required');
    try {
      const data = await httpGet<any[]>(`/kalamela/admin/unit/${unitId}/members`, { token });
      return { data, status: 200 };
    } catch (err) {
      await delay(600);
      return { data: [], status: 200 };
    }
  }

  // PUT /kalamela/admin/unit/member/{member_id} - Edit member DOB
  async updateKalamelaUnitMemberDob(memberId: number, dob: string): Promise<ApiResponse<any>> {
    const token = this.getToken();
    if (!token) throw new Error('Authentication required');
    const data = await httpPut<any>(`/kalamela/admin/unit/member/${memberId}`, { dob }, { token });
    return { data, message: 'Member DOB updated successfully', status: 200 };
  }

  // POST /kalamela/admin/exclude-member - Exclude member from Kalamela
  async excludeMemberFromKalamela(data: { unit_member_id: number; reason: string }): Promise<ApiResponse<any>> {
    const token = this.getToken();
    if (!token) throw new Error('Authentication required');
    const response = await httpPost<any>('/kalamela/admin/exclude-member', data, { token });
    return { data: response, message: 'Member excluded from Kalamela successfully', status: 200 };
  }

  // GET /kalamela/admin/excluded-members - View all excluded members
  async getKalamelaExcludedMembers(): Promise<ApiResponse<any[]>> {
    const token = this.getToken();
    if (!token) throw new Error('Authentication required');
    try {
      const data = await httpGet<any[]>('/kalamela/admin/excluded-members', { token });
      return { data, status: 200 };
    } catch (err) {
      await delay(600);
      return { data: [], status: 200 };
    }
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
    try {
      const data = await httpGet<any>('/kalamela/admin/participants/individual', { token });
      return { data, status: 200 };
    } catch (err) {
      await delay(600);
      return { data: { individual_event_participations: {} }, status: 200 };
    }
  }

  // GET /kalamela/admin/participants/group - All group participants
  async getAdminGroupParticipants(): Promise<ApiResponse<any>> {
    const token = this.getToken();
    if (!token) throw new Error('Authentication required');
    try {
      const data = await httpGet<any>('/kalamela/admin/participants/group', { token });
      return { data, status: 200 };
    } catch (err) {
      await delay(600);
      return { data: { group_event_participations: {} }, status: 200 };
    }
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
    try {
      const data = await httpGet<any>('/kalamela/admin/events-preview', { token });
      return { data, status: 200 };
    } catch (err) {
      await delay(600);
      return {
        data: {
          individual_events: [],
          group_events: [],
        },
        status: 200,
      };
    }
  }

  // GET /kalamela/admin/payments - All unit payments
  async getKalamelaAdminPayments(): Promise<ApiResponse<any[]>> {
    const token = this.getToken();
    if (!token) throw new Error('Authentication required');
    try {
      const data = await httpGet<any[]>('/kalamela/admin/payments', { token });
      return { data, status: 200 };
    } catch (err) {
      await delay(600);
      return { data: [], status: 200 };
    }
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
    try {
      const data = await httpGet<any>(`/kalamela/admin/scores/individual/event/${eventId}/candidates`, { token });
      return { data, status: 200 };
    } catch (err) {
      await delay(600);
      return { data: { event_id: eventId, event_name: 'Event', participants: [] }, status: 200 };
    }
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
    try {
      const data = await httpGet<any>(`/kalamela/admin/scores/group/event/${eventId}/candidates`, { token });
      return { data, status: 200 };
    } catch (err) {
      await delay(600);
      return { data: { event_id: eventId, event_name: 'Event', teams: [] }, status: 200 };
    }
  }

  // GET /kalamela/admin/scores/individual - View all individual scores
  async getAdminIndividualScores(): Promise<ApiResponse<any>> {
    const token = this.getToken();
    if (!token) throw new Error('Authentication required');
    try {
      const data = await httpGet<any>('/kalamela/admin/scores/individual', { token });
      return { data, status: 200 };
    } catch (err) {
      await delay(600);
      return { data: { individual_event_scores: {} }, status: 200 };
    }
  }

  // GET /kalamela/admin/scores/group - View all group scores
  async getAdminGroupScores(): Promise<ApiResponse<any>> {
    const token = this.getToken();
    if (!token) throw new Error('Authentication required');
    try {
      const data = await httpGet<any>('/kalamela/admin/scores/group', { token });
      return { data, status: 200 };
    } catch (err) {
      await delay(600);
      return { data: { group_event_scores: {} }, status: 200 };
    }
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
    try {
      const data = await httpGet<any>(`/kalamela/admin/scores/individual/event/${eventId}/edit`, { token });
      return { data, status: 200 };
    } catch (err) {
      await delay(600);
      return { data: { event_id: eventId, event_name: 'Event', scores: [] }, status: 200 };
    }
  }

  // GET /kalamela/admin/scores/group/event/{event_id}/edit - Get scores for editing
  async getGroupEventScoresForEdit(eventId: number): Promise<ApiResponse<any>> {
    const token = this.getToken();
    if (!token) throw new Error('Authentication required');
    try {
      const data = await httpGet<any>(`/kalamela/admin/scores/group/event/${eventId}/edit`, { token });
      return { data, status: 200 };
    } catch (err) {
      await delay(600);
      return { data: { event_id: eventId, event_name: 'Event', scores: [] }, status: 200 };
    }
  }

  // GET /kalamela/admin/appeals - View all appeals
  async getKalamelaAdminAppeals(): Promise<ApiResponse<any[]>> {
    const token = this.getToken();
    if (!token) throw new Error('Authentication required');
    try {
      const data = await httpGet<any[]>('/kalamela/admin/appeals', { token });
      return { data, status: 200 };
    } catch (err) {
      await delay(600);
      return { data: [], status: 200 };
    }
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
    try {
      const data = await httpGet<any>('/kalamela/admin/results/unit-wise', { token });
      return { data, status: 200 };
    } catch (err) {
      await delay(600);
      return { data: { units: [] }, status: 200 };
    }
  }

  // GET /kalamela/admin/results/district-wise - District-wise results
  async getKalamelaDistrictWiseResults(): Promise<ApiResponse<any>> {
    const token = this.getToken();
    if (!token) throw new Error('Authentication required');
    try {
      const data = await httpGet<any>('/kalamela/admin/results/district-wise', { token });
      return { data, status: 200 };
    } catch (err) {
      await delay(600);
      return { data: { districts: [] }, status: 200 };
    }
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
  async registerIndividualParticipant(data: { eventId: number; memberId: number }): Promise<ApiResponse<EventParticipant>> {
    await delay(700);
    const members = this.generateMockMembers();
    const member = members.find(m => m.id === data.memberId);
    const events = this.generateMockIndividualEvents();
    const event = events.find(e => e.id === data.eventId);
    
    if (!member || !event) throw new Error('Member or Event not found');
    
    const participant: EventParticipant = {
      id: Date.now(),
      eventId: event.id,
      eventName: event.name,
      eventType: 'INDIVIDUAL',
      memberId: member.id,
      memberName: member.name,
      unitId: member.unitId,
      unitName: member.unitName,
      districtId: 1,
      districtName: 'Kottayam',
      memberPhone: member.number,
      chestNumber: `KTM-IE${event.id}-${String(Math.floor(Math.random() * 999) + 1).padStart(3, '0')}`,
      registeredAt: new Date().toISOString(),
    };
    
    return { data: participant, message: 'Participant registered successfully', status: 200 };
  }

  async registerGroupTeam(data: { eventId: number; memberIds: number[] }): Promise<ApiResponse<GroupEventTeam>> {
    await delay(800);
    const members = this.generateMockMembers();
    const events = this.generateMockGroupEvents();
    const event = events.find(e => e.id === data.eventId);
    
    if (!event) throw new Error('Event not found');
    
    const teamMembers: EventParticipant[] = data.memberIds.map((memberId, index) => {
      const member = members.find(m => m.id === memberId);
      if (!member) throw new Error('Member not found');
      
      return {
        id: Date.now() + index,
        eventId: event.id,
        eventName: event.name,
        eventType: 'GROUP',
        memberId: member.id,
        memberName: member.name,
        unitId: member.unitId,
        unitName: member.unitName,
        districtId: 1,
        districtName: 'Kottayam',
        memberPhone: member.number,
        chestNumber: `KTM-GE${event.id}-T${Math.floor(Math.random() * 99) + 1}`,
        registeredAt: new Date().toISOString(),
      };
    });
    
    const team: GroupEventTeam = {
      id: Date.now(),
      eventId: event.id,
      eventName: event.name,
      chestNumber: teamMembers[0].chestNumber,
      teamMembers,
      unitId: teamMembers[0].unitId,
      unitName: teamMembers[0].unitName,
      districtId: 1,
      districtName: 'Kottayam',
      registeredAt: new Date().toISOString(),
    };
    
    return { data: team, message: 'Team registered successfully', status: 200 };
  }

  async getEventParticipants(eventId: number, type: 'INDIVIDUAL' | 'GROUP'): Promise<ApiResponse<EventParticipant[]>> {
    await delay(600);
    if (type === 'INDIVIDUAL') {
      const participants = this.generateMockEventParticipants().filter(p => p.eventId === eventId);
      return { data: participants, status: 200 };
    } else {
      const teams = this.generateMockGroupTeams().filter(t => t.eventId === eventId);
      const participants = teams.flatMap(t => t.teamMembers);
      return { data: participants, status: 200 };
    }
  }

  async getAllIndividualParticipants(): Promise<ApiResponse<EventParticipant[]>> {
    await delay(600);
    return { data: this.generateMockEventParticipants(), status: 200 };
  }

  async getAllGroupTeams(): Promise<ApiResponse<GroupEventTeam[]>> {
    await delay(600);
    return { data: this.generateMockGroupTeams(), status: 200 };
  }

  async removeParticipant(participantId: number): Promise<ApiResponse<boolean>> {
    await delay(500);
    return { data: true, message: 'Participant removed successfully', status: 200 };
  }

  async updateChestNumber(participantId: number, newChestNumber: string): Promise<ApiResponse<boolean>> {
    await delay(500);
    return { data: true, message: 'Chest number updated successfully', status: 200 };
  }

  // Kalamela Score Entry
  async submitEventScores(eventId: number, eventType: 'INDIVIDUAL' | 'GROUP', scores: ScoreSubmission[]): Promise<ApiResponse<EventScore[]>> {
    await delay(900);
    
    // Sort by marks descending to assign positions
    const sortedScores = [...scores].sort((a, b) => b.awardedMarks - a.awardedMarks);
    
    const eventScores: EventScore[] = sortedScores.map((score, index) => {
      const position = index + 1;
      const isGroup = eventType === 'GROUP';
      const { grade, positionPoints, gradePoints, totalPoints } = this.calculatePoints(score.awardedMarks, position, isGroup);
      
      return {
        id: Date.now() + index,
        eventParticipationId: score.eventParticipationId,
        eventId,
        eventName: 'Event Name',
        eventType,
        chestNumber: score.chestNumber,
        participantName: score.participantName,
        awardedMarks: score.awardedMarks,
        grade,
        positionPoints,
        gradePoints,
        totalPoints,
        position,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    });
    
    return { data: eventScores, message: 'Scores submitted successfully', status: 200 };
  }

  async getEventScores(eventId: number): Promise<ApiResponse<EventScore[]>> {
    await delay(600);
    // Mock scores for demonstration
    const mockScores: EventScore[] = [];
    for (let i = 0; i < 10; i++) {
      const marks = 95 - (i * 5);
      const position = i + 1;
      const { grade, positionPoints, gradePoints, totalPoints } = this.calculatePoints(marks, position, false);
      
      mockScores.push({
        id: i + 1,
        eventParticipationId: i + 1,
        eventId,
        eventName: 'Classical Singing',
        eventType: 'INDIVIDUAL',
        chestNumber: `KTM-IE1-${String(i + 1).padStart(3, '0')}`,
        participantName: `Participant ${i + 1}`,
        awardedMarks: marks,
        grade,
        positionPoints,
        gradePoints,
        totalPoints,
        position,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }
    return { data: mockScores, status: 200 };
  }

  async updateEventScore(scoreId: number, marks: number): Promise<ApiResponse<EventScore>> {
    await delay(600);
    const { grade, positionPoints, gradePoints, totalPoints } = this.calculatePoints(marks, 1, false);
    
    const updated: EventScore = {
      id: scoreId,
      eventParticipationId: 1,
      eventId: 1,
      eventName: 'Classical Singing',
      eventType: 'INDIVIDUAL',
      chestNumber: 'KTM-IE1-001',
      participantName: 'John Doe',
      awardedMarks: marks,
      grade,
      positionPoints,
      gradePoints,
      totalPoints,
      position: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    return { data: updated, message: 'Score updated successfully', status: 200 };
  }

  // Kalamela Results
  async getAllResults(): Promise<ApiResponse<EventResults[]>> {
    await delay(700);
    const individualEvents = this.generateMockIndividualEvents();
    const groupEvents = this.generateMockGroupEvents();
    
    const results: EventResults[] = [
      ...individualEvents.slice(0, 3).map(event => ({
        eventId: event.id,
        eventName: event.name,
        eventType: 'INDIVIDUAL' as const,
        results: Array.from({ length: 5 }, (_, i) => {
          const marks = 95 - (i * 5);
          const { grade, totalPoints } = this.calculatePoints(marks, i + 1, false);
          return {
            position: i + 1,
            chestNumber: `KTM-IE${event.id}-${String(i + 1).padStart(3, '0')}`,
            participantName: `Participant ${i + 1}`,
            unitName: 'St. Thomas Church',
            districtName: 'Kottayam',
            awardedMarks: marks,
            grade,
            totalPoints,
          };
        }),
      })),
      ...groupEvents.slice(0, 2).map(event => ({
        eventId: event.id,
        eventName: event.name,
        eventType: 'GROUP' as const,
        results: Array.from({ length: 3 }, (_, i) => {
          const marks = 90 - (i * 8);
          const { grade, totalPoints } = this.calculatePoints(marks, i + 1, true);
          return {
            position: i + 1,
            chestNumber: `KTM-GE${event.id}-T${i + 1}`,
            unitName: 'St. Thomas Church',
            districtName: 'Kottayam',
            awardedMarks: marks,
            grade,
            totalPoints,
          };
        }),
      })),
    ];
    
    return { data: results, status: 200 };
  }

  async getDistrictResults(districtId?: number): Promise<ApiResponse<DistrictPerformance[]>> {
    await delay(700);
    const districts = ['Kottayam', 'Changanassery', 'Thiruvalla', 'Mallappally'];
    
    const results: DistrictPerformance[] = districts.map((name, i) => ({
      districtId: i + 1,
      districtName: name,
      totalParticipants: 45 - (i * 5),
      totalPoints: 450 - (i * 50),
      goldMedals: 12 - i,
      silverMedals: 8 - i,
      bronzeMedals: 5,
      topPerformers: Array.from({ length: 3 }, (_, j) => ({
        position: j + 1,
        chestNumber: `${name.substring(0, 3).toUpperCase()}-IE1-00${j + 1}`,
        participantName: `Top Performer ${j + 1}`,
        unitName: 'Church Name',
        districtName: name,
        awardedMarks: 95 - (j * 3),
        grade: 'A' as EventGrade,
        totalPoints: 10 - j,
      })),
    }));
    
    return { data: districtId ? results.filter(r => r.districtId === districtId) : results, status: 200 };
  }

  async getUnitResults(unitId?: number): Promise<ApiResponse<UnitPerformance[]>> {
    await delay(700);
    const units = this.generateMockUnits();
    
    const results: UnitPerformance[] = units.slice(0, 5).map(unit => ({
      unitId: unit.id,
      unitName: unit.name,
      districtName: unit.clergyDistrict,
      totalParticipants: 15 + Math.floor(Math.random() * 20),
      totalPoints: 150 + Math.floor(Math.random() * 100),
      topPerformers: Array.from({ length: 3 }, (_, j) => ({
        position: j + 1,
        chestNumber: `KTM-IE1-00${j + 1}`,
        participantName: `Performer ${j + 1}`,
        unitName: unit.name,
        districtName: unit.clergyDistrict,
        awardedMarks: 95 - (j * 3),
        grade: 'A' as EventGrade,
        totalPoints: 10 - j,
      })),
    }));
    
    return { data: unitId ? results.filter(r => r.unitId === unitId) : results, status: 200 };
  }

  async getTopPerformers(limit: number = 10): Promise<ApiResponse<TopPerformer[]>> {
    await delay(600);
    const topPerformers: TopPerformer[] = Array.from({ length: limit }, (_, i) => ({
      memberId: i + 1,
      memberName: `Top Performer ${i + 1}`,
      unitName: 'St. Thomas Church',
      districtName: 'Kottayam',
      totalPoints: 50 - (i * 3),
      eventsParticipated: 5 - Math.floor(i / 3),
      grades: {
        A: 4 - Math.floor(i / 3),
        B: Math.floor(i / 4),
        C: Math.floor(i / 5),
      },
    }));
    
    return { data: topPerformers, status: 200 };
  }

  // Kalamela Payments
  async getKalamelaPayments(): Promise<ApiResponse<KalamelaPayment[]>> {
    await delay(600);
    const districts = ['Kottayam', 'Changanassery', 'Thiruvalla', 'Mallappally'];
    
    const payments: KalamelaPayment[] = districts.map((name, i) => ({
      id: i + 1,
      districtId: i + 1,
      districtName: name,
      individualEventsCount: 25 + (i * 5),
      groupEventsCount: 5 + i,
      totalAmountToPay: (25 + (i * 5)) * 50 + (5 + i) * 100,
      paymentProof: i % 2 === 0 ? 'payment_proof.jpg' : undefined,
      paymentStatus: (i === 0 ? 'Paid' : i === 1 ? 'Pending' : 'Invalid') as PaymentStatus,
      paidBy: `${name} District Secretary`,
      createdAt: new Date(Date.now() - (i * 24 * 60 * 60 * 1000)).toISOString(),
      approvedAt: i === 0 ? new Date().toISOString() : undefined,
      approvedBy: i === 0 ? 'Admin User' : undefined,
    }));
    
    return { data: payments, status: 200 };
  }

  async approvePayment(paymentId: number): Promise<ApiResponse<boolean>> {
    await delay(600);
    return { data: true, message: 'Payment approved successfully', status: 200 };
  }

  async rejectPayment(paymentId: number, reason?: string): Promise<ApiResponse<boolean>> {
    await delay(600);
    return { data: true, message: 'Payment marked as invalid', status: 200 };
  }

  // Kalamela Appeals
  async getAppeals(): Promise<ApiResponse<ScoreAppeal[]>> {
    await delay(600);
    const appeals: ScoreAppeal[] = [
      {
        id: 1,
        eventParticipationId: 1,
        chestNumber: 'KTM-IE1-001',
        participantName: 'John Doe',
        eventName: 'Classical Singing',
        statement: 'I believe my performance deserved a higher score. The judges might have missed some aspects.',
        reply: undefined,
        status: 'PENDING',
        addedBy: 'Unit Secretary',
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: 2,
        eventParticipationId: 2,
        chestNumber: 'KTM-IE2-005',
        participantName: 'Jane Smith',
        eventName: 'Light Music',
        statement: 'There was a technical issue during my performance that affected my score.',
        reply: 'Your appeal has been reviewed. The scores will be updated accordingly.',
        status: 'RESOLVED',
        addedBy: 'Unit Secretary',
        createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        resolvedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        resolvedBy: 'Admin User',
      },
    ];
    
    return { data: appeals, status: 200 };
  }

  async respondToAppeal(appealId: number, reply: string): Promise<ApiResponse<boolean>> {
    await delay(600);
    return { data: true, message: 'Appeal response submitted successfully', status: 200 };
  }

  // Kalamela Exclusions
  async getExcludedMembers(): Promise<ApiResponse<ExcludedMember[]>> {
    await delay(600);
    const members = this.generateMockMembers().slice(0, 5);
    
    const excluded: ExcludedMember[] = members.map((member, i) => ({
      id: i + 1,
      memberId: member.id,
      memberName: member.name,
      unitId: member.unitId,
      unitName: member.unitName,
      districtId: 1,
      districtName: 'Kottayam',
      reason: ['Age limit exceeded', 'Transferred to other diocese', 'Personal request', 'Inactive', 'Disciplinary'][i],
      excludedBy: 'Admin User',
      excludedAt: new Date(Date.now() - (i + 1) * 10 * 24 * 60 * 60 * 1000).toISOString(),
    }));
    
    return { data: excluded, status: 200 };
  }

  async restoreExcludedMember(memberId: number): Promise<ApiResponse<boolean>> {
    await delay(600);
    return { data: true, message: 'Member restored to Kalamela', status: 200 };
  }

  // Kalamela Dashboard
  async getKalamelaDashboardStats(): Promise<ApiResponse<KalamelaDashboardStats>> {
    await delay(600);
    const stats: KalamelaDashboardStats = {
      totalIndividualEvents: 10,
      totalGroupEvents: 5,
      totalParticipants: 150,
      totalIndividualParticipants: 100,
      totalGroupParticipants: 50,
      totalScoresEntered: 120,
      pendingScores: 30,
      totalPayments: 4,
      pendingPayments: 2,
      totalAppeals: 5,
      pendingAppeals: 2,
      topDistricts: await this.getDistrictResults().then(res => res.data.slice(0, 3)),
      recentRegistrations: this.generateMockEventParticipants().slice(0, 5),
    };
    
    return { data: stats, status: 200 };
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
