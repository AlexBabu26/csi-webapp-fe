
import { useState, useCallback } from 'react';
import { AsyncStatus } from '../types';

interface UseAsyncReturn<T, E = string> {
  status: AsyncStatus;
  value: T | null;
  error: E | null;
  execute: (asyncFunction: () => Promise<T>) => Promise<void>;
  reset: () => void;
}

export function useAsync<T, E = string>(): UseAsyncReturn<T, E> {
  const [status, setStatus] = useState<AsyncStatus>('idle');
  const [value, setValue] = useState<T | null>(null);
  const [error, setError] = useState<E | null>(null);

  const execute = useCallback(async (asyncFunction: () => Promise<T>) => {
    setStatus('pending');
    setValue(null);
    setError(null);

    try {
      const response = await asyncFunction();
      setValue(response);
      setStatus('success');
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred');
      setStatus('error');
    }
  }, []);

  const reset = useCallback(() => {
    setStatus('idle');
    setValue(null);
    setError(null);
  }, []);

  return { status, value, error, execute, reset };
}
