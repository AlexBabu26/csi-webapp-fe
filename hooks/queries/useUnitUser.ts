import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../services/api';
import { queryKeys } from '../../constants/queryKeys';
import { useToast } from '../../components/Toast';

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
      return api.submitMemberInfoChange(data.memberId, data.changes, data.reason, data.proof);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.requests.myRequests(0) });
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
      unitId: number;
      newPresidentId: number;
      newSecretaryId: number;
      newTreasurerId: number;
      reason: string;
      proof?: File;
    }) => {
      return api.submitOfficialsChange(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.requests.myRequests(0) });
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
      unitId: number;
      councilorIds: number[];
      reason: string;
      proof?: File;
    }) => {
      return api.submitCouncilorChange(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.requests.myRequests(0) });
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
      fromUnitId: number;
      toUnitId: number;
      reason: string;
      proof?: File;
    }) => {
      return api.submitTransferRequest(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.requests.myRequests(0) });
      addToast('Transfer request submitted successfully', 'success');
    },
    onError: (error: any) => {
      addToast(error.message || 'Failed to submit request', 'error');
    },
  });
};

// Submit member add request
export const useSubmitMemberAdd = () => {
  const queryClient = useQueryClient();
  const { addToast } = useToast();

  return useMutation({
    mutationFn: async (data: {
      unitId: number;
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
      queryClient.invalidateQueries({ queryKey: queryKeys.requests.myRequests(0) });
      addToast('Member add request submitted successfully', 'success');
    },
    onError: (error: any) => {
      addToast(error.message || 'Failed to submit request', 'error');
    },
  });
};


