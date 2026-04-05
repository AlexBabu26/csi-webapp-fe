import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../../constants/queryKeys';
import { ymUser, ymAdmin, ymAuth } from '../../services/yuvalokham-api';
import { setYMTokens, clearYMAuth } from '../../services/yuvalokham-auth';
import {
  YMLoginForm, YMRegisterForm, YMProfileUpdateForm, YMComplaintForm,
  YMPlanForm, YMMagazineForm, YMAdminCreateForm,
} from '../../types';

// ==================== AUTH ====================
export const useYMLogin = () => {
  return useMutation({
    mutationFn: (data: YMLoginForm) => ymAuth.login(data),
    onSuccess: (data) => setYMTokens(data),
  });
};

export const useYMRegister = () => {
  return useMutation({ mutationFn: (data: YMRegisterForm) => ymAuth.register(data) });
};

export const useYMLogout = () => {
  const qc = useQueryClient();
  return () => { clearYMAuth(); qc.removeQueries({ queryKey: queryKeys.yuvalokham.all }); };
};

// ==================== USER QUERIES ====================
export const useYMProfile = () =>
  useQuery({ queryKey: queryKeys.yuvalokham.profile(), queryFn: ymUser.getProfile });

export const useYMPlans = () =>
  useQuery({ queryKey: queryKeys.yuvalokham.plans(), queryFn: ymUser.getPlans });

export const useYMActiveSubscription = () =>
  useQuery({ queryKey: queryKeys.yuvalokham.activeSub(), queryFn: ymUser.getActiveSubscription });

export const useYMSubscriptions = (skip = 0, limit = 20) =>
  useQuery({ queryKey: queryKeys.yuvalokham.subscriptions(skip), queryFn: () => ymUser.getSubscriptions(skip, limit) });

export const useYMQrCode = () =>
  useQuery({ queryKey: queryKeys.yuvalokham.qrCode(), queryFn: ymUser.getQrCode });

export const useYMPayments = (skip = 0, limit = 20) =>
  useQuery({ queryKey: queryKeys.yuvalokham.payments(skip), queryFn: () => ymUser.getPayments(skip, limit) });

export const useYMMagazines = () =>
  useQuery({ queryKey: queryKeys.yuvalokham.magazines(), queryFn: ymUser.getMagazines });

export const useYMMagazineDetail = (id: number) =>
  useQuery({ queryKey: queryKeys.yuvalokham.magazineDetail(id), queryFn: () => ymUser.getMagazine(id), enabled: !!id });

export const useYMComplaints = (skip = 0, limit = 20) =>
  useQuery({ queryKey: queryKeys.yuvalokham.complaints(skip), queryFn: () => ymUser.getComplaints(skip, limit) });

// ==================== USER MUTATIONS ====================
export const useYMUpdateProfile = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: YMProfileUpdateForm) => ymUser.updateProfile(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.yuvalokham.profile() }),
  });
};

export const useYMSubscribe = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (planId: number) => ymUser.subscribe(planId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.yuvalokham.activeSub() });
      qc.invalidateQueries({ queryKey: queryKeys.yuvalokham.subscriptions() });
    },
  });
};

export const useYMSubmitPayment = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ subscriptionId, proof }: { subscriptionId: number; proof: File }) =>
      ymUser.submitPayment(subscriptionId, proof),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.yuvalokham.payments() });
      qc.invalidateQueries({ queryKey: queryKeys.yuvalokham.activeSub() });
    },
  });
};

export const useYMCreateComplaint = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: YMComplaintForm) => ymUser.createComplaint(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.yuvalokham.complaints() }),
  });
};

// ==================== ADMIN QUERIES ====================
export const useYMAdminUsers = (filters?: { search?: string; is_active?: boolean; district_id?: number; skip?: number; limit?: number }) =>
  useQuery({ queryKey: queryKeys.yuvalokham.admin.users(filters), queryFn: () => ymAdmin.getUsers(filters) });

export const useYMAdminUserDetail = (id: number) =>
  useQuery({ queryKey: queryKeys.yuvalokham.admin.userDetail(id), queryFn: () => ymAdmin.getUser(id), enabled: !!id });

export const useYMAdminPlans = () =>
  useQuery({ queryKey: queryKeys.yuvalokham.admin.plans(), queryFn: ymAdmin.getPlans });

export const useYMAdminSubscriptions = (filters?: { status?: string; plan_id?: number; user_id?: number; skip?: number; limit?: number }) =>
  useQuery({ queryKey: queryKeys.yuvalokham.admin.subscriptions(filters), queryFn: () => ymAdmin.getSubscriptions(filters) });

