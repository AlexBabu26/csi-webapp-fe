import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../services/api';
import { queryKeys } from '../../constants/queryKeys';
import { useToast } from '../../components/Toast';
import { getAuthToken } from '../../services/auth';

// ============ QUERIES ============

// Get individual events
export const useIndividualEvents = () => {
  return useQuery({
    queryKey: queryKeys.kalamela.events.individual(),
    queryFn: async () => {
      const response = await api.getIndividualEvents();
      return response.data;
    },
  });
};

// Get group events
export const useGroupEvents = () => {
  return useQuery({
    queryKey: queryKeys.kalamela.events.group(),
    queryFn: async () => {
      const response = await api.getGroupEvents();
      return response.data;
    },
  });
};

// Get all events (combined)
export const useAllEvents = () => {
  const individual = useIndividualEvents();
  const group = useGroupEvents();

  return {
    individualEvents: individual.data ?? [],
    groupEvents: group.data ?? [],
    isLoading: individual.isLoading || group.isLoading,
    error: individual.error || group.error,
    refetch: () => {
      individual.refetch();
      group.refetch();
    },
  };
};

// Get participants for an event
export const useEventParticipants = (eventId: number, eventType?: 'individual' | 'group') => {
  return useQuery({
    queryKey: queryKeys.kalamela.participants(eventId),
    queryFn: async () => {
      if (eventType === 'individual') {
        const response = await api.getIndividualEventParticipants(eventId);
        return response.data;
      } else {
        const response = await api.getGroupEventParticipants(eventId);
        return response.data;
      }
    },
    enabled: !!eventId && !!eventType,
  });
};

// Get all participants (for official view)
export const useAllParticipants = () => {
  return useQuery({
    queryKey: queryKeys.kalamela.allParticipants(),
    queryFn: async () => {
      const response = await api.getKalamelaParticipants();
      return response.data;
    },
  });
};

// Get Kalamela payments (admin)
export const useKalamelaPayments = () => {
  return useQuery({
    queryKey: queryKeys.kalamela.payments(),
    queryFn: async () => {
      const response = await api.getKalamelaAdminPayments();
      return response.data;
    },
  });
};

// Get Kalamela appeals
export const useKalamelaAppeals = () => {
  return useQuery({
    queryKey: queryKeys.kalamela.appeals(),
    queryFn: async () => {
      const response = await api.getKalamelaAppeals();
      return response.data;
    },
  });
};

// Get scores for an event
export const useEventScores = (eventId: number, eventType?: 'individual' | 'group') => {
  return useQuery({
    queryKey: queryKeys.kalamela.scores(eventId),
    queryFn: async () => {
      if (eventType === 'individual') {
        const response = await api.getIndividualEventScores(eventId);
        return response.data;
      } else {
        const response = await api.getGroupEventScores(eventId);
        return response.data;
      }
    },
    enabled: !!eventId && !!eventType,
  });
};

// Get Kalamela results
export const useKalamelaResults = () => {
  return useQuery({
    queryKey: queryKeys.kalamela.results(),
    queryFn: async () => {
      const response = await api.getKalamelaResults();
      return response.data;
    },
  });
};

// Get official home data
export const useKalamelaOfficialHome = () => {
  return useQuery({
    queryKey: queryKeys.kalamela.officialHome(),
    queryFn: async () => {
      const response = await api.getKalamelaOfficialHome();
      return response.data;
    },
  });
};

// ============ PARTICIPANT SELECTION QUERIES ============

// Get eligible members for individual event selection
export const useEligibleIndividualMembers = (eventId: number) => {
  return useQuery({
    queryKey: ['kalamela', 'eligibleMembers', 'individual', eventId],
    queryFn: async () => {
      const response = await api.selectIndividualEvent(eventId);
      return response.data;
    },
    enabled: !!eventId,
  });
};

// Get eligible members for group event selection
export const useEligibleGroupMembers = (eventId: number) => {
  return useQuery({
    queryKey: ['kalamela', 'eligibleMembers', 'group', eventId],
    queryFn: async () => {
      const response = await api.selectGroupEvent(eventId);
      return response.data;
    },
    enabled: !!eventId,
  });
};

