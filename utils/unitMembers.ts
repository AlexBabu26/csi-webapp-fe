import {
  UnitCouncilor,
  UnitMember,
  UnitRegistrationCouncilor,
  UnitRegistrationMember,
} from '../types';

const calcAge = (dob?: string): number => {
  if (!dob) return 0;
  const birth = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age -= 1;
  }
  return age;
};

export const mapRegistrationMemberToUnitMember = (
  member: UnitRegistrationMember,
  unitId: number,
  unitName = '',
): UnitMember => ({
  id: member.id,
  name: member.name,
  gender: (member.gender as UnitMember['gender']) || 'M',
  number: member.number || '',
  dob: member.dob || '',
  age: calcAge(member.dob),
  qualification: member.qualification,
  bloodGroup: member.blood_group,
  residenceLocation: member.residence_location,
  residenceStateId: member.residence_state_id ?? undefined,
  residenceCityId: member.residence_city_id ?? undefined,
  residenceStateName: member.residence_state_name ?? undefined,
  residenceCityName: member.residence_city_name ?? undefined,
  residenceCountryName: member.residence_country_name ?? undefined,
  residenceCountryId: member.residence_country_id ?? undefined,
  unitId,
  unitName,
  isArchived: false,
});

export const mapRegistrationCouncilors = (
  councilors: UnitRegistrationCouncilor[],
  members: UnitRegistrationMember[],
  unitId: number,
  unitName = '',
): UnitCouncilor[] =>
  councilors.map((councilor) => {
    const member = members.find((item) => item.id === councilor.unit_member_id);
    return {
      id: councilor.id,
      unitId,
      unitName,
      memberId: councilor.unit_member_id,
      memberName: member?.name ?? '',
      memberPhone: member?.number ?? '',
      memberGender: member?.gender ?? '',
      memberDob: member?.dob ?? '',
      memberQualification: member?.qualification,
    };
  });
