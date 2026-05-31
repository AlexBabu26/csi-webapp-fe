import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../services/api';
import {
  UnitDetailsPayload,
  UnitMemberPayload,
  UnitOfficialPayload,
} from '../../types';
import { useToast } from '../../components/Toast';

export const unitRegistrationKeys = {
  all: ['unitRegistration'] as const,
  applicationForm: () => [...unitRegistrationKeys.all, 'applicationForm'] as const,
  finishRegistration: () => [...unitRegistrationKeys.all, 'finishRegistration'] as const,
  paymentStatus: () => [...unitRegistrationKeys.all, 'paymentStatus'] as const,
  adminPayments: (statusFilter?: string, yearFilter?: number) =>
    [...unitRegistrationKeys.all, 'adminPayments', statusFilter, yearFilter] as const,
};

export const useApplicationForm = (enabled = true) => {
  return useQuery({
    queryKey: unitRegistrationKeys.applicationForm(),
    queryFn: () => api.getApplicationForm(),
    enabled,
    staleTime: 0,
  });
};

export const useFinishRegistration = (enabled = false) => {
  return useQuery({
    queryKey: unitRegistrationKeys.finishRegistration(),
    queryFn: () => api.getFinishRegistration(),
    enabled,
    staleTime: 0,
  });
};

export const useSaveUnitDetails = () => {
  const queryClient = useQueryClient();
  const { addToast } = useToast();

  return useMutation({
    mutationFn: (payload: UnitDetailsPayload) => api.saveUnitDetails(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: unitRegistrationKeys.applicationForm() });
      addToast('Unit details saved', 'success');
    },
    onError: (error: Error) => addToast(error.message || 'Failed to save details', 'error'),
  });
};

export const useAddUnitMember = () => {
  const queryClient = useQueryClient();
  const { addToast } = useToast();

  return useMutation({
    mutationFn: (payload: UnitMemberPayload) => api.addUnitMember(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: unitRegistrationKeys.applicationForm() });
      addToast('Member added', 'success');
    },
    onError: (error: Error) => addToast(error.message || 'Failed to add member', 'error'),
  });
};

export const useUpdateUnitMember = () => {
  const queryClient = useQueryClient();
  const { addToast } = useToast();

  return useMutation({
    mutationFn: ({ memberId, payload }: { memberId: number; payload: Partial<UnitMemberPayload> }) =>
      api.updateUnitMember(memberId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: unitRegistrationKeys.applicationForm() });
      addToast('Member updated', 'success');
    },
    onError: (error: Error) => addToast(error.message || 'Failed to update member', 'error'),
  });
};

export const useDeleteUnitMember = () => {
  const queryClient = useQueryClient();
  const { addToast } = useToast();

  return useMutation({
    mutationFn: (memberId: number) => api.deleteUnitMember(memberId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: unitRegistrationKeys.applicationForm() });
      addToast('Member removed', 'success');
    },
    onError: (error: Error) => addToast(error.message || 'Failed to remove member', 'error'),
  });
};

export const useSubmitUnitMembers = () => {
  const queryClient = useQueryClient();
  const { addToast } = useToast();

  return useMutation({
    mutationFn: () => api.submitUnitMembers(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: unitRegistrationKeys.applicationForm() });
      addToast('Members section completed', 'success');
    },
    onError: (error: Error) => addToast(error.message || 'Failed to submit members', 'error'),
  });
};

export const useSaveUnitOfficials = () => {
  const queryClient = useQueryClient();
  const { addToast } = useToast();

  return useMutation({
    mutationFn: async (officials: UnitOfficialPayload[]) => {
      for (const official of officials) {
        await api.saveUnitOfficial(official);
      }
      await api.confirmUnitOfficials();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: unitRegistrationKeys.applicationForm() });
      addToast('Officials section completed', 'success');
    },
    onError: (error: Error) => addToast(error.message || 'Failed to save officials', 'error'),
  });
};

export const useAddUnitCouncilor = () => {
  const queryClient = useQueryClient();
  const { addToast } = useToast();

  return useMutation({
    mutationFn: (unitMemberId: number) => api.addUnitCouncilor(unitMemberId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: unitRegistrationKeys.applicationForm() });
      addToast('Councilor added', 'success');
    },
    onError: (error: Error) => addToast(error.message || 'Failed to add councilor', 'error'),
  });
};

export const useDeleteUnitCouncilor = () => {
  const queryClient = useQueryClient();
  const { addToast } = useToast();

  return useMutation({
    mutationFn: (councilorId: number) => api.deleteUnitCouncilor(councilorId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: unitRegistrationKeys.applicationForm() });
      addToast('Councilor removed', 'success');
    },
    onError: (error: Error) => addToast(error.message || 'Failed to remove councilor', 'error'),
  });
};

export const useConfirmUnitCouncilors = () => {
  const queryClient = useQueryClient();
  const { addToast } = useToast();

  return useMutation({
    mutationFn: () => api.confirmUnitCouncilors(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: unitRegistrationKeys.applicationForm() });
      addToast('Councilors section completed', 'success');
    },
    onError: (error: Error) => addToast(error.message || 'Failed to confirm councilors', 'error'),
  });
};

export const useCompleteDeclaration = () => {
  const queryClient = useQueryClient();
  const { addToast } = useToast();

  return useMutation({
    mutationFn: () => api.completeDeclaration(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: unitRegistrationKeys.applicationForm() });
      addToast('Registration completed successfully', 'success');
    },
    onError: (error: Error) => addToast(error.message || 'Failed to complete registration', 'error'),
  });
};

// ── Payment hooks ─────────────────────────────────────────────────────────────

export const useUnitPaymentStatus = (enabled = true) => {
  return useQuery({
    queryKey: unitRegistrationKeys.paymentStatus(),
    queryFn: () => api.getUnitPaymentStatus(),
    enabled,
    staleTime: 0,
  });
};

export const useSubmitUnitPaymentProof = () => {
  const queryClient = useQueryClient();
  const { addToast } = useToast();

  return useMutation({
    mutationFn: (file: File) => api.submitUnitPaymentProof(file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: unitRegistrationKeys.paymentStatus() });
      addToast('Payment proof submitted. Awaiting admin review.', 'success');
    },
    onError: (error: Error) => addToast(error.message || 'Failed to submit payment proof', 'error'),
  });
};

// ── Admin payment review hooks ─────────────────────────────────────────────────

export const useAdminRegistrationPayments = (statusFilter?: string, yearFilter?: number) => {
  return useQuery({
    queryKey: unitRegistrationKeys.adminPayments(statusFilter, yearFilter),
    queryFn: () => api.getAdminRegistrationPayments(statusFilter, yearFilter),
    staleTime: 0,
  });
};

export const useApproveRegistrationPayment = () => {
  const queryClient = useQueryClient();
  const { addToast } = useToast();

  return useMutation({
    mutationFn: (paymentId: number) => api.approveRegistrationPayment(paymentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: unitRegistrationKeys.adminPayments() });
      addToast('Payment approved', 'success');
    },
    onError: (error: Error) => addToast(error.message || 'Failed to approve payment', 'error'),
  });
};

export const useRejectRegistrationPayment = () => {
  const queryClient = useQueryClient();
  const { addToast } = useToast();

  return useMutation({
    mutationFn: ({ paymentId, rejectionNote }: { paymentId: number; rejectionNote: string }) =>
      api.rejectRegistrationPayment(paymentId, rejectionNote),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: unitRegistrationKeys.adminPayments() });
      addToast('Payment rejected', 'success');
    },
    onError: (error: Error) => addToast(error.message || 'Failed to reject payment', 'error'),
  });
};
