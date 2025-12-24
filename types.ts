
import React from 'react';

export enum UserRole {
  ADMIN = 'ADMIN',
  OFFICIAL = 'OFFICIAL',
  PUBLIC = 'PUBLIC'
}

export interface Metric {
  label: string;
  value: string | number;
  change?: string;
  trend?: 'up' | 'down' | 'neutral';
}

export interface Participant {
  id: string;
  chestNumber: string;
  name: string;
  unit: string;
  district: string;
  category: string;
  points: number;
}

export interface EventItem {
  id: string;
  name: string;
  type: 'Individual' | 'Group';
  status: 'Scheduled' | 'Ongoing' | 'Completed';
  registeredCount: number;
  totalSlots: number;
}

export interface ScoreEntry {
  chestNumber: string;
  name: string;
  judge1: number;
  judge2: number;
  judge3: number;
  total: number;
  grade: string;
}

export interface NavItem {
  label: string;
  path: string;
  icon: React.ReactNode;
}

// Service Layer Types
export interface ApiResponse<T> {
  data: T;
  message?: string;
  status: number;
}

export type AsyncStatus = 'idle' | 'pending' | 'success' | 'error';

// --- API types for new backend endpoints ---
export interface AuthUser {
  id: number;
  email: string;
  username: string;
  first_name?: string;
  last_name?: string;
  phone_number?: string;
  user_type: string; // role id as string
  unit_name_id?: number;
  clergy_district_id?: number;
  is_active: boolean;
}

export interface UnitName {
  id: number;
  clergy_district_id: number;
  name: string;
}

export interface AuthTokens {
  access_token: string;
  refresh_token?: string;
  token_type: string;
  expires_in?: number;
  user_type?: string;
  redirect_url?: string;
}

export interface DashboardCounts {
  users: number;
  units: number;
  members: number;
  individual_participations: number;
  group_participations: number;
  payments: number;
}

export interface ConferenceItem {
  id: number;
  title: string;
  details?: string;
  status: string;
  created_on: string;
}