export const useYMAdminPayments = (filters?: { status?: string; skip?: number; limit?: number }) =>
  useQuery({ queryKey: queryKeys.yuvalokham.admin.payments(filters), queryFn: () => ymAdmin.getPayments(filters) });

export const useYMAdminMagazines = (status?: string) =>
  useQuery({ queryKey: queryKeys.yuvalokham.admin.magazines(status), queryFn: () => ymAdmin.getMagazines(status) });

export const useYMAdminComplaints = (filters?: { status?: string; category?: string; skip?: number; limit?: number }) =>
  useQuery({ queryKey: queryKeys.yuvalokham.admin.complaints(filters), queryFn: () => ymAdmin.getComplaints(filters) });

export const useYMAdminQrSettings = () =>
  useQuery({ queryKey: queryKeys.yuvalokham.admin.qrSettings(), queryFn: ymAdmin.getQrSettings });

export const useYMAdminSummary = () =>
  useQuery({ queryKey: queryKeys.yuvalokham.admin.summary(), queryFn: ymAdmin.getSummary });

export const useYMAdminTrends = (months = 12) =>
  useQuery({ queryKey: queryKeys.yuvalokham.admin.trends(months), queryFn: () => ymAdmin.getTrends(months) });

export const useYMAdminBreakdowns = () =>
  useQuery({ queryKey: queryKeys.yuvalokham.admin.breakdowns(), queryFn: ymAdmin.getBreakdowns });

export const useYMAdminExpiring = (days = 30) =>
  useQuery({ queryKey: queryKeys.yuvalokham.admin.expiring(days), queryFn: () => ymAdmin.getExpiring(days) });

// ==================== ADMIN MUTATIONS ====================
export const useYMAdminUpdateUser = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<{ name: string; is_active: boolean }> }) => ymAdmin.updateUser(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.yuvalokham.admin.users() }),
  });
};

export const useYMAdminResetPassword = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, newPassword }: { userId: number; newPassword: string }) => ymAdmin.resetUserPassword(userId, newPassword),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.yuvalokham.admin.users() }),
  });
};

export const useYMAdminCreateAdmin = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: YMAdminCreateForm) => ymAdmin.createAdmin(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.yuvalokham.admin.users() }),
  });
};

export const useYMAdminCreatePlan = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: YMPlanForm) => ymAdmin.createPlan(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.yuvalokham.admin.plans() }),
  });
};

export const useYMAdminUpdatePlan = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<YMPlanForm> }) => ymAdmin.updatePlan(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.yuvalokham.admin.plans() }),
  });
};

export const useYMAdminTogglePlan = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => ymAdmin.togglePlan(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.yuvalokham.admin.plans() }),
  });
};

export const useYMAdminApprovePayment = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => ymAdmin.approvePayment(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.yuvalokham.admin.payments() }),
  });
};

export const useYMAdminRejectPayment = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, remarks }: { id: number; remarks: string }) => ymAdmin.rejectPayment(id, remarks),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.yuvalokham.admin.payments() }),
  });
};

export const useYMAdminCreateMagazine = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: YMMagazineForm) => ymAdmin.createMagazine(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.yuvalokham.admin.magazines() }),
  });
};

export const useYMAdminUpdateMagazine = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<YMMagazineForm> }) => ymAdmin.updateMagazine(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.yuvalokham.admin.magazines() }),
  });
};

export const useYMAdminUploadMagazineFiles = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, files }: { id: number; files: { cover?: File; pdf?: File } }) => ymAdmin.uploadMagazineFiles(id, files),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.yuvalokham.admin.magazines() }),
  });
};

export const useYMAdminPublishMagazine = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => ymAdmin.publishMagazine(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.yuvalokham.admin.magazines() }),
  });
};

export const useYMAdminDeleteMagazine = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => ymAdmin.deleteMagazine(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.yuvalokham.admin.magazines() }),
  });
};

export const useYMAdminRespondComplaint = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, response }: { id: number; response: string }) => ymAdmin.respondComplaint(id, response),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.yuvalokham.admin.complaints() }),
  });
};

export const useYMAdminCloseComplaint = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => ymAdmin.closeComplaint(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.yuvalokham.admin.complaints() }),
  });
};

export const useYMAdminUpdateQrSettings = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { qr_image?: File; description?: string }) => ymAdmin.updateQrSettings(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.yuvalokham.admin.qrSettings() }),
  });
};
