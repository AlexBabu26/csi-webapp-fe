import { UnitCouncilor, UnitMember, UnitRegistrationOfficial } from '../../types';
import { phonesEqual } from '../../utils/phoneNumber';

export const MEMBER_SELECT_POSITIONS = [
  'vicePresident',
  'secretary',
  'jointSecretary',
  'treasurer',
] as const;

export type MemberSelectPosition = (typeof MEMBER_SELECT_POSITIONS)[number];

export const findMemberIdByNameAndPhone = (
  members: UnitMember[],
  name: string,
  phone?: string,
): string => {
  const trimmedName = name.trim();
  if (!trimmedName) return '';
  const match = members.find(
    (member) =>
      member.name.trim().toLowerCase() === trimmedName.toLowerCase() &&
      (!phone || phonesEqual(member.number, phone)),
  );
  return match ? String(match.id) : '';
};

const getOfficialMemberIds = (
  unitOfficials: UnitRegistrationOfficial | null,
  members: UnitMember[],
): Set<number> => {
  if (!unitOfficials) return new Set();

  const officialPairs: Array<[string | undefined, string | undefined]> = [
    [unitOfficials.president_name, unitOfficials.president_phone],
    [unitOfficials.vice_president_name, unitOfficials.vice_president_phone],
    [unitOfficials.secretary_name, unitOfficials.secretary_phone],
    [unitOfficials.joint_secretary_name, unitOfficials.joint_secretary_phone],
    [unitOfficials.treasurer_name, unitOfficials.treasurer_phone],
  ];

  const ids = new Set<number>();
  for (const [name, phone] of officialPairs) {
    const memberId = findMemberIdByNameAndPhone(members, name || '', phone || '');
    if (memberId) {
      ids.add(Number(memberId));
    }
  }
  return ids;
};

export const getExcludedMemberIdsForPosition = (
  positionKey: MemberSelectPosition,
  selectedMemberIds: Record<MemberSelectPosition, string>,
  unitOfficials: UnitRegistrationOfficial | null,
  members: UnitMember[],
  councilors: UnitCouncilor[],
): Set<string> => {
  const excluded = new Set<string>();

  for (const key of MEMBER_SELECT_POSITIONS) {
    if (key !== positionKey && selectedMemberIds[key]) {
      excluded.add(selectedMemberIds[key]);
    }
  }

  for (const memberId of getOfficialMemberIds(unitOfficials, members)) {
    excluded.add(String(memberId));
  }

  for (const councilor of councilors) {
    excluded.add(String(councilor.memberId));
  }

  return excluded;
};

export const buildMemberOptionsForPosition = (
  positionKey: MemberSelectPosition,
  members: UnitMember[],
  selectedMemberIds: Record<MemberSelectPosition, string>,
  unitOfficials: UnitRegistrationOfficial | null,
  councilors: UnitCouncilor[],
): Array<{ value: string; label: string }> => {
  const excluded = getExcludedMemberIdsForPosition(
    positionKey,
    selectedMemberIds,
    unitOfficials,
    members,
    councilors,
  );
  const currentId = selectedMemberIds[positionKey];

  return members
    .filter((member) => !excluded.has(String(member.id)) || String(member.id) === currentId)
    .map((member) => ({ value: String(member.id), label: member.name }));
};
