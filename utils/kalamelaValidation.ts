// utils/kalamelaValidation.ts
// Validation utilities for Kalamela participation rules

interface AgeRestrictions {
  senior_dob_start: string;
  senior_dob_end: string;
  junior_dob_start: string;
  junior_dob_end: string;
}

interface ParticipationLimits {
  max_individual_events_per_person: string;
  max_participants_per_unit_per_event: string;
  max_groups_per_unit_per_group_event: string;
}

interface Fees {
  individual_event_fee: string;
  group_event_fee: string;
  appeal_fee: string;
}

/**
 * Determine participation category based on DOB
 */
export function getParticipationCategory(
  dob: string | Date | null | undefined,
  ageRestrictions: AgeRestrictions
): 'Junior' | 'Senior' | 'Ineligible' | 'Unknown' {
  if (!dob) return 'Unknown';
  
  const dobDate = new Date(dob);
  const juniorStart = new Date(ageRestrictions.junior_dob_start);
  const juniorEnd = new Date(ageRestrictions.junior_dob_end);
  const seniorStart = new Date(ageRestrictions.senior_dob_start);
  const seniorEnd = new Date(ageRestrictions.senior_dob_end);
  
  if (dobDate >= juniorStart && dobDate <= juniorEnd) {
    return 'Junior';
  } else if (dobDate >= seniorStart && dobDate <= seniorEnd) {
    return 'Senior';
  } else {
    return 'Ineligible';
  }
}

/**
 * Check if person can register for more individual events
 */
export function canRegisterForMoreEvents(
  currentEventCount: number,
  limits: ParticipationLimits
): { canRegister: boolean; maxEvents: number; remaining: number } {
  const maxEvents = parseInt(limits.max_individual_events_per_person, 10);
  const remaining = maxEvents - currentEventCount;
  return {
    canRegister: currentEventCount < maxEvents,
    maxEvents,
    remaining: Math.max(0, remaining),
  };
}

/**
 * Check if unit has quota for this event
 */
export function hasUnitQuota(
  currentUnitParticipants: number,
  limits: ParticipationLimits
): { hasQuota: boolean; maxPerUnit: number; remaining: number } {
  const maxPerUnit = parseInt(limits.max_participants_per_unit_per_event, 10);
  const remaining = maxPerUnit - currentUnitParticipants;
  return {
    hasQuota: currentUnitParticipants < maxPerUnit,
    maxPerUnit,
    remaining: Math.max(0, remaining),
  };
}

/**
 * Check if unit can add more groups to event
 */
export function canAddMoreGroups(
  currentGroupCount: number,
  limits: ParticipationLimits
): { canAdd: boolean; maxGroups: number; remaining: number } {
  const maxGroups = parseInt(limits.max_groups_per_unit_per_group_event, 10);
  const remaining = maxGroups - currentGroupCount;
  return {
    canAdd: currentGroupCount < maxGroups,
    maxGroups,
    remaining: Math.max(0, remaining),
  };
}

/**
 * Calculate total fee
 */
export function calculateTotalFee(
  individualCount: number,
  groupCount: number,
  fees: Fees
): { total: number; individualTotal: number; groupTotal: number; breakdown: string } {
  const indFee = parseInt(fees.individual_event_fee, 10);
  const grpFee = parseInt(fees.group_event_fee, 10);
  const individualTotal = individualCount * indFee;
  const groupTotal = groupCount * grpFee;
  const total = individualTotal + groupTotal;
  
  return {
    total,
    individualTotal,
    groupTotal,
    breakdown: `${individualCount} × ₹${indFee} + ${groupCount} × ₹${grpFee} = ₹${total}`,
  };
}

/**
 * Get appeal fee
 */
export function getAppealFee(fees: Fees): number {
  return parseInt(fees.appeal_fee, 10);
}

/**
 * Get validation errors for adding a participant
 */
export function validateParticipantAddition(
  member: {
    participation_category: string;
    is_excluded: boolean;
    registered_events_count?: number;
  },
  unitParticipantsInEvent: number,
  limits: ParticipationLimits
): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (member.participation_category === 'Ineligible') {
    errors.push('Member is not eligible (outside age range)');
  }
  
  if (member.is_excluded) {
    errors.push('Member is excluded from Kalamela');
  }
  
  const eventCheck = canRegisterForMoreEvents(member.registered_events_count || 0, limits);
  if (!eventCheck.canRegister) {
    errors.push(`Already registered for ${eventCheck.maxEvents} events (maximum)`);
  }
  
  const quotaCheck = hasUnitQuota(unitParticipantsInEvent, limits);
  if (!quotaCheck.hasQuota) {
    errors.push(`Unit quota reached (max ${quotaCheck.maxPerUnit} participants per unit per event)`);
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Format date for display
 */
export function formatDate(dateStr: string | undefined | null): string {
  if (!dateStr) return '-';
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

/**
 * Calculate age from date of birth
 */
export function calculateAge(dob: string | undefined | null): number | null {
  if (!dob) return null;
  const birthDate = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
}

/**
 * Get category badge color
 */
export function getCategoryBadgeColor(category: string): string {
  switch (category) {
    case 'Junior':
      return 'bg-blue-100 text-blue-700 border-blue-200';
    case 'Senior':
      return 'bg-purple-100 text-purple-700 border-purple-200';
    case 'Ineligible':
      return 'bg-gray-100 text-gray-600 border-gray-200';
    default:
      return 'bg-gray-100 text-gray-600 border-gray-200';
  }
}

/**
 * Get rule category display name
 */
export function getRuleCategoryDisplayName(category: string): string {
  switch (category) {
    case 'age_restriction':
      return 'Age Restrictions';
    case 'participation_limit':
      return 'Participation Limits';
    case 'fee':
      return 'Fees';
    default:
      return category;
  }
}

/**
 * Get rule value input type based on rule key
 */
export function getRuleInputType(ruleKey: string): 'date' | 'number' | 'text' {
  if (ruleKey.includes('dob') || ruleKey.includes('date')) {
    return 'date';
  }
  if (ruleKey.includes('fee') || ruleKey.includes('max') || ruleKey.includes('limit') || ruleKey.includes('count')) {
    return 'number';
  }
  return 'text';
}

