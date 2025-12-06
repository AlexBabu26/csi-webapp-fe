
import { Metric, Participant, EventItem, ScoreEntry } from './types';

export const APP_NAME = "Kalamela Manager";

export const ABOUT_TEXT = `The CSI Madhya Kerala Diocesan Youth Movement is the first Christian Youth Movement in Asia. The earliest form of the Diocesan Youth Movement was the 'Annual Anglican Youth League' which was started by Bishop Charles Hope Gill. In 1916, during the time of the centenary celebrations of the Church Missionary Society Activities in Travancore-Cochin, the missionaries felt the need of utilizing the creative and physical potentials of the youth for the glory of God.`;

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
    { chestNumber: '101', judge1: 28, judge2: 30, judge3: 25, total: 83, grade: 'A' },
    { chestNumber: '105', judge1: 32, judge2: 31, judge3: 28, total: 91, grade: 'A' },
    { chestNumber: '112', judge1: 25, judge2: 24, judge3: 20, total: 69, grade: 'B' },
];

export const CHART_DATA = [
  { name: 'Kottayam', participants: 400 },
  { name: 'Mavelikara', participants: 300 },
  { name: 'Alappuzha', participants: 200 },
  { name: 'Cochin', participants: 278 },
  { name: 'Kollam', participants: 189 },
  { name: 'Idukki', participants: 239 },
];
