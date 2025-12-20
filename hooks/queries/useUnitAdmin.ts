import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../services/api';
import { queryKeys } from '../../constants/queryKeys';
import { useToast } from '../../components/Toast';

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

// Combined dashboard hook for parallel fetching
export const useDashboardData = () => {
  const stats = useUnitStats();
  const units = useUnits();
  const chartData = useDistrictChartData();

  return {
    stats: stats.data,
    units: units.data ?? [],
    chartData: chartData.data ?? [],
    isLoading: stats.isLoading || units.isLoading || chartData.isLoading,
    error: stats.error || units.error || chartData.error,
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
export const useMembers = (unitId?: number) => {
  return useQuery({
    queryKey: unitId ? queryKeys.members.byUnit(unitId) : queryKeys.members.list(),
    queryFn: async () => {
      const response = await api.getUnitMembers(unitId);
      return response.data;
    },
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
  const unit = useUnitDetail(unitId);
  const officials = useUnitOfficials(unitId);
  const councilors = useUnitCouncilors(unitId);
  const members = useMembers(unitId);

  return {
    unit: unit.data,
    official: officials.data?.[0] || null,
    councilors: councilors.data ?? [],
    members: members.data ?? [],
    isLoading: unit.isLoading || officials.isLoading || councilors.isLoading || members.isLoading,
    error: unit.error || officials.error || councilors.error || members.error,
    refetch: () => {
      unit.refetch();
      officials.refetch();
      councilors.refetch();
      members.refetch();
    },
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


