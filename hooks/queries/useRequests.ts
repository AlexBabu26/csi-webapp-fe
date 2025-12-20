import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../services/api';
import { queryKeys } from '../../constants/queryKeys';
import { useToast } from '../../components/Toast';

// ============ QUERIES ============

export const useTransferRequests = () => {
  return useQuery({
    queryKey: queryKeys.requests.transfers(),
    queryFn: async () => {
      const response = await api.getTransferRequests();
      return response.data;
    },
  });
};

export const useMemberInfoChangeRequests = () => {
  return useQuery({
    queryKey: queryKeys.requests.memberInfo(),
    queryFn: async () => {
      const response = await api.getMemberInfoChangeRequests();
      return response.data;
    },
  });
};

export const useOfficialsChangeRequests = () => {
  return useQuery({
    queryKey: queryKeys.requests.officials(),
    queryFn: async () => {
      const response = await api.getOfficialsChangeRequests();
      return response.data;
    },
  });
};

export const useCouncilorChangeRequests = () => {
  return useQuery({
    queryKey: queryKeys.requests.councilors(),
    queryFn: async () => {
      const response = await api.getCouncilorChangeRequests();
      return response.data;
    },
  });
};

export const useMemberAddRequests = () => {
  return useQuery({
    queryKey: queryKeys.requests.memberAdd(),
    queryFn: async () => {
      const response = await api.getMemberAddRequests();
      return response.data;
    },
  });
};

export const useMyRequests = (unitId: number) => {
  return useQuery({
    queryKey: queryKeys.requests.myRequests(unitId),
    queryFn: async () => {
      const response = await api.getMyRequests(unitId);
      return response.data;
    },
    enabled: !!unitId,
  });
};

// ============ MUTATIONS ============

type RequestType = 'Transfer' | 'Member Info Change' | 'Officials Change' | 'Councilor Change' | 'Member Add';

// Get the query key for a request type
const getQueryKeyForRequestType = (requestType: RequestType) => {
  const queryKeyMap: Record<RequestType, readonly unknown[]> = {
    'Transfer': queryKeys.requests.transfers(),
    'Member Info Change': queryKeys.requests.memberInfo(),
    'Officials Change': queryKeys.requests.officials(),
    'Councilor Change': queryKeys.requests.councilors(),
    'Member Add': queryKeys.requests.memberAdd(),
  };
  return queryKeyMap[requestType];
};

// Approve request mutation
export const useApproveRequest = (requestType: RequestType) => {
  const queryClient = useQueryClient();
  const { addToast } = useToast();

  return useMutation({
    mutationFn: async ({ requestId, remarks }: { requestId: number; remarks?: string }) => {
      return api.approveRequest(requestId, requestType, remarks);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: getQueryKeyForRequestType(requestType) });
      // Also invalidate my requests in case user is viewing their own
      queryClient.invalidateQueries({ queryKey: queryKeys.requests.all });
      addToast(`${requestType} request approved`, 'success');
    },
    onError: () => {
      addToast(`Failed to approve ${requestType.toLowerCase()} request`, 'error');
    },
  });
};

// Reject request mutation
export const useRejectRequest = (requestType: RequestType) => {
  const queryClient = useQueryClient();
  const { addToast } = useToast();

  return useMutation({
    mutationFn: async ({ requestId, remarks }: { requestId: number; remarks?: string }) => {
      return api.rejectRequest(requestId, requestType, remarks);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: getQueryKeyForRequestType(requestType) });
      queryClient.invalidateQueries({ queryKey: queryKeys.requests.all });
      addToast(`${requestType} request rejected`, 'success');
    },
    onError: () => {
      addToast(`Failed to reject ${requestType.toLowerCase()} request`, 'error');
    },
  });
};

// Revert request mutation
export const useRevertRequest = (requestType: RequestType) => {
  const queryClient = useQueryClient();
  const { addToast } = useToast();

  return useMutation({
    mutationFn: async ({ requestId, remarks }: { requestId: number; remarks?: string }) => {
      return api.revertRequest(requestId, requestType, remarks);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: getQueryKeyForRequestType(requestType) });
      queryClient.invalidateQueries({ queryKey: queryKeys.requests.all });
      addToast(`${requestType} request reverted`, 'success');
    },
    onError: () => {
      addToast(`Failed to revert ${requestType.toLowerCase()} request`, 'error');
    },
  });
};

// Combined hook for request actions (approve, reject, revert)
export const useRequestActions = (requestType: RequestType) => {
  const approveMutation = useApproveRequest(requestType);
  const rejectMutation = useRejectRequest(requestType);
  const revertMutation = useRevertRequest(requestType);

  return {
    approve: approveMutation,
    reject: rejectMutation,
    revert: revertMutation,
    isProcessing: approveMutation.isPending || rejectMutation.isPending || revertMutation.isPending,
  };
};


