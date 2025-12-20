import { useMutation } from '@tanstack/react-query';
import { api } from '../../services/api';
import { useToast } from '../../components/Toast';

// ============ MUTATIONS ============

// Login mutation
export const useLogin = () => {
  const { addToast } = useToast();

  return useMutation({
    mutationFn: async (credentials: { identifier: string; password: string }) => {
      return api.login(credentials.identifier, credentials.password);
    },
    onError: (error: any) => {
      addToast(error.message || 'Login failed', 'error');
    },
  });
};

// Logout mutation (if needed)
export const useLogout = () => {
  return useMutation({
    mutationFn: async () => {
      // Clear tokens handled by auth service
      return Promise.resolve();
    },
  });
};