// ============ SCORING QUERIES ============

// Get individual event scoring data
export const useIndividualEventScoring = (eventId: number) => {
  return useQuery({
    queryKey: ['kalamela', 'scoring', 'individual', eventId],
    queryFn: async () => {
      const response = await api.getIndividualEventForScoring(eventId);
      return response.data;
    },
    enabled: !!eventId,
  });
};

// Get group event scoring data
export const useGroupEventScoring = (eventId: number) => {
  return useQuery({
    queryKey: ['kalamela', 'scoring', 'group', eventId],
    queryFn: async () => {
      const response = await api.getGroupEventForScoring(eventId);
      return response.data;
    },
    enabled: !!eventId,
  });
};

// Get admin home data (for score management)
export const useKalamelaAdminHome = () => {
  return useQuery({
    queryKey: ['kalamela', 'adminHome'],
    queryFn: async () => {
      const response = await api.getKalamelaAdminHome();
      return response.data;
    },
  });
};

// Get admin individual scores
export const useAdminIndividualScores = () => {
  return useQuery({
    queryKey: ['kalamela', 'scores', 'individual', 'all'],
    queryFn: async () => {
      const response = await api.getAdminIndividualScores();
      return response.data;
    },
  });
};

// Get admin group scores
export const useAdminGroupScores = () => {
  return useQuery({
    queryKey: ['kalamela', 'scores', 'group', 'all'],
    queryFn: async () => {
      const response = await api.getAdminGroupScores();
      return response.data;
    },
  });
};

// ============ PAYMENT PREVIEW ============

// Get payment preview data
export const useKalamelaPaymentPreview = () => {
  return useQuery({
    queryKey: ['kalamela', 'paymentPreview'],
    queryFn: async () => {
      const response = await api.getKalamelaPaymentPreview();
      return response.data;
    },
  });
};

// ============ PUBLIC/RESULTS QUERIES ============

// Get public kalamela results
export const usePublicKalamelaResults = () => {
  return useQuery({
    queryKey: ['kalamela', 'publicResults'],
    queryFn: async () => {
      const response = await api.getPublicKalamelaResults();
      return response.data;
    },
    staleTime: 2 * 60 * 1000,
  });
};

// Get top performers
export const useKalamelaTopPerformers = () => {
  return useQuery({
    queryKey: ['kalamela', 'topPerformers'],
    queryFn: async () => {
      const response = await api.getKalamelaTopPerformers();
      return response.data;
    },
    staleTime: 2 * 60 * 1000,
  });
};

// Get print view data
export const useKalamelaPrintData = () => {
  return useQuery({
    queryKey: ['kalamela', 'printData'],
    queryFn: async () => {
      const response = await api.getKalamelaPrintData();
      return response.data;
    },
  });
};

// Get admin results
export const useKalamelaAdminResults = () => {
  return useQuery({
    queryKey: ['kalamela', 'adminResults'],
    queryFn: async () => {
      const response = await api.getKalamelaAdminResults();
      return response.data;
    },
  });
};

// ============ CATEGORY QUERIES ============

// Get all categories
export const useKalamelaCategories = () => {
  return useQuery({
    queryKey: queryKeys.kalamela.categories.list(),
    queryFn: async () => {
      const response = await api.getKalamelaCategories();
      return response.data;
    },
  });
};

// Get category by ID
export const useKalamelaCategoryById = (categoryId: number) => {
  return useQuery({
    queryKey: queryKeys.kalamela.categories.detail(categoryId),
    queryFn: async () => {
      const response = await api.getKalamelaCategoryById(categoryId);
      return response.data;
    },
    enabled: !!categoryId,
  });
};

// ============ CATEGORY MUTATIONS ============

// Create category
export const useCreateKalamelaCategory = () => {
  const queryClient = useQueryClient();
  const { addToast } = useToast();

  return useMutation({
    mutationFn: async (data: { name: string; description?: string }) => {
      return api.createKalamelaCategory(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.kalamela.categories.all() });
      addToast('Category created successfully', 'success');
    },
    onError: (error: any) => {
      addToast(error.message || 'Failed to create category', 'error');
    },
  });
};

