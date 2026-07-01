import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../services/api';
import { queryKeys } from '../../constants/queryKeys';
import { unitRegistrationKeys } from './useUnitRegistration';
import { useToast } from '../../components/Toast';
import { ResidenceLocation } from '../../types';

// ============ QUERIES ============

// Dashboard data - stats
export const useUnitStats = () => {
  return useQuery({
    queryKey: queryKeys.units.stats(),
    queryFn: async () => {
      const response = await api.getUnitStats();
      return response.data;
    },
  });
};

// All units
export const useUnits = () => {
  return useQuery({
    queryKey: queryKeys.units.list(),
    queryFn: async () => {
      const response = await api.getUnits();
      return response.data;
    },
  });
};

export const useCompleteUnitRegistration = () => {
  const queryClient = useQueryClient();
  const { addToast } = useToast();

  return useMutation({
    mutationFn: (userId: number) => api.completeUnitRegistration(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.units.list() });
      queryClient.invalidateQueries({ queryKey: queryKeys.units.stats() });
      addToast('Registration marked as completed', 'success');
    },
    onError: (error: Error) => {
      addToast(error.message || 'Failed to complete registration', 'error');
    },
  });
};

// Master-list units without platform accounts
export const useNotOnboardedUnits = () => {
  return useQuery({
    queryKey: queryKeys.units.notOnboarded(),
    queryFn: async () => {
      const response = await api.getNotOnboardedUnits();
      return response.data;
    },
  });
};

// District chart data
export const useDistrictChartData = () => {
  return useQuery({
    queryKey: queryKeys.districts.chartData(),
    queryFn: async () => {
      const response = await api.getDistrictWiseData();
      return response.data;
    },
  });
};

export const useRefreshDashboard = () => {
  const queryClient = useQueryClient();
  const { addToast } = useToast();

  return useMutation({
    mutationFn: async () => {
      const [statsResponse, chartResponse] = await Promise.all([
        api.getUnitStats({ refresh: true }),
        api.getDistrictWiseData({ refresh: true }),
      ]);
      return { stats: statsResponse.data, chartData: chartResponse.data };
    },
    onSuccess: ({ stats, chartData }) => {
      queryClient.setQueryData(queryKeys.units.stats(), stats);
      queryClient.setQueryData(queryKeys.districts.chartData(), chartData);
      queryClient.invalidateQueries({ queryKey: queryKeys.units.list() });
      addToast('Dashboard refreshed', 'success');
    },
    onError: (error: Error) => {
      addToast(error.message || 'Failed to refresh dashboard', 'error');
    },
  });
};

// Combined dashboard hook for parallel fetching
export const useDashboardData = () => {
  const stats = useUnitStats();
  const units = useUnits();
  const districtData = useDistrictChartData();
  const refreshDashboard = useRefreshDashboard();

  return {
    stats: stats.data,
    units: units.data ?? [],
    chartData: districtData.data?.chartData ?? [],
    districtDetails: districtData.data?.districtDetails ?? [],
    isLoading: stats.isLoading || units.isLoading || districtData.isLoading,
    isRefreshing: refreshDashboard.isPending,
    refreshDashboard: refreshDashboard.mutate,
    error: stats.error || units.error || districtData.error,
  };
};

// Individual unit detail
export const useUnitDetail = (unitId: number) => {
  return useQuery({
    queryKey: queryKeys.units.detail(unitId),
    queryFn: async () => {
      const response = await api.getUnitById(unitId);
      return response.data;
    },
    enabled: !!unitId,
  });
};

// Unit officials by unit id
export const useUnitOfficials = (unitId?: number) => {
  return useQuery({
    queryKey: unitId ? queryKeys.officials.byUnit(unitId) : queryKeys.officials.list(),
    queryFn: async () => {
      const response = await api.getUnitOfficials(unitId);
      return response.data;
    },
    enabled: unitId === undefined || !!unitId,
  });
};

// All officials
export const useOfficials = () => {
  return useQuery({
    queryKey: queryKeys.officials.list(),
    queryFn: async () => {
      const response = await api.getUnitOfficials();
      return response.data;
    },
  });
};

// Unit councilors by unit id
export const useUnitCouncilors = (unitId?: number) => {
  return useQuery({
    queryKey: unitId ? queryKeys.councilors.byUnit(unitId) : queryKeys.councilors.list(),
    queryFn: async () => {
      const response = await api.getUnitCouncilors(unitId);
      return response.data;
    },
    enabled: unitId === undefined || !!unitId,
  });
};

// All councilors
export const useCouncilors = () => {
  return useQuery({
    queryKey: queryKeys.councilors.list(),
    queryFn: async () => {
      const response = await api.getUnitCouncilors();
      return response.data;
    },
  });
};

// Members
export const useMembers = (
  unitId?: number,
  options?: {
    residenceLocation?: ResidenceLocation;
    missingResidenceLocation?: boolean;
    search?: string;
  },
) => {
  const { residenceLocation, missingResidenceLocation, search } = options ?? {};
  const normalizedSearch = search?.trim() || '';
  return useQuery({
    queryKey: unitId
      ? [...queryKeys.members.byUnit(unitId), residenceLocation ?? 'all', missingResidenceLocation ?? false, normalizedSearch]
      : [...queryKeys.members.list(), residenceLocation ?? 'all', missingResidenceLocation ?? false, normalizedSearch],
    queryFn: async () => {
      const response = await api.getUnitMembers(
        unitId,
        residenceLocation,
        missingResidenceLocation,
        normalizedSearch || undefined,
      );
      return response.data;
    },
    enabled: unitId === undefined || !!unitId,
    staleTime: normalizedSearch ? 0 : 30_000,
    gcTime: normalizedSearch ? 60_000 : 5 * 60_000,
  });
};

