// Helper functions for API calculations and utilities

// Re-export auth functions for backward compatibility
// Use the centralized auth.ts for all token operations
export { 
  getAuthToken as getToken, 
  setAuthToken as setToken, 
  clearAuth as removeToken 
} from './auth';

export const calculateGrade = (marks: number): 'A' | 'B' | 'C' | 'No Grade' => {
  const percentage = marks / 100;
  if (percentage >= 0.6) return 'A';
  if (percentage > 0.5) return 'B';
  if (percentage > 0.4) return 'C';
  return 'No Grade';
};

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

  // Position points
  if (isGroup) {
    // Group events: 10/5/3 for top 3
    if (position === 1) positionPoints = 10;
    else if (position === 2) positionPoints = 5;
    else if (position === 3) positionPoints = 3;
  } else {
    // Individual events: 5/3/1 for top 3
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