// Extended Conference Types
export interface Conference {
  id: number;
  title: string;
  description?: string;
  venue?: string;
  start_date: string;
  end_date: string;
  registration_start_date?: string;
  registration_end_date?: string;
  registration_fee: number;
  early_bird_fee?: number;
  early_bird_deadline?: string;
  max_delegates?: number;
  status: 'upcoming' | 'ongoing' | 'completed' | 'cancelled';
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ConferenceCreate {
  title: string;
  description?: string;
  venue?: string;
  start_date: string;
  end_date: string;
  registration_start_date?: string;
  registration_end_date?: string;
  registration_fee: number;
  early_bird_fee?: number;
  early_bird_deadline?: string;
  max_delegates?: number;
}

export interface ConferenceUpdate extends Partial<ConferenceCreate> {
  status?: 'upcoming' | 'ongoing' | 'completed' | 'cancelled';
  is_active?: boolean;
}

export interface ConferenceDelegate {
  id: number;
  conference_id: number;
  unit_id: number;
  unit_name?: string;
  member_id: number;
  member_name: string;
  member_phone?: string;
  member_gender?: string;
  food_preference?: 'veg' | 'non-veg';
  accommodation_required: boolean;
  registration_date: string;
  status: 'registered' | 'confirmed' | 'cancelled';
}

export interface ConferenceDelegateCreate {
  member_id: number;
  food_preference?: 'veg' | 'non-veg';
  accommodation_required?: boolean;
}

export interface ConferencePayment {
  id: number;
  conference_id: number;
  unit_id: number;
  unit_name?: string;
  amount: number;
  payment_reference?: string;
  payment_proof_url?: string;
  status: 'pending' | 'submitted' | 'verified' | 'rejected';
  submitted_at?: string;
  verified_at?: string;
  verified_by?: string;
  remarks?: string;
  created_at: string;
}

export interface ConferencePaymentSubmit {
  amount: number;
  payment_reference?: string;
}

export interface ConferenceFoodPreference {
  member_id: number;
  preference: 'veg' | 'non-veg';
}

export interface ConferenceInfo {
  conference: Conference;
  total_delegates: number;
  total_units: number;
  total_amount_collected: number;
  delegates_by_district: Array<{
    district_id: number;
    district_name: string;
    delegate_count: number;
  }>;
}

export interface ConferencePaymentInfo {
  conference_id: number;
  total_units: number;
  total_amount: number;
  paid_amount: number;
  pending_amount: number;
  payments: ConferencePayment[];
}

export interface DistrictOfficial {
  id: number;
  district_id: number;
  district_name?: string;
  user_id: number;
  name: string;
  designation: string;
  phone?: string;
  email?: string;
  is_active: boolean;
  created_at: string;
}

export interface DistrictOfficialCreate {
  district_id: number;
  user_id: number;
  name: string;
  designation: string;
  phone?: string;
  email?: string;
}

export interface DistrictOfficialUpdate extends Partial<DistrictOfficialCreate> {
  is_active?: boolean;
}

// ==================== CONFERENCE MODULE TYPES ====================

// Unit Member (used in conference APIs)
export interface ConferenceUnitMember {
  id: number;
  name: string;
  number: string;
  gender: 'M' | 'F';
  dob?: string;
}

// Delegate Official
export interface ConferenceDelegateOfficial {
  id: number;
  name: string;
  phone: string;
}

// Food Preference
export interface ConferenceFoodPref {
  veg_count: number;
  non_veg_count: number;
}

// Payment Record (from API)
export interface ConferencePaymentRecord {
  amount_to_pay: number;
  uploaded_by: string;
  date: string;
  status: 'PENDING' | 'PROOF_UPLOADED' | 'PAID' | 'DECLINED';
  proof_path: string | null;
  payment_reference: string | null;
}

// API response structure for /conference/official/view
export interface ConferenceOfficialViewApi {
  conference: {
    id: number;
    title: string;
    details?: string;
    status: string;
  };
  rem_count: number;      // Remaining slots
  max_count: number;      // Maximum allowed delegates
  allowed_count: number;  // Allowed count for this district
  member_count: number;   // Currently registered delegates
  district: string;       // District name
  unit_members: ConferenceUnitMember[];  // Available members to add as delegates
}

// API response structure for /conference/official/delegates
export interface ConferenceDelegatesResponse {
  delegate_members: ConferenceUnitMember[];
  delegate_officials: ConferenceDelegateOfficial[];
  delegates_count: number;
  max_count: number;
  payment_status: string | null;
  amount_to_pay: number;
  food_preference: ConferenceFoodPref | null;
}

// Transformed structure for frontend use (ConferenceOfficialView)
export interface ConferenceOfficialView {
  conference: {
    id: number;
    title: string;
    details?: string;
    status: string;
    description?: string;
    venue?: string;
    start_date?: string;
    end_date?: string;
    registration_fee?: number;
  };
  unit_delegates: ConferenceDelegate[];
  unit_payment?: ConferencePayment;
  registration_open: boolean;
  available_members: Array<{
    id: number;
    name: string;
    gender: string;
    phone?: string;
  }>;
  // Additional fields from actual API
  rem_count: number;
  max_count: number;
  allowed_count: number;
  member_count: number;
  district: string;
}

// District Info for Admin Conference Info
export interface ConferenceDistrictInfo {
  officials: Array<{ id: number; name: string; phone: string; gender?: string }>;
  members: Array<{ id: number; name: string; phone: string; gender: string }>;
  payments: ConferencePaymentRecord[];
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
}

// Admin Conference Info Response
export interface ConferenceAdminInfoResponse {
  conference_id: number;
  district_info: Record<string, ConferenceDistrictInfo>;
}

// Admin Conference Payment Info Response
export interface ConferenceAdminPaymentInfoResponse {
  conference_id: number;
  district_info: Record<string, {
    officials: Array<{ id: number; name: string; phone: string }>;
    members: Array<{ id: number; name: string; phone: string }>;
    payments: ConferencePaymentRecord[];
    count_of_officials: number;
    count_of_members: number;
  }>;
}

// Admin District Official (from /api/admin/conference/officials)
export interface ConferenceAdminDistrictOfficial {
  id: number;
  name: string;
  phone: string;
  district: string | null;
  conference_id: number | null;
  conference_official_count: number;
  conference_member_count: number;
}

// Public Conference (from /api/conference/public/list)
export interface ConferencePublic {
  id: number;
  title: string;
  details: string;
  added_on: string;
  status: 'Active' | 'Inactive' | 'Completed';
}

// Food Preference Submit Request
export interface ConferenceFoodPreferenceSubmit {
  conference_id: number;
  veg_count: number;
  non_veg_count: number;
}

// Food Preference Response
export interface ConferenceFoodPreferenceResponse {
  id: number;
  conference_id: number;
  veg_count: number;
  non_veg_count: number;
  uploaded_by_id: number;
  created_at: string;
  updated_at: string;
}

// Export Data Response
export interface ConferenceExportDataResponse {
  message: string;
  district: string;
  data: {
    officials: Array<{ id: number; name: string; phone: string; gender?: string }>;
    members: Array<{ id: number; name: string; phone: string; gender: string }>;
    payments: ConferencePaymentRecord[];
    count_of_officials: number;
    count_of_members: number;
    count_of_male_members: number;
    count_of_female_members: number;
    veg_count: number;
    non_veg_count: number;
  };
}

export type PaymentStatus = 'Pending' | 'Proof Uploaded' | 'Paid' | 'Declined';

export interface PaymentRecord {
  id: number;
  conference_id: number;
  amount_to_pay: number;
  status: PaymentStatus | string;
  proof_path?: string;
  date: string;
}

// --- Unit Admin Types ---

export interface ClergyDistrict {
  id: number;
  name: string;
}

export interface District {
  id: number;
  name: string;
  clergyDistrict: string;
}

export interface Unit {
  id: number;
  unitNumber: string;
  name: string;
  clergyDistrict: string;
  registrationYear: number;
  status: 'Completed' | 'Pending' | 'Not Registered';
  membersCount: number;
  officialsCount: number;
  councilorsCount: number;
}

export interface UnitMember {
  id: number;
  name: string;
  gender: 'M' | 'F' | 'Male' | 'Female';
  number: string;
  dob: string;
  age: number;
  qualification?: string;
  bloodGroup?: string;
  unitId: number;
  unitName: string;
  isArchived: boolean;
}

export interface UnitOfficial {
  id: number;
  unitId: number;
  unitName: string;
  presidentDesignation?: string;
  presidentName: string;
  presidentPhone: string;
  vicePresidentName: string;
  vicePresidentPhone: string;
  secretaryName: string;
  secretaryPhone: string;
  jointSecretaryName: string;
  jointSecretaryPhone: string;
  treasurerName: string;
  treasurerPhone: string;
}

export interface UnitCouncilor {
  id: number;
  unitId: number;
  unitName: string;
  memberId: number;
  memberName: string;
  memberPhone: string;
  memberGender: string;
  memberDob: string;
  memberQualification?: string;
}

export type RequestStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface TransferRequest {
  id: number;
  createdAt: string;
  memberId: number;
  memberName: string;
  currentUnitId: number;
  currentUnitName: string;
  destinationUnitId: number;
  destinationUnitName: string;
  reason: string;
  status: RequestStatus;
  proof?: string;
}

export interface MemberInfoChangeRequest {
  id: number;
  createdAt: string;
  memberId: number;
  memberName: string;
  unitName: string;
  changes: {
    name?: string;
    gender?: string;
    dob?: string;
    bloodGroup?: string;
    qualification?: string;
  };
  reason: string;
  status: RequestStatus;
  proof?: string;
}

export interface OfficialsChangeRequest {
  id: number;
  createdAt: string;
  unitId: number;
  unitName: string;
  originalOfficials: {
    presidentDesignation?: string;
    presidentName: string;
    presidentPhone: string;
    vicePresidentName: string;
    vicePresidentPhone: string;
    secretaryName: string;
    secretaryPhone: string;
    jointSecretaryName: string;
    jointSecretaryPhone: string;
    treasurerName: string;
    treasurerPhone: string;
  };
  requestedChanges: {
    presidentDesignation?: string;
    presidentName?: string;
    presidentPhone?: string;
    vicePresidentName?: string;
    vicePresidentPhone?: string;
    secretaryName?: string;
    secretaryPhone?: string;
    jointSecretaryName?: string;
    jointSecretaryPhone?: string;
    treasurerName?: string;
    treasurerPhone?: string;
  };
  reason: string;
  status: RequestStatus;
  proof?: string;
}

export interface CouncilorChangeRequest {
  id: number;
  createdAt: string;
  unitId: number;
  unitName: string;
  councilorId: number;
  originalMemberId: number;
  originalMemberName: string;
  newMemberId?: number;
  newMemberName?: string;
  reason: string;
  status: RequestStatus;
  proof?: string;
}

export interface MemberAddRequest {
  id: number;
  createdAt: string;
  unitId: number;
  unitName: string;
  name: string;
  gender: 'M' | 'F';
  number: string;
  dob: string;
  qualification?: string;
  bloodGroup?: string;
  reason: string;
  status: RequestStatus;
  proof?: string;
}

export interface UnitStats {
  totalDistricts: number;
  completedDistricts: number;
  totalUnits: number;
  completedUnits: number;
  totalMembers: number;
  maleMembers: number;
  femaleMembers: number;
  pendingRequests: number;
  maxMemberUnit: string;
  maxMemberCount: number;
}

export interface DistrictWiseData {
  name: string;
  participants: number;
}

export interface ChartData {
  name: string;
  participants: number;
}

// Archived Members
export interface ArchivedMember extends UnitMember {
  archivedAt: string;
  archivedBy: string;
  archiveReason?: string;
}

// Request Actions & History
export interface RequestAction {
  id: number;
  requestId: number;
  requestType: string;
  action: 'APPROVED' | 'REJECTED' | 'REVERTED';
  performedBy: string;
  performedAt: string;
  remarks?: string;
}

export interface RequestRemark {
  id: number;
  requestId: number;
  requestType: string;
  author: string;
  message: string;
  createdAt: string;
}

// User Request Submissions (Form Data)
export interface TransferRequestSubmission {
  memberId: number;
  destinationUnitId: number;
  reason: string;
  proof?: File;
}

export interface MemberInfoChangeSubmission {
  memberId: number;
  changes: {
    name?: string;
    gender?: string;
    dob?: string;
    bloodGroup?: string;
    qualification?: string;
  };
  reason: string;
  proof?: File;
}

export interface OfficialsChangeSubmission {
  unitId: number;
  changes: {
    presidentDesignation?: string;
    presidentName?: string;
    presidentPhone?: string;
    vicePresidentName?: string;
    vicePresidentPhone?: string;
    secretaryName?: string;
    secretaryPhone?: string;
    jointSecretaryName?: string;
    jointSecretaryPhone?: string;
    treasurerName?: string;
    treasurerPhone?: string;
  };
  reason: string;
  proof?: File;
}

export interface CouncilorChangeSubmission {
  councilorId: number;
  newMemberId: number;
  reason: string;
  proof?: File;
}

export interface MemberAddSubmission {
  unitId: number;
  name: string;
  gender: 'M' | 'F';
  number: string;
  dob: string;
  qualification?: string;
  bloodGroup?: string;
  reason: string;
  proof?: File;
}

// ==================== KALAMELA TYPES ====================

// Kalamela Category Master
export interface KalamelaCategory {
  id: number;
  name: string;
  description: string | null;
  created_on: string;
  updated_on: string;
}

export interface KalamelaCategoryCreate {
  name: string;
  description?: string;
}

export interface KalamelaCategoryUpdate {
  name?: string;
  description?: string;
}

// Kalamela Registration Fees
export type EventType = 'individual' | 'group';

export interface RegistrationFee {
  id: number;
  name: string;
  event_type: EventType;
  amount: number;
  created_by_id: number | null;
  updated_by_id: number | null;
  created_on: string;
  updated_on: string;
}

export interface RegistrationFeeCreate {
  name: string;
  event_type: EventType;
  amount: number;
}

export interface RegistrationFeeUpdate {
  name?: string;
  event_type?: EventType;
  amount?: number;
}

// Kalamela Events
export type GenderRestriction = 'Male' | 'Female' | null;
export type SeniorityRestriction = 'Junior' | 'Senior' | null;

export interface IndividualEvent {
  id: number;
  name: string;
  description: string | null;
  category_id?: number | null;
  category_name?: string | null;
  is_active: boolean;
  is_mandatory: boolean;
  gender_restriction: GenderRestriction;
  seniority_restriction: SeniorityRestriction;
  registration_fee_id?: number | null;
  registration_fee_amount?: number | null;
  created_on: string;
}

export interface IndividualEventCreate {
  name: string;
  category_id?: number;
  description?: string;
  is_active?: boolean;
  is_mandatory?: boolean;
  gender_restriction?: GenderRestriction;
  seniority_restriction?: SeniorityRestriction;
}

export interface IndividualEventUpdate {
  name?: string;
  category_id?: number;
  description?: string;
  is_active?: boolean;
  is_mandatory?: boolean;
  gender_restriction?: GenderRestriction;
  seniority_restriction?: SeniorityRestriction;
}

export interface GroupEvent {
  id: number;
  name: string;
  description: string | null;
  category_id?: number | null;
  category_name?: string | null;
  min_allowed_limit: number;
  max_allowed_limit: number;
  per_unit_allowed_limit: number;
  is_active: boolean;
  is_mandatory: boolean;
  gender_restriction: GenderRestriction;
  seniority_restriction: SeniorityRestriction;
  registration_fee_id?: number | null;
  registration_fee_amount?: number | null;
  created_on: string;
  // Registration status fields (from official home API)
  participation_count?: number;
  remaining_slots?: number;
  is_registration_complete?: boolean;
}

export interface GroupEventCreate {
  name: string;
  description?: string;
  category_id?: number;
  max_allowed_limit?: number;
  min_allowed_limit?: number;
  per_unit_allowed_limit?: number;
  is_active?: boolean;
  is_mandatory?: boolean;
  gender_restriction?: GenderRestriction;
  seniority_restriction?: SeniorityRestriction;
}

export interface GroupEventUpdate {
  name?: string;
  description?: string;
  category_id?: number;
  max_allowed_limit?: number;
  min_allowed_limit?: number;
  per_unit_allowed_limit?: number;
  is_active?: boolean;
  is_mandatory?: boolean;
  gender_restriction?: GenderRestriction;
  seniority_restriction?: SeniorityRestriction;
}

// Kalamela Participants
export interface EventParticipant {
  id: number;
  eventId: number;
  eventName: string;
  eventType: 'INDIVIDUAL' | 'GROUP';
  memberId: number;
  memberName: string;
  unitId: number;
  unitName: string;
  districtId: number;
  districtName: string;
  memberPhone: string;
  chestNumber: string;
  registeredAt: string;
}

export interface GroupEventTeam {
  id: number;
  eventId: number;
  eventName: string;
  chestNumber: string; // Same for all team members
  teamMembers: EventParticipant[];
  unitId: number;
  unitName: string;
  districtId: number;
  districtName: string;
  registeredAt: string;
}

// Kalamela Scoring
export type EventGrade = 'A' | 'B' | 'C' | 'No Grade';

export interface EventScore {
  id: number;
  eventParticipationId: number;
  eventId: number;
  eventName: string;
  eventType: 'INDIVIDUAL' | 'GROUP';
  chestNumber: string;
  participantName?: string; // For individual events
  awardedMarks: number; // 0-100
  grade: EventGrade;
  positionPoints: number;
  gradePoints: number; // Only for individual events
  totalPoints: number;
  position?: number; // 1st, 2nd, 3rd, etc.
  createdAt: string;
  updatedAt: string;
}

export interface ScoreSubmission {
  eventParticipationId: number;
  chestNumber: string;
  participantName?: string;
  awardedMarks: number;
}

// Kalamela Payments
export type PaymentStatus = 'PENDING' | 'PAID' | 'INVALID';

export interface KalamelaPayment {
  id: number;
  districtId: number;
  districtName: string;
  individualEventsCount: number;
  groupEventsCount: number;
  totalAmountToPay: number;
  paymentProof?: string; // Image URL
  paymentStatus: PaymentStatus;
  paidBy: string; // User/Official name
  createdAt: string;
  approvedAt?: string;
  approvedBy?: string;
}

// Kalamela Appeals
export type AppealStatus = 'PENDING' | 'RESOLVED';

export interface ScoreAppeal {
  id: number;
  eventParticipationId: number;
  chestNumber: string;
  participantName: string;
  eventName: string;
  statement: string;
  reply?: string;
  status: AppealStatus;
  addedBy: string;
  createdAt: string;
  resolvedAt?: string;
  resolvedBy?: string;
}

// Kalamela Exclusions
export interface ExcludedMember {
  id: number;
  memberId: number;
  memberName: string;
  unitId: number;
  unitName: string;
  districtId: number;
  districtName: string;
  reason: string;
  excludedBy: string;
  excludedAt: string;
}

// Kalamela Results/Stats
export interface EventResultEntry {
  position: number;
  chestNumber: string;
  participantName?: string;
  unitName: string;
  districtName: string;
  awardedMarks: number;
  grade: EventGrade;
  totalPoints: number;
}

export interface EventResults {
  eventId: number;
  eventName: string;
  eventType: 'INDIVIDUAL' | 'GROUP';
  results: EventResultEntry[];
}

export interface DistrictPerformance {
  districtId: number;
  districtName: string;
  totalParticipants: number;
  totalPoints: number;
  goldMedals: number; // Grade A
  silverMedals: number; // Grade B
  bronzeMedals: number; // Grade C
  topPerformers: EventResultEntry[];
}

export interface UnitPerformance {
  unitId: number;
  unitName: string;
  districtName: string;
  totalParticipants: number;
  totalPoints: number;
  topPerformers: EventResultEntry[];
}

export interface TopPerformer {
  memberId: number;
  memberName: string;
  unitName: string;
  districtName: string;
  totalPoints: number;
  eventsParticipated: number;
  grades: {
    A: number;
    B: number;
    C: number;
  };
}

// Kalamela Dashboard Stats
export interface KalamelaDashboardStats {
  totalIndividualEvents: number;
  totalGroupEvents: number;
  totalParticipants: number;
  totalIndividualParticipants: number;
  totalGroupParticipants: number;
  totalScoresEntered: number;
  pendingScores: number;
  totalPayments: number;
  pendingPayments: number;
  totalAppeals: number;
  pendingAppeals: number;
  topDistricts: DistrictPerformance[];
  recentRegistrations: EventParticipant[];
}

// ============================================
// Site Settings Types
// ============================================

export interface ContactInfo {
  address: string | null;
  email: string | null;
  phone: string | null;
}

export interface SocialLinks {
  facebook: string | null;
  instagram: string | null;
  youtube: string | null;
}

export interface QuickLinkPreview {
  id: number;
  label: string;
  url: string;
  enabled: boolean;
}

export interface SiteSettings {
  id: number;
  app_name: string;
  app_subtitle: string | null;
  about_text: string | null;
  logo_primary_url: string | null;
  logo_secondary_url: string | null;
  logo_tertiary_url: string | null;
  registration_enabled: boolean;
  registration_closed_message: string | null;
  contact: ContactInfo;
  social_links: SocialLinks;
  updated_at: string;
  quick_links: QuickLinkPreview[];
}

export interface SiteSettingsUpdate {
  app_name?: string;
  app_subtitle?: string;
  about_text?: string;
  registration_enabled?: boolean;
  registration_closed_message?: string;
  contact?: Partial<ContactInfo>;
  social_links?: Partial<SocialLinks>;
}

export interface LogoUploadResponse {
  logo_type: string;
  url: string;
  filename: string;
}

// Notice Types
export interface Notice {
  id: number;
  text: string;
  priority: 'high' | 'normal' | 'low';
  is_active: boolean;
  display_order: number;
  start_date: string | null;
  end_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface NoticeCreate {
  text: string;
  priority?: 'high' | 'normal' | 'low';
  is_active?: boolean;
  display_order?: number;
  start_date?: string | null;
  end_date?: string | null;
}

export interface NoticeUpdate {
  text?: string;
  priority?: 'high' | 'normal' | 'low';
  is_active?: boolean;
  display_order?: number;
  start_date?: string | null;
  end_date?: string | null;
}

export interface NoticeReorderItem {
  id: number;
  display_order: number;
}

// Quick Link Types
export interface QuickLink {
  id: number;
  label: string;
  url: string;
  enabled: boolean;
  display_order: number;
  created_at: string;
}

export interface QuickLinkCreate {
  label: string;
  url: string;
  enabled?: boolean;
  display_order?: number;
}

export interface QuickLinkUpdate {
  label?: string;
  url?: string;
  enabled?: boolean;
  display_order?: number;
}

// ==================== KALAMELA RULES TYPES ====================

export interface KalamelaRulesGrouped {
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
}

export interface KalamelaRule {
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
}

export interface KalamelaRuleCreate {
  rule_key: string;
  rule_category: 'age_restriction' | 'participation_limit' | 'fee';
  rule_value: string;
  display_name: string;
  description?: string;
  is_active?: boolean;
}

export interface KalamelaRuleUpdate {
  rule_value?: string;
  display_name?: string;
  description?: string;
  is_active?: boolean;
}

// ==================== DISTRICT MEMBERS TYPES ====================

export interface DistrictMember {
  id: number;
  name: string;
  phone_number: string;
  dob: string;
  age: number;
  gender: string;
  unit_id: number;
  unit_name: string;
  participation_category: 'Junior' | 'Senior' | 'Ineligible';
  is_excluded: boolean;
  is_registered?: boolean;
  registered_events_count?: number;
}

export interface DistrictMembersResponse {
  members: DistrictMember[];
  total_count: number;
  summary: {
    junior_count: number;
    senior_count: number;
    ineligible_count: number;
    excluded_count: number;
  };
  units: Array<{ id: number; name: string }>;
  filters_applied: {
    unit_id: number | null;
    participation_category: string | null;
    search: string | null;
  };
  age_restrictions: {
    junior_dob_start: string;
    junior_dob_end: string;
    senior_dob_start: string;
    senior_dob_end: string;
  };
}