// Update category
export const useUpdateKalamelaCategory = () => {
  const queryClient = useQueryClient();
  const { addToast } = useToast();

  return useMutation({
    mutationFn: async ({ categoryId, data }: { categoryId: number; data: { name?: string; description?: string } }) => {
      return api.updateKalamelaCategory(categoryId, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.kalamela.categories.all() });
      addToast('Category updated successfully', 'success');
    },
    onError: (error: any) => {
      addToast(error.message || 'Failed to update category', 'error');
    },
  });
};

// Delete category
export const useDeleteKalamelaCategory = () => {
  const queryClient = useQueryClient();
  const { addToast } = useToast();

  return useMutation({
    mutationFn: async (categoryId: number) => {
      return api.deleteKalamelaCategory(categoryId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.kalamela.categories.all() });
      addToast('Category deleted successfully', 'success');
    },
    onError: (error: any) => {
      addToast(error.message || 'Failed to delete category', 'error');
    },
  });
};

// ============ REGISTRATION FEE QUERIES ============

// Get all registration fees
export const useRegistrationFees = () => {
  return useQuery({
    queryKey: queryKeys.kalamela.registrationFees.list(),
    queryFn: async () => {
      const response = await api.getRegistrationFees();
      return response.data;
    },
  });
};

// Get registration fee by ID
export const useRegistrationFeeById = (feeId: number) => {
  return useQuery({
    queryKey: queryKeys.kalamela.registrationFees.detail(feeId),
    queryFn: async () => {
      const response = await api.getRegistrationFeeById(feeId);
      return response.data;
    },
    enabled: !!feeId,
  });
};

// ============ REGISTRATION FEE MUTATIONS ============

// Create registration fee
export const useCreateRegistrationFee = () => {
  const queryClient = useQueryClient();
  const { addToast } = useToast();

  return useMutation({
    mutationFn: async (data: { name: string; event_type: 'individual' | 'group'; amount: number }) => {
      return api.createRegistrationFee(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.kalamela.registrationFees.all() });
      addToast('Registration fee created successfully', 'success');
    },
    onError: (error: any) => {
      addToast(error.message || 'Failed to create registration fee', 'error');
    },
  });
};

// Update registration fee
export const useUpdateRegistrationFee = () => {
  const queryClient = useQueryClient();
  const { addToast } = useToast();

  return useMutation({
    mutationFn: async ({ feeId, data }: { feeId: number; data: { name?: string; event_type?: 'individual' | 'group'; amount?: number } }) => {
      return api.updateRegistrationFee(feeId, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.kalamela.registrationFees.all() });
      addToast('Registration fee updated successfully', 'success');
    },
    onError: (error: any) => {
      addToast(error.message || 'Failed to update registration fee', 'error');
    },
  });
};

// Delete registration fee
export const useDeleteRegistrationFee = () => {
  const queryClient = useQueryClient();
  const { addToast } = useToast();

  return useMutation({
    mutationFn: async (feeId: number) => {
      return api.deleteRegistrationFee(feeId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.kalamela.registrationFees.all() });
      addToast('Registration fee deleted successfully', 'success');
    },
    onError: (error: any) => {
      addToast(error.message || 'Failed to delete registration fee', 'error');
    },
  });
};

// ============ MUTATIONS ============

// Create individual event
export const useCreateIndividualEvent = () => {
  const queryClient = useQueryClient();
  const { addToast } = useToast();

  return useMutation({
    mutationFn: async (data: { name: string; description?: string; category_id?: number }) => {
      const token = getAuthToken();
      if (!token) throw new Error('Authentication required');
      
      return api.createAdminIndividualEvent(data, token);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.kalamela.events.individual() });
      addToast('Individual event created successfully', 'success');
    },
    onError: (error: any) => {
      addToast(error.message || 'Failed to create individual event', 'error');
    },
  });
};

