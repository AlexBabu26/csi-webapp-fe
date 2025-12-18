
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
  token_type: string;
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

// Kalamela Events
export interface IndividualEvent {
  id: number;
  name: string;
  description: string;
  category?: string;
  registrationFee: number; // Rs.50
  remainingSlots?: number;
  createdAt: string;
}

export interface GroupEvent {
  id: number;
  name: string;
  description: string;
  minAllowedLimit: number;
  maxAllowedLimit: number;
  registrationFee: number; // Rs.100
  remainingSlots?: number;
  createdAt: string;
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
