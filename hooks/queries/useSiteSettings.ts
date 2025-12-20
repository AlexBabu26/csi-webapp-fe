import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../services/api';
import { queryKeys } from '../../constants/queryKeys';
import { useToast } from '../../components/Toast';
import { SiteSettingsUpdate, NoticeCreate, NoticeUpdate, QuickLinkCreate, QuickLinkUpdate } from '../../types';

// ============ QUERIES ============

// Get site settings
export const useSiteSettings = () => {
  return useQuery({
    queryKey: queryKeys.siteSettings.settings(),
    queryFn: async () => {
      const data = await api.getSiteSettings();
      return data;
    },
  });
};

// Get notices
export const useNotices = () => {
  return useQuery({
    queryKey: queryKeys.siteSettings.notices(),
    queryFn: async () => {
      const data = await api.getNotices();
      return data;
    },
  });
};

// Get quick links
export const useQuickLinks = () => {
  return useQuery({
    queryKey: queryKeys.siteSettings.quickLinks(),
    queryFn: async () => {
      const data = await api.getQuickLinks();
      return data;
    },
  });
};

// Combined hook for all site settings data
export const useSiteSettingsData = () => {
  const settings = useSiteSettings();
  const notices = useNotices();
  const quickLinks = useQuickLinks();

  return {
    settings: settings.data,
    notices: notices.data ?? [],
    quickLinks: quickLinks.data ?? [],
    isLoading: settings.isLoading || notices.isLoading || quickLinks.isLoading,
    error: settings.error || notices.error || quickLinks.error,
    refetch: () => {
      settings.refetch();
      notices.refetch();
      quickLinks.refetch();
    },
  };
};

// ============ MUTATIONS ============

// Update site settings
export const useUpdateSiteSettings = () => {
  const queryClient = useQueryClient();
  const { addToast } = useToast();

  return useMutation({
    mutationFn: async (data: SiteSettingsUpdate) => {
      return api.updateSiteSettings(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.siteSettings.settings() });
      addToast('Settings saved successfully', 'success');
    },
    onError: () => {
      addToast('Failed to save settings', 'error');
    },
  });
};

// Upload logo
export const useUploadLogo = () => {
  const queryClient = useQueryClient();
  const { addToast } = useToast();

  return useMutation({
    mutationFn: async ({ type, file }: { type: 'primary' | 'secondary' | 'tertiary'; file: File }) => {
      return api.uploadLogo(type, file);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.siteSettings.settings() });
      addToast(`${variables.type} logo uploaded successfully`, 'success');
    },
    onError: () => {
      addToast('Failed to upload logo', 'error');
    },
  });
};

// Create notice
export const useCreateNotice = () => {
  const queryClient = useQueryClient();
  const { addToast } = useToast();

  return useMutation({
    mutationFn: async (data: NoticeCreate) => {
      return api.createNotice(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.siteSettings.notices() });
      addToast('Notice created', 'success');
    },
    onError: () => {
      addToast('Failed to create notice', 'error');
    },
  });
};

// Update notice
export const useUpdateNotice = () => {
  const queryClient = useQueryClient();
  const { addToast } = useToast();

  return useMutation({
    mutationFn: async ({ noticeId, data }: { noticeId: number; data: NoticeUpdate }) => {
      return api.updateNotice(noticeId, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.siteSettings.notices() });
      addToast('Notice updated', 'success');
    },
    onError: () => {
      addToast('Failed to update notice', 'error');
    },
  });
};

// Delete notice
export const useDeleteNotice = () => {
  const queryClient = useQueryClient();
  const { addToast } = useToast();

  return useMutation({
    mutationFn: async (noticeId: number) => {
      return api.deleteNotice(noticeId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.siteSettings.notices() });
      addToast('Notice deleted', 'success');
    },
    onError: () => {
      addToast('Failed to delete notice', 'error');
    },
  });
};

// Create quick link
export const useCreateQuickLink = () => {
  const queryClient = useQueryClient();
  const { addToast } = useToast();

  return useMutation({
    mutationFn: async (data: QuickLinkCreate) => {
      return api.createQuickLink(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.siteSettings.quickLinks() });
      addToast('Quick link created', 'success');
    },
    onError: () => {
      addToast('Failed to create quick link', 'error');
    },
  });
};

// Update quick link
export const useUpdateQuickLink = () => {
  const queryClient = useQueryClient();
  const { addToast } = useToast();

  return useMutation({
    mutationFn: async ({ linkId, data }: { linkId: number; data: QuickLinkUpdate }) => {
      return api.updateQuickLink(linkId, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.siteSettings.quickLinks() });
      addToast('Quick link updated', 'success');
    },
    onError: () => {
      addToast('Failed to update quick link', 'error');
    },
  });
};

// Delete quick link
export const useDeleteQuickLink = () => {
  const queryClient = useQueryClient();
  const { addToast } = useToast();

  return useMutation({
    mutationFn: async (linkId: number) => {
      return api.deleteQuickLink(linkId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.siteSettings.quickLinks() });
      addToast('Quick link deleted', 'success');
    },
    onError: () => {
      addToast('Failed to delete quick link', 'error');
    },
  });
};