// Create group event
export const useCreateGroupEvent = () => {
  const queryClient = useQueryClient();
  const { addToast } = useToast();

  return useMutation({
    mutationFn: async (data: { 
      name: string; 
      description?: string; 
      min_allowed_limit?: number; 
      max_allowed_limit?: number; 
      per_unit_allowed_limit?: number 
    }) => {
      const token = getAuthToken();
      if (!token) throw new Error('Authentication required');
      
      return api.createAdminGroupEvent(data, token);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.kalamela.events.group() });
      addToast('Group event created successfully', 'success');
    },
    onError: (error: any) => {
      addToast(error.message || 'Failed to create group event', 'error');
    },
  });
};

// Update individual event
export const useUpdateIndividualEvent = () => {
  const queryClient = useQueryClient();
  const { addToast } = useToast();

  return useMutation({
    mutationFn: async ({ eventId, data }: { eventId: number; data: { name?: string; description?: string; category_id?: number } }) => {
      return api.updateIndividualEvent(eventId, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.kalamela.events.individual() });
      addToast('Event updated successfully', 'success');
    },
    onError: () => {
      addToast('Failed to update event', 'error');
    },
  });
};

// Update group event
export const useUpdateGroupEvent = () => {
  const queryClient = useQueryClient();
  const { addToast } = useToast();

  return useMutation({
    mutationFn: async ({ eventId, data }: { 
      eventId: number; 
      data: { 
        name?: string; 
        description?: string; 
        min_allowed_limit?: number; 
        max_allowed_limit?: number; 
        per_unit_allowed_limit?: number 
      } 
    }) => {
      return api.updateGroupEvent(eventId, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.kalamela.events.group() });
      addToast('Event updated successfully', 'success');
    },
    onError: () => {
      addToast('Failed to update event', 'error');
    },
  });
};

// Delete individual event
export const useDeleteIndividualEvent = () => {
  const queryClient = useQueryClient();
  const { addToast } = useToast();

  return useMutation({
    mutationFn: async (eventId: number) => {
      return api.deleteEvent(eventId, 'INDIVIDUAL');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.kalamela.events.individual() });
      addToast('Event deleted successfully', 'success');
    },
    onError: () => {
      addToast('Failed to delete event', 'error');
    },
  });
};

// Delete group event
export const useDeleteGroupEvent = () => {
  const queryClient = useQueryClient();
  const { addToast } = useToast();

  return useMutation({
    mutationFn: async (eventId: number) => {
      return api.deleteEvent(eventId, 'GROUP');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.kalamela.events.group() });
      addToast('Event deleted successfully', 'success');
    },
    onError: () => {
      addToast('Failed to delete event', 'error');
    },
  });
};

// Approve Kalamela payment
export const useApproveKalamelaPayment = () => {
  const queryClient = useQueryClient();
  const { addToast } = useToast();

  return useMutation({
    mutationFn: async (paymentId: number) => {
      return api.approveKalamelaPayment(paymentId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.kalamela.payments() });
      addToast('Payment approved successfully', 'success');
    },
    onError: (error: any) => {
      addToast(error.message || 'Failed to approve payment', 'error');
    },
  });
};

// Decline Kalamela payment
export const useDeclineKalamelaPayment = () => {
  const queryClient = useQueryClient();
  const { addToast } = useToast();

  return useMutation({
    mutationFn: async ({ paymentId, reason }: { paymentId: number; reason: string }) => {
      return api.declineKalamelaPayment(paymentId, reason);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.kalamela.payments() });
      addToast('Payment declined', 'success');
    },
    onError: (error: any) => {
      addToast(error.message || 'Failed to decline payment', 'error');
    },
  });
};

// Resolve Kalamela appeal
export const useResolveKalamelaAppeal = () => {
  const queryClient = useQueryClient();
  const { addToast } = useToast();

  return useMutation({
    mutationFn: async ({ appealId, reply }: { appealId: number; reply: string }) => {
      return api.resolveKalamelaAppeal(appealId, reply);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.kalamela.appeals() });
      addToast('Appeal resolved', 'success');
    },
    onError: (error: any) => {
      addToast(error.message || 'Failed to resolve appeal', 'error');
    },
  });
};

