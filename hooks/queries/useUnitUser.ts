import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../../services/api';
import { queryKeys } from '../../constants/queryKeys';
import { useToast } from '../../components/Toast';
import { ArchivedMemberConcernSubmission } from '../../types';

// ============ UNIT ARCHIVED MEMBERS ============

export const useRecentArchivedMembers = () => {
  return useQuery({
    queryKey: queryKeys.unitArchived.recent(),
    queryFn: () => api.getRecentArchivedMembers(),
  });
};

export const usePendingRemovedMembers = (enabled = true) => {
  return useQuery({
    queryKey: queryKeys.unitRemoved.pending(),
    queryFn: () => api.getPendingRemovedMembers(),
    enabled,
    staleTime: 0,
    refetchOnMount: 'always',
  });
};

export const useAcknowledgeRemovedMembers = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (removedMemberIds?: number[]) => api.acknowledgeRemovedMembers(removedMemberIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.unitRemoved.all });
    },
    onError: (error: any) => {
      // Surface errors only via console; closing should feel silent
      console.error('Failed to acknowledge removed members:', error);
    },
  });
};

// Registered units available as transfer destinations
export const useTransferDestinations = (enabled = true) => {
  return useQuery({
    queryKey: queryKeys.requests.transferDestinations(),
    queryFn: async () => {
      const response = await api.getTransferDestinations();
      return response.data;
    },
    enabled,
    staleTime: 5 * 60 * 1000,
  });
};

// ============ UNIT USER FORM SUBMISSION MUTATIONS ============

// Submit member info change request
export const useSubmitMemberInfoChange = () => {
  const queryClient = useQueryClient();
  const { addToast } = useToast();

  return useMutation({
    mutationFn: async (data: {
      memberId: number;
      changes: Record<string, any>;
      reason: string;
      proof?: File;
    }) => {
      return api.submitMemberInfoChange({
        memberId: data.memberId,
        changes: data.changes,
        reason: data.reason,
        proof: data.proof,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.requests.myRequests() });
      addToast('Member info change request submitted successfully', 'success');
    },
    onError: (error: any) => {
      addToast(error.message || 'Failed to submit request', 'error');
    },
  });
};

// Submit officials change request
export const useSubmitOfficialsChange = () => {
  const queryClient = useQueryClient();
  const { addToast } = useToast();

  return useMutation({
    mutationFn: async (data: {
      unitOfficialId: number;
      changes: Record<string, string>;
      reason: string;
      proof?: File;
    }) => {
      return api.submitOfficialsChange({
        unitOfficialId: data.unitOfficialId,
        changes: data.changes,
        reason: data.reason,
        proof: data.proof,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.requests.myRequests() });
      addToast('Officials change request submitted successfully', 'success');
    },
    onError: (error: any) => {
      addToast(error.message || 'Failed to submit request', 'error');
    },
  });
};

// Submit councilor change request
export const useSubmitCouncilorChange = () => {
  const queryClient = useQueryClient();
  const { addToast } = useToast();

  return useMutation({
    mutationFn: async (data: {
      councilorId: number;
      newMemberId: number;
      reason: string;
      proof?: File;
    }) => {
      return api.submitCouncilorChange({
        councilorId: data.councilorId,
        newMemberId: data.newMemberId,
        reason: data.reason,
        proof: data.proof,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.requests.myRequests() });
      addToast('Councilor change request submitted successfully', 'success');
    },
    onError: (error: any) => {
      addToast(error.message || 'Failed to submit request', 'error');
    },
  });
};

// Submit transfer request
export const useSubmitTransferRequest = () => {
  const queryClient = useQueryClient();
  const { addToast } = useToast();

  return useMutation({
    mutationFn: async (data: {
      memberId: number;
      destinationUnitId: number;
      reason: string;
      proof: File;
    }) => {
      return api.submitTransferRequest(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.requests.myRequests() });
      addToast('Transfer request submitted successfully', 'success');
    },
    onError: (error: any) => {
      addToast(error.message || 'Failed to submit request', 'error');
    },
  });
};

// Submit archived member concern
export const useSubmitArchivedMemberConcern = () => {
  const queryClient = useQueryClient();
  const { addToast } = useToast();

  return useMutation({
    mutationFn: async (payload: ArchivedMemberConcernSubmission) => {
      return api.submitArchivedMemberConcern(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.unitArchived.recent() });
      queryClient.invalidateQueries({ queryKey: queryKeys.requests.all });
      addToast('Concern submitted successfully. Admin will review and respond.', 'success');
    },
    onError: (error: any) => {
      addToast(error.message || 'Failed to submit concern', 'error');
    },
  });
};

// Submit member add request
export const useSubmitMemberAdd = () => {
  const queryClient = useQueryClient();
  const { addToast } = useToast();

  return useMutation({
    mutationFn: async (data: {
      name: string;
      gender: string;
      dob: string;
      number: string;
      bloodGroup?: string;
      qualification?: string;
      reason: string;
      proof?: File;
    }) => {
      return api.submitMemberAdd(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.requests.myRequests() });
      addToast('Member add request submitted successfully', 'success');
    },
    onError: (error: any) => {
      addToast(error.message || 'Failed to submit request', 'error');
    },
  });
};


