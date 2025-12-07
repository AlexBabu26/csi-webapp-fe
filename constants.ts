
import { Metric, Participant, EventItem, ScoreEntry } from './types';

export const APP_NAME = "CSI MKD YOUTH MOVEMENT";
export const APP_SUBTITLE = "CSI Madhya Kerala Diocese";

export const ABOUT_TEXT = `The CSI Madhya Kerala Diocesan Youth Movement is the first Christian Youth Movement in Asia. The earliest form of the Diocesan Youth Movement was the 'Annual Anglican Youth League' which was started by Bishop Charles Hope Gill. In 1916, during the time of the centenary celebrations of the Church Missionary Society Activities in Travancore-Cochin, the missionaries felt the need of utilizing the creative and physical potentials of the youth for the glory of God.`;

// Mock Notices for marquee
export const MOCK_NOTICES = [
  { id: 1, priority: 'high' as const, text: 'Kalamela 2024 Registration closes on December 31st.' },
  { id: 2, priority: 'normal' as const, text: 'Unit Presidents meeting scheduled for next Saturday at 10 AM.' },
  { id: 3, priority: 'normal' as const, text: 'Youth Conference 2025 dates announced - February 14-16.' },
];

// Mock Stats for Admin Dashboard
export const MOCK_STATS = {
  totalDistricts: 12,
  completedDistricts: 8,
  totalUnits: 156,
  completedUnits: 124,
  totalMembers: 4582,
  topUnit: {
    name: 'Kottayam Central',
    count: 89,
  },
};

export const MOCK_METRICS: Metric[] = [
  { label: 'Total Registrations', value: '1,248', change: '+12%', trend: 'up' },
  { label: 'Events Scheduled', value: '42', change: '0%', trend: 'neutral' },
  { label: 'Results Published', value: '18', change: '+5', trend: 'up' },
  { label: 'Pending Appeals', value: '3', change: '-2', trend: 'down' },
];

export const RECENT_REGISTRATIONS: Participant[] = [
  { id: '1', chestNumber: '101', name: 'Alen J', unit: 'Kottayam', district: 'Kottayam', category: 'Senior', points: 0 },
  { id: '2', chestNumber: '102', name: 'Sarah Thomas', unit: 'Mavelikara', district: 'Mavelikara', category: 'Junior', points: 0 },
  { id: '3', chestNumber: '105', name: 'John Doe', unit: 'Alappuzha', district: 'Alappuzha', category: 'Senior', points: 0 },
  { id: '4', chestNumber: '108', name: 'Maria Kurian', unit: 'Cochin', district: 'Cochin', category: 'Sub-Junior', points: 0 },
  { id: '5', chestNumber: '112', name: 'David George', unit: 'Kollam', district: 'Kollam', category: 'Senior', points: 0 },
];

export const EVENTS_LIST: EventItem[] = [
  { id: 'e1', name: 'Light Music (Malayalam)', type: 'Individual', status: 'Completed', registeredCount: 45, totalSlots: 50 },
  { id: 'e2', name: 'Elocution (English)', type: 'Individual', status: 'Ongoing', registeredCount: 30, totalSlots: 35 },
  { id: 'e3', name: 'Group Song', type: 'Group', status: 'Scheduled', registeredCount: 12, totalSlots: 15 },
  { id: 'e4', name: 'Bible Quiz', type: 'Group', status: 'Scheduled', registeredCount: 20, totalSlots: 25 },
];

export const MOCK_SCORES: ScoreEntry[] = [
    { chestNumber: '101', name: 'Alen J', judge1: 28, judge2: 30, judge3: 25, total: 83, grade: 'A' },
    { chestNumber: '102', name: 'Sarah Thomas', judge1: 30, judge2: 28, judge3: 26, total: 84, grade: 'A' },
    { chestNumber: '105', name: 'John Doe', judge1: 32, judge2: 31, judge3: 28, total: 91, grade: 'A+' },
    { chestNumber: '108', name: 'Maria Kurian', judge1: 22, judge2: 20, judge3: 18, total: 60, grade: 'B' },
    { chestNumber: '112', name: 'David George', judge1: 25, judge2: 24, judge3: 20, total: 69, grade: 'B+' },
    { chestNumber: '115', name: 'Anita Cherian', judge1: 18, judge2: 19, judge3: 15, total: 52, grade: 'C+' },
    { chestNumber: '118', name: 'Thomas Matthew', judge1: 33, judge2: 34, judge3: 29, total: 96, grade: 'A+' },
    { chestNumber: '121', name: 'Priya Varghese', judge1: 27, judge2: 26, judge3: 22, total: 75, grade: 'B+' },
    { chestNumber: '124', name: 'Samuel Philip', judge1: 12, judge2: 15, judge3: 10, total: 37, grade: 'C' },
    { chestNumber: '127', name: 'Rachel George', judge1: 30, judge2: 31, judge3: 27, total: 88, grade: 'A' },
    { chestNumber: '130', name: 'Joel Abraham', judge1: 10, judge2: 12, judge3: 8, total: 30, grade: 'F' },
    { chestNumber: '133', name: 'Grace Thomas', judge1: 29, judge2: 27, judge3: 24, total: 80, grade: 'A' },
];

export const CHART_DATA = [
  { name: 'Kottayam', participants: 400 },
  { name: 'Mavelikara', participants: 300 },
  { name: 'Alappuzha', participants: 200 },
  { name: 'Cochin', participants: 278 },
  { name: 'Kollam', participants: 189 },
  { name: 'Idukki', participants: 239 },
];