// Archived members
export const useArchivedMembers = () => {
  return useQuery({
    queryKey: queryKeys.members.archived(),
    queryFn: async () => {
      const response = await api.getArchivedMembers();
      return response.data;
    },
    staleTime: 0,
    refetchOnMount: true,
  });
};

// Clergy districts
export const useClergyDistricts = () => {
  return useQuery({
    queryKey: queryKeys.districts.list(),
    queryFn: async () => {
      const response = await api.getClergyDistricts();
      return response.data;
    },
    staleTime: 30 * 60 * 1000, // 30 min - districts rarely change
  });
};

// Combined unit detail hook for ViewIndividualUnit page
export const useUnitDetailFull = (unitId: number) => {
  const query = useQuery({
    queryKey: [...queryKeys.units.detail(unitId), 'full'],
    queryFn: async () => {
      const response = await api.getAdminUnitFullDetail(unitId);
      return response.data;
    },
    enabled: !!unitId,
  });

  return {
    unit: query.data?.unit,
    official: query.data?.official ?? null,
    councilors: query.data?.councilors ?? [],
    members: query.data?.members ?? [],
    unitRegistrationFee: query.data?.unitRegistrationFee ?? 100,
    unitMemberFee: query.data?.unitMemberFee ?? 10,
    totalAmount: query.data?.totalAmount ?? 0,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
};

// ============ MUTATIONS ============

// Archive member
export const useArchiveMember = () => {
  const queryClient = useQueryClient();
  const { addToast } = useToast();

  return useMutation({
    mutationFn: async ({ memberId, reason }: { memberId: number; reason?: string }) => {
      return api.archiveMember(memberId, reason);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.members.all });
      addToast('Member archived successfully', 'success');
    },
    onError: () => {
      addToast('Failed to archive member', 'error');
    },
  });
};

// Remove member (admin delete with mandatory reason)
export const useRemoveUnitMember = () => {
  const queryClient = useQueryClient();
  const { addToast } = useToast();

  return useMutation({
    mutationFn: async ({
      memberId,
      reason,
      confirmNotArchival,
    }: {
      memberId: number;
      reason: string;
      confirmNotArchival?: boolean;
    }) => api.removeUnitMember(memberId, reason, confirmNotArchival),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.members.all });
      queryClient.invalidateQueries({ queryKey: unitRegistrationKeys.paymentStatus() });
      queryClient.invalidateQueries({ queryKey: [...unitRegistrationKeys.all, 'adminPayments'] });
      addToast('Member removed successfully', 'success');
    },
    onError: (error: Error) => {
      addToast(error.message || 'Failed to remove member', 'error');
    },
  });
};

// Bulk remove members (admin delete with mandatory reason)
export const useBulkRemoveUnitMembers = () => {
  const queryClient = useQueryClient();
  const { addToast } = useToast();

  return useMutation({
    mutationFn: (payload: {
      member_ids: number[];
      reason: string;
      confirm_not_archival?: boolean;
    }) => api.bulkRemoveUnitMembers(payload),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.members.all });
      queryClient.invalidateQueries({ queryKey: unitRegistrationKeys.paymentStatus() });
      queryClient.invalidateQueries({ queryKey: [...unitRegistrationKeys.all, 'adminPayments'] });
      const count = (res as any)?.data?.removed_count ?? '?';
      addToast(`${count} member(s) removed successfully`, 'success');
    },
    onError: (error: Error) => {
      addToast(error.message || 'Failed to remove members', 'error');
    },
  });
};

// Restore member
export const useRestoreMember = () => {
  const queryClient = useQueryClient();
  const { addToast } = useToast();

  return useMutation({
    mutationFn: async (memberId: number) => {
      return api.restoreMember(memberId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.members.all });
      addToast('Member restored successfully', 'success');
    },
    onError: () => {
      addToast('Failed to restore member', 'error');
    },
  });
};

// Archive preview — members eligible for yearly archiving
export const useArchivePreview = () => {
  return useQuery({
    queryKey: [...queryKeys.members.all, 'archive-preview'],
    queryFn: () => api.getArchivePreview(),
    staleTime: 2 * 60 * 1000, // 2 min
  });
};

// All unit names for filter dropdowns
export const useAdminUnitNames = () => {
  return useQuery({
    queryKey: ['admin', 'unit-names-for-filter'],
    queryFn: () => api.getAdminUnitNames(),
    staleTime: 5 * 60 * 1000,
  });
};

// All districts for filter dropdowns
export const useAdminDistricts = () => {
  return useQuery({
    queryKey: ['admin', 'districts-for-filter'],
    queryFn: () => api.getAdminDistricts(),
    staleTime: 5 * 60 * 1000,
  });
};

// Bulk archive mutation
export const useBulkArchive = () => {
  const queryClient = useQueryClient();
  const { addToast } = useToast();

  return useMutation({
    mutationFn: (payload: { member_ids: number[]; archive_year: string; archive_reason?: string }) =>
      api.bulkArchiveMembers(payload),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.members.all });
      const count = (res as any)?.data?.archived_count ?? '?';
      addToast(`${count} member(s) archived successfully`, 'success');
    },
    onError: () => {
      addToast('Failed to archive members', 'error');
    },
  });
};


