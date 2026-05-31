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

const defaultRegistrationYear = () => new Date().getFullYear();

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
): RegistrationFormMember[] =>
  members.map((member) => ({
    name: member.name,
    gender: member.gender,
    dob: member.dob,
    number: 'number' in member ? member.number : undefined,
    qualification: 'qualification' in member ? member.qualification : undefined,
    bloodGroup: 'blood_group' in member ? member.blood_group : member.bloodGroup,
  }));

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
  registrationYear: formData.unit_details?.registration_year ?? defaultRegistrationYear(),
  membersCount: formData.member_count,
  officials: mapRegistrationOfficials(formData.unit_officials),
  councilors: mapApplicationFormCouncilors(formData),
  members: mapRegistrationMembers(formData.unit_members),
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
  members: mapRegistrationMembers(members),
  unitRegistrationFee: fees.unitRegistrationFee,
  unitMemberFee: fees.unitMemberFee,
  totalAmount: fees.totalAmount,
});