// Register participant for individual event
export const useRegisterIndividualParticipant = () => {
  const queryClient = useQueryClient();
  const { addToast } = useToast();

  return useMutation({
    mutationFn: async ({ eventId, memberId }: { eventId: number; memberId: number }) => {
      return api.registerIndividualParticipant(eventId, memberId);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.kalamela.participants(variables.eventId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.kalamela.allParticipants() });
      queryClient.invalidateQueries({ queryKey: queryKeys.kalamela.officialHome() });
      addToast('Participant registered successfully', 'success');
    },
    onError: (error: any) => {
      addToast(error.message || 'Failed to register participant', 'error');
    },
  });
};

// Add individual participant (for selection page)
export const useAddIndividualParticipant = () => {
  const queryClient = useQueryClient();
  const { addToast } = useToast();

  return useMutation({
    mutationFn: async (data: { individual_event_id: number; participant_id: number; seniority_category: string }) => {
      return api.addIndividualParticipant(data);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['kalamela', 'eligibleMembers', 'individual', variables.individual_event_id] });
      queryClient.invalidateQueries({ queryKey: queryKeys.kalamela.officialHome() });
      addToast('Participant added successfully', 'success');
    },
    onError: (error: any) => {
      addToast(error.message || 'Failed to add participant', 'error');
    },
  });
};

// Add group participants (for selection page)
export const useAddGroupParticipants = () => {
  const queryClient = useQueryClient();
  const { addToast } = useToast();

  return useMutation({
    mutationFn: async (data: { group_event_id: number; participant_ids: number[] }) => {
      return api.addGroupParticipants(data);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['kalamela', 'eligibleMembers', 'group', variables.group_event_id] });
      queryClient.invalidateQueries({ queryKey: queryKeys.kalamela.officialHome() });
      addToast('Team registered successfully', 'success');
    },
    onError: (error: any) => {
      addToast(error.message || 'Failed to register team', 'error');
    },
  });
};

// Submit kalamela payment
export const useSubmitKalamelaPayment = () => {
  const queryClient = useQueryClient();
  const { addToast } = useToast();

  return useMutation({
    mutationFn: async (data: { amount: number; payment_reference?: string; proof?: File }) => {
      return api.submitKalamelaPayment(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kalamela', 'paymentPreview'] });
      queryClient.invalidateQueries({ queryKey: queryKeys.kalamela.officialHome() });
      addToast('Payment submitted successfully', 'success');
    },
    onError: (error: any) => {
      addToast(error.message || 'Failed to submit payment', 'error');
    },
  });
};

// Register participants for group event
export const useRegisterGroupParticipants = () => {
  const queryClient = useQueryClient();
  const { addToast } = useToast();

  return useMutation({
    mutationFn: async ({ eventId, memberIds }: { eventId: number; memberIds: number[] }) => {
      return api.registerGroupParticipants(eventId, memberIds);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.kalamela.participants(variables.eventId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.kalamela.allParticipants() });
      queryClient.invalidateQueries({ queryKey: queryKeys.kalamela.officialHome() });
      addToast('Team registered successfully', 'success');
    },
    onError: (error: any) => {
      addToast(error.message || 'Failed to register team', 'error');
    },
  });
};

// Remove participant (individual or group)
export const useRemoveParticipant = () => {
  const queryClient = useQueryClient();
  const { addToast } = useToast();

  return useMutation({
    mutationFn: async ({ participantId, eventId, eventType }: { 
      participantId: number; 
      eventId: number;
      eventType: 'individual' | 'group';
    }) => {
      if (eventType === 'individual') {
        return api.removeIndividualParticipant(participantId);
      } else {
        return api.removeGroupParticipant(participantId);
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.kalamela.participants(variables.eventId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.kalamela.allParticipants() });
      queryClient.invalidateQueries({ queryKey: queryKeys.kalamela.officialHome() });
      queryClient.invalidateQueries({ queryKey: ['kalamela', 'participants'] });
      addToast('Participant removed successfully', 'success');
    },
    onError: (error: any) => {
      addToast(error.message || 'Failed to remove participant', 'error');
    },
  });
};

