import { useQuery } from '@tanstack/react-query';
import { api } from '../../services/api';
import { queryKeys } from '../../constants/queryKeys';

// ============ PUBLIC QUERIES (no auth required) ============

// Public site settings
export const usePublicSiteSettings = () => {
  return useQuery({
    queryKey: ['public', 'siteSettings'],
    queryFn: async () => {
      // Using getSiteSettings which doesn't require auth
      const data = await api.getSiteSettings();
      return data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Public notices
export const usePublicNotices = () => {
  return useQuery({
    queryKey: ['public', 'notices'],
    queryFn: async () => {
      // Using getNotices with activeOnly=true for public view
      const data = await api.getNotices(true);
      return data;
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

// Combined public home data
export const usePublicHomeData = () => {
  const settings = usePublicSiteSettings();
  const notices = usePublicNotices();

  return {
    settings: settings.data,
    notices: notices.data ?? [],
    isLoading: settings.isLoading || notices.isLoading,
    error: settings.error || notices.error,
  };
};

// Public conferences list
// NOTE: Disabled until getPublicConferences API method is implemented
// export const usePublicConferencesList = () => {
//   return useQuery({
//     queryKey: queryKeys.conference.publicList(),
//     queryFn: async () => {
//       const data = await api.getPublicConferences();
//       return data;
//     },
//     staleTime: 5 * 60 * 1000,
//   });
// };

// Public Kalamela events
// NOTE: Disabled until getPublicKalamelaEvents API method is implemented
// export const usePublicKalamelaEvents = () => {
//   return useQuery({
//     queryKey: ['public', 'kalamela', 'events'],
//     queryFn: async () => {
//       const response = await api.getPublicKalamelaEvents();
//       return response.data;
//     },
//     staleTime: 5 * 60 * 1000,
//   });
// };

// Public Kalamela results - renamed to avoid conflict with useKalamela.ts
// NOTE: Disabled until getPublicKalamelaResults API method is implemented
// export const usePublicKalamelaResultsData = () => {
//   return useQuery({
//     queryKey: ['public', 'kalamela', 'results'],
//     queryFn: async () => {
//       const response = await api.getPublicKalamelaResults();
//       return response.data;
//     },
//     staleTime: 2 * 60 * 1000,
//   });
// };

// Public Kalamela top performers - renamed to avoid conflict with useKalamela.ts
// NOTE: Disabled until getPublicTopPerformers API method is implemented
// export const usePublicTopPerformersData = () => {
//   return useQuery({
//     queryKey: ['public', 'kalamela', 'topPerformers'],
//     queryFn: async () => {
//       const response = await api.getPublicTopPerformers();
//       return response.data;
//     },
//     staleTime: 2 * 60 * 1000,
//   });
// };

// Combined public kalamela data
// NOTE: Disabled until usePublicKalamelaResultsData is available
// export const usePublicKalamelaData = () => {
//   const events = usePublicKalamelaEvents();
//   const results = usePublicKalamelaResultsData();

//   return {
//     events: events.data,
//     results: results.data,
//     isLoading: events.isLoading || results.isLoading,
//     error: events.error || results.error,
//   };
// };
