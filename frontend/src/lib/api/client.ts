// ============================================================
// SIMPRO - Core API Client for Golang Backend
// ============================================================

import type { ApiResponse, ApiErrorResponse } from '@/lib/types/api';

const DEFAULT_BASE_URL = 'http://localhost:8080/api/v1';
const TOKEN_KEY = 'simpro_auth_token';
const REFRESH_TOKEN_KEY = 'simpro_refresh_token';

/**
 * Custom Error class for API call failures
 */
export class ApiError extends Error {
  status: number;
  code?: string;
  errors?: Record<string, string[] | string>;

  constructor(status: number, message: string, errors?: Record<string, string[] | string>, code?: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.errors = errors;
  }
}

/**
 * Token Storage Helpers (Browser-safe)
 */
export const tokenStorage = {
  getAccessToken: (): string | null => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(TOKEN_KEY);
  },
  setAccessToken: (token: string): void => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(TOKEN_KEY, token);
  },
  getRefreshToken: (): string | null => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(REFRESH_TOKEN_KEY);
  },
  setRefreshToken: (token: string): void => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(REFRESH_TOKEN_KEY, token);
  },
  clearTokens: (): void => {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
  },
};

/**
 * Request Options interface
 */
export interface RequestOptions extends Omit<RequestInit, 'body'> {
  params?: Record<string, unknown>;
  body?: unknown;
  timeout?: number;
  requiresAuth?: boolean;
}

/**
 * Serialize query parameters into URL search string
 */
function buildQueryString(params?: Record<string, unknown>): string {
  if (!params) return '';
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      searchParams.append(key, String(value));
    }
  });

  const query = searchParams.toString();
  return query ? `?${query}` : '';
}

/**
 * Core HTTP Request Function to Golang Backend
 */
export async function apiRequest<T = unknown>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<ApiResponse<T>> {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || DEFAULT_BASE_URL;
  const timeoutMs = options.timeout || Number(process.env.NEXT_PUBLIC_API_TIMEOUT) || 15000;
  const requiresAuth = options.requiresAuth !== false;

  // Format URL
  const normalizedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const queryString = buildQueryString(options.params);
  const url = `${baseUrl}${normalizedEndpoint}${queryString}`;

  // Headers
  const headers = new Headers(options.headers || {});
  
  const isFormData = typeof FormData !== 'undefined' && options.body instanceof FormData;
  if (!isFormData && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }
  if (!headers.has('Accept')) {
    headers.set('Accept', 'application/json');
  }

  // Inject Bearer Auth Token
  if (requiresAuth) {
    const token = tokenStorage.getAccessToken();
    if (token && !headers.has('Authorization')) {
      headers.set('Authorization', `Bearer ${token}`);
    }
  }

  // Setup Timeout Controller
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...options,
      headers,
      signal: controller.signal,
      body: isFormData
        ? (options.body as FormData)
        : options.body !== undefined
        ? JSON.stringify(options.body)
        : undefined,
    });

    clearTimeout(timeoutId);

    // Handle No Content
    if (response.status === 204) {
      return {
        success: true,
        message: 'No content',
        data: null as unknown as T,
      };
    }

    // Try parsing JSON response
    let json: ApiResponse<T> | ApiErrorResponse;
    try {
      json = await response.json();
    } catch {
      if (!response.ok) {
        throw new ApiError(response.status, `HTTP Error ${response.status}: ${response.statusText}`);
      }
      return {
        success: true,
        message: 'OK',
        data: null as unknown as T,
      };
    }

    // Check HTTP status code
    if (!response.ok) {
      const errorJson = json as ApiErrorResponse;
      throw new ApiError(
        response.status,
        errorJson.message || `Request failed with status ${response.status}`,
        errorJson.errors,
        errorJson.code
      );
    }

    return json as ApiResponse<T>;
  } catch (err: unknown) {
    clearTimeout(timeoutId);

    if (err instanceof ApiError) {
      throw err;
    }

    if (err instanceof DOMException && err.name === 'AbortError') {
      throw new ApiError(408, `Permintaan batas waktu (timeout) setelah ${timeoutMs}ms.`);
    }

    const message = err instanceof Error ? err.message : 'Terjadi kesalahan jaringan atau server backend Golang tidak aktif.';
    throw new ApiError(0, message);
  }
}

/**
 * Convenient API Client Wrapper methods
 */
export const apiClient = {
  get<T>(endpoint: string, options?: Omit<RequestOptions, 'method' | 'body'>) {
    return apiRequest<T>(endpoint, { ...options, method: 'GET' });
  },

  post<T>(endpoint: string, body?: unknown, options?: Omit<RequestOptions, 'method' | 'body'>) {
    return apiRequest<T>(endpoint, { ...options, method: 'POST', body });
  },

  put<T>(endpoint: string, body?: unknown, options?: Omit<RequestOptions, 'method' | 'body'>) {
    return apiRequest<T>(endpoint, { ...options, method: 'PUT', body });
  },

  patch<T>(endpoint: string, body?: unknown, options?: Omit<RequestOptions, 'method' | 'body'>) {
    return apiRequest<T>(endpoint, { ...options, method: 'PATCH', body });
  },

  delete<T>(endpoint: string, options?: Omit<RequestOptions, 'method'>) {
    return apiRequest<T>(endpoint, { ...options, method: 'DELETE' });
  },

  upload<T>(endpoint: string, formData: FormData, options?: Omit<RequestOptions, 'method' | 'body'>) {
    return apiRequest<T>(endpoint, { ...options, method: 'POST', body: formData });
  },
};