// Submit scores
export const useSubmitScores = () => {
  const queryClient = useQueryClient();
  const { addToast } = useToast();

  return useMutation({
    mutationFn: async ({ eventId, eventType, scores }: { eventId: number; eventType: 'individual' | 'group'; scores: any[] }) => {
      if (eventType === 'individual') {
        return api.submitIndividualEventScores(eventId, scores);
      } else {
        return api.submitGroupEventScores(eventId, scores);
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.kalamela.scores(variables.eventId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.kalamela.results() });
      addToast('Scores submitted successfully', 'success');
    },
    onError: (error: any) => {
      addToast(error.message || 'Failed to submit scores', 'error');
    },
  });
};

// ============ KALAMELA RULES QUERIES ============

// Get all rules grouped by category
export const useKalamelaRulesGrouped = () => {
  return useQuery({
    queryKey: ['kalamela', 'rules', 'grouped'],
    queryFn: async () => {
      return await api.getKalamelaRulesGrouped();
    },
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });
};

// Get all rules as list
export const useKalamelaRules = (params?: {
  category?: 'age_restriction' | 'participation_limit' | 'fee';
  active_only?: boolean;
}) => {
  return useQuery({
    queryKey: ['kalamela', 'rules', 'list', params],
    queryFn: async () => {
      return await api.getKalamelaRules(params);
    },
  });
};

// Get single rule by ID
export const useKalamelaRuleById = (ruleId: number) => {
  return useQuery({
    queryKey: ['kalamela', 'rules', 'detail', ruleId],
    queryFn: async () => {
      return await api.getKalamelaRuleById(ruleId);
    },
    enabled: !!ruleId,
  });
};

// ============ KALAMELA RULES MUTATIONS ============

// Update rule
export const useUpdateKalamelaRule = () => {
  const queryClient = useQueryClient();
  const { addToast } = useToast();

  return useMutation({
    mutationFn: async ({ ruleId, data }: { 
      ruleId: number; 
      data: { rule_value?: string; display_name?: string; description?: string; is_active?: boolean } 
    }) => {
      return api.updateKalamelaRule(ruleId, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kalamela', 'rules'] });
      addToast('Rule updated successfully', 'success');
    },
    onError: (error: any) => {
      addToast(error.message || 'Failed to update rule', 'error');
    },
  });
};

// Create rule
export const useCreateKalamelaRule = () => {
  const queryClient = useQueryClient();
  const { addToast } = useToast();

  return useMutation({
    mutationFn: async (data: {
      rule_key: string;
      rule_category: 'age_restriction' | 'participation_limit' | 'fee';
      rule_value: string;
      display_name: string;
      description?: string;
      is_active?: boolean;
    }) => {
      return api.createKalamelaRule(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kalamela', 'rules'] });
      addToast('Rule created successfully', 'success');
    },
    onError: (error: any) => {
      addToast(error.message || 'Failed to create rule', 'error');
    },
  });
};

// Delete rule
export const useDeleteKalamelaRule = () => {
  const queryClient = useQueryClient();
  const { addToast } = useToast();

  return useMutation({
    mutationFn: async (ruleId: number) => {
      return api.deleteKalamelaRule(ruleId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kalamela', 'rules'] });
      addToast('Rule deleted successfully', 'success');
    },
    onError: (error: any) => {
      addToast(error.message || 'Failed to delete rule', 'error');
    },
  });
};

// ============ DISTRICT MEMBERS QUERIES ============

// Get all district members for participant selection
export const useDistrictMembers = (params?: {
  event_id?: number;
  event_type?: 'individual' | 'group';
  unit_id?: number;
  participation_category?: 'Junior' | 'Senior' | 'Ineligible';
  search?: string;
}) => {
  return useQuery({
    queryKey: ['kalamela', 'districtMembers', params],
    queryFn: async () => {
      return await api.getDistrictMembers(params);
    },
  });
};

