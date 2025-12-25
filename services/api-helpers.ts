// Helper functions for API calculations and utilities

// Re-export auth functions for backward compatibility
// Use the centralized auth.ts for all token operations
export { 
  getAuthToken as getToken, 
  setAuthToken as setToken, 
  clearAuth as removeToken 
} from './auth';

/**
 * Calculate grade based on marks (out of 100)
 * 
 * Grade Thresholds:
 * - A Grade: 60% and above
 * - B Grade: 50% to 59%
 * - C Grade: 40% to 49%
 * - No Grade: Below 40%
 */
export const calculateGrade = (marks: number): 'A' | 'B' | 'C' | 'No Grade' => {
  // Marks are out of 100, so marks = percentage
  if (marks >= 60) return 'A';      // 60% and above
  if (marks >= 50) return 'B';      // 50% to 59%
  if (marks >= 40) return 'C';      // 40% to 49%
  return 'No Grade';                // Below 40%
};

/**
 * Calculate points for grade and rank
 * 
 * Point Values:
 * - 5 Points: A Grade or 1st Rank
 * - 3 Points: B Grade or 2nd Rank
 * - 1 Point: C Grade or 3rd Rank
 * 
 * Individual Events: Grade Points + Rank Points
 * Group Events: Rank Points only (no grade points for championship)
 * 
 * Note: Backend auto-calculates ranks, this is for UI preview only
 */
export const calculatePoints = (
  marks: number,
  position: number,
  isGroup: boolean
): {
  grade: 'A' | 'B' | 'C' | 'No Grade';
  positionPoints: number;
  gradePoints: number;
  totalPoints: number;
} => {
  const grade = calculateGrade(marks);
  let gradePoints = 0;
  let positionPoints = 0;

  // Rank/Position points (same for both individual and group: 5/3/1)
  if (position === 1) positionPoints = 5;
  else if (position === 2) positionPoints = 3;
  else if (position === 3) positionPoints = 1;

  // Grade points (only for individual events, not for group events)
  if (!isGroup) {
    if (grade === 'A') gradePoints = 5;
    else if (grade === 'B') gradePoints = 3;
    else if (grade === 'C') gradePoints = 1;
    // No grade points for marks below 40%
  }

  return {
    grade,
    positionPoints,
    gradePoints,
    totalPoints: positionPoints + gradePoints,
  };
};

/**
 * Calculate grade points only (for UI preview before rank is determined)
 */
export const calculateGradePoints = (marks: number): number => {
  const grade = calculateGrade(marks);
  if (grade === 'A') return 5;
  if (grade === 'B') return 3;
  if (grade === 'C') return 1;
  return 0;
};

/**
 * Calculate rank points based on position
 */
export const calculateRankPoints = (position: number): number => {
  if (position === 1) return 5;
  if (position === 2) return 3;
  if (position === 3) return 1;
  return 0;
};

export const generateChestNumber = (
  districtCode: string,
  eventType: 'IE' | 'GE',
  eventId: number,
  sequence: number
): string => {
  return `${districtCode.substring(0, 3).toUpperCase()}-${eventType}${eventId}-${String(sequence).padStart(3, '0')}`;
};

export const calculateAge = (dob: string): number => {
  const birthDate = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
};
