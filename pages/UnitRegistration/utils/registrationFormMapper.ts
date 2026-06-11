import {
  RegistrationFormCouncilor,
  RegistrationFormMember,
  RegistrationFormOfficials,
  UnitRegistrationFormDocumentProps,
} from '../../../components/UnitRegistrationFormDocument';
import {
  Unit,
  UnitApplicationForm,
  UnitCouncilor,
  UnitMember,
  UnitOfficial,
  UnitRegistrationMember,
  UnitRegistrationOfficial,
} from '../../../types';
import { getMemberResidenceLabel, ResidenceMemberLike } from '../../../utils/memberResidence';

const defaultRegistrationYear = () => new Date().getFullYear();

const calcAgeAsOf = (dob: string | undefined, referenceDate: Date): number | undefined => {
  if (!dob) return undefined;
  const birth = new Date(dob);
  if (Number.isNaN(birth.getTime())) return undefined;

  let age = referenceDate.getFullYear() - birth.getFullYear();
  const monthDiff = referenceDate.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && referenceDate.getDate() < birth.getDate())) {
    age -= 1;
  }
  return age;
};

const getRegistrationAgeReferenceDate = (registrationYear: number): Date =>
  new Date(registrationYear, 5, 30);

const toResidenceMemberLike = (
  member: UnitRegistrationMember | UnitMember,
): ResidenceMemberLike => {
  if ('residence_location' in member) {
    return {
      residence_location: member.residence_location,
      residence_state_id: member.residence_state_id,
      residence_city_id: member.residence_city_id,
      residence_state_name: member.residence_state_name,
      residence_city_name: member.residence_city_name,
      residence_country_name: member.residence_country_name,
    };
  }

  return {
    residence_location: member.residenceLocation,
    residence_state_id: member.residenceStateId,
    residence_city_id: member.residenceCityId,
    residence_state_name: member.residenceStateName,
    residence_city_name: member.residenceCityName,
    residence_country_name: member.residenceCountryName,
  };
};

export const mapRegistrationOfficials = (
  officials: UnitRegistrationOfficial | UnitOfficial | null,
): RegistrationFormOfficials | null => {
  if (!officials) return null;

  if ('president_name' in officials) {
    return {
      presidentDesignation: officials.president_designation,
      presidentName: officials.president_name,
      presidentPhone: officials.president_phone,
      vicePresidentName: officials.vice_president_name,
      vicePresidentPhone: officials.vice_president_phone,
      secretaryName: officials.secretary_name,
      secretaryPhone: officials.secretary_phone,
      jointSecretaryName: officials.joint_secretary_name,
      jointSecretaryPhone: officials.joint_secretary_phone,
      treasurerName: officials.treasurer_name,
      treasurerPhone: officials.treasurer_phone,
    };
  }

  return {
    presidentDesignation: officials.presidentDesignation,
    presidentName: officials.presidentName,
    presidentPhone: officials.presidentPhone,
    vicePresidentName: officials.vicePresidentName,
    vicePresidentPhone: officials.vicePresidentPhone,
    secretaryName: officials.secretaryName,
    secretaryPhone: officials.secretaryPhone,
    jointSecretaryName: officials.jointSecretaryName,
    jointSecretaryPhone: officials.jointSecretaryPhone,
    treasurerName: officials.treasurerName,
    treasurerPhone: officials.treasurerPhone,
  };
};

export const mapRegistrationMembers = (
  members: UnitRegistrationMember[] | UnitMember[],
  registrationYear?: number,
): RegistrationFormMember[] => {
  const ageReferenceDate = getRegistrationAgeReferenceDate(
    registrationYear ?? defaultRegistrationYear(),
  );

  return members.map((member) => ({
    name: member.name,
    gender: member.gender,
    dob: member.dob,
    age: calcAgeAsOf(member.dob, ageReferenceDate),
    number: 'number' in member ? member.number : undefined,
    qualification: 'qualification' in member ? member.qualification : undefined,
    bloodGroup: 'blood_group' in member ? member.blood_group : member.bloodGroup,
    locationInfo: getMemberResidenceLabel(toResidenceMemberLike(member)),
  }));
};

export const mapApplicationFormCouncilors = (
  formData: UnitApplicationForm,
): RegistrationFormCouncilor[] =>
  formData.unit_councilors.map((councilor) => {
    const member = formData.unit_members.find((item) => item.id === councilor.unit_member_id);
    return {
      name: member?.name || 'Unknown',
      phone: member?.number || '',
    };
  });

export const mapAdminCouncilors = (councilors: UnitCouncilor[]): RegistrationFormCouncilor[] =>
  councilors.map((councilor) => ({
    name: councilor.memberName,
    phone: councilor.memberPhone,
  }));

export const mapApplicationFormToDocument = (
  formData: UnitApplicationForm,
): UnitRegistrationFormDocumentProps => ({
  registrationNumber: formData.user_data.username,
  clergyDistrict: formData.user_data.clergy_district_name || 'Unknown',
  unitName: formData.user_data.unit_name || 'Unknown',
  registrationYear: formData.registration_year ?? formData.unit_details?.registration_year ?? defaultRegistrationYear(),
  membersCount: formData.member_count,
  officials: mapRegistrationOfficials(formData.unit_officials),
  councilors: mapApplicationFormCouncilors(formData),
  members: mapRegistrationMembers(
    formData.unit_members,
    formData.registration_year ?? formData.unit_details?.registration_year ?? defaultRegistrationYear(),
  ),
  unitRegistrationFee: formData.unit_registration_fee,
  unitMemberFee: formData.unit_member_fee,
  totalAmount: formData.total_amount,
});

export const mapAdminUnitToDocument = (
  unit: Unit,
  officials: UnitOfficial | null,
  councilors: UnitCouncilor[],
  members: UnitMember[],
  fees: { unitRegistrationFee: number; unitMemberFee: number; totalAmount: number },
): UnitRegistrationFormDocumentProps => ({
  registrationNumber: unit.unitNumber,
  clergyDistrict: unit.clergyDistrict,
  unitName: unit.name,
  registrationYear: unit.registrationYear,
  membersCount: unit.membersCount,
  officials: mapRegistrationOfficials(officials),
  councilors: mapAdminCouncilors(councilors),
  members: mapRegistrationMembers(members, unit.registrationYear),
  unitRegistrationFee: fees.unitRegistrationFee,
  unitMemberFee: fees.unitMemberFee,
  totalAmount: fees.totalAmount,
});
