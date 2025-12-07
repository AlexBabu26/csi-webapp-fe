
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
