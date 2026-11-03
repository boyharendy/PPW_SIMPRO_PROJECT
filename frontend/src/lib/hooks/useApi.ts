'use client';

import { useState, useEffect, useCallback } from 'react';
import { ApiError } from '@/lib/api';
import type { ApiResponse } from '@/lib/types/api';

interface UseApiOptions<T> {
  immediate?: boolean;
  initialData?: T;
  onSuccess?: (data: T) => void;
  onError?: (error: ApiError) => void;
}

export function useApi<T>(
  fetcher: () => Promise<ApiResponse<T>>,
  options: UseApiOptions<T> = {}
) {
  const { immediate = true, initialData, onSuccess, onError } = options;

  const [data, setData] = useState<T | undefined>(initialData);
  const [loading, setLoading] = useState<boolean>(immediate);
  const [error, setError] = useState<ApiError | null>(null);

  const execute = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetcher();
      setData(response.data);
      onSuccess?.(response.data);
      return response.data;
    } catch (err: unknown) {
      const apiErr = err instanceof ApiError ? err : new ApiError(0, 'Terjadi kesalahan sistem');
      setError(apiErr);
      onError?.(apiErr);
      throw apiErr;
    } finally {
      setLoading(false);
    }
  }, [fetcher, onSuccess, onError]);

  useEffect(() => {
    if (!immediate) return;

    let isMounted = true;

    async function runFetcher() {
      try {
        const response = await fetcher();
        if (isMounted) {
          setData(response.data);
          onSuccess?.(response.data);
        }
      } catch (err: unknown) {
        if (isMounted) {
          const apiErr = err instanceof ApiError ? err : new ApiError(0, 'Terjadi kesalahan sistem');
          setError(apiErr);
          onError?.(apiErr);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    runFetcher();

    return () => {
      isMounted = false;
    };
  }, [fetcher, immediate, onSuccess, onError]);

  return {
    data,
    loading,
    error,
    refetch: execute,
    setData,
  };
}
