import { UnitApplicationForm, UnitRegistrationStatus } from '../../types';

export const WIZARD_STEPS = [
  { id: 1, label: 'Account', shortLabel: 'Account' },
  { id: 2, label: 'Unit Details', shortLabel: 'Details' },
  { id: 3, label: 'Members', shortLabel: 'Members' },
  { id: 4, label: 'Officials', shortLabel: 'Officials' },
  { id: 5, label: 'Councilors', shortLabel: 'Councilors' },
  { id: 6, label: 'Declaration', shortLabel: 'Declaration' },
] as const;

export type WizardStepId = (typeof WIZARD_STEPS)[number]['id'];

const STATUS_TO_STEP: Record<UnitRegistrationStatus, WizardStepId> = {
  'Not Started': 1,
  'Registration Started': 2,
  'Unit Details': 3,
  'Unit Members Completed': 4,
  'Unit Officials Completed': 5,
  'Unit Councilors Completed': 6,
  'Declaration Submitted': 6,
  'Registration Completed': 6,
};

export const statusToStep = (status: UnitRegistrationStatus): WizardStepId =>
  STATUS_TO_STEP[status] ?? 2;

export const isRegistrationComplete = (status: UnitRegistrationStatus): boolean =>
  status === 'Registration Completed';

export const hasSubmittedDeclaration = (status: UnitRegistrationStatus): boolean =>
  status === 'Declaration Submitted' || status === 'Registration Completed';

export const canAccessUnitChangeRequests = (form: UnitApplicationForm): boolean => {
  const isRenewal = form.path_type === 'renewal' || form.is_renewal;
  if (isRenewal) {
    return true;
  }
  return hasSubmittedDeclaration(form.registration_status);
};

export const canNavigateToStep = (
  targetStep: WizardStepId,
  currentMaxStep: WizardStepId
): boolean => targetStep <= currentMaxStep && targetStep >= 2;
