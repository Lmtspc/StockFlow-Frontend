import { useAuthStore } from './authStore';

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080';

// Helper to generate UUID or unique idempotency key
export const generateIdempotencyKey = (prefix: string = 'KEY') => {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substring(2, 9).toUpperCase()}`;
};

export const apiFetch = async <T>(
  endpoint: string,
  options: RequestInit & { idempotencyKey?: string } = {}
): Promise<T> => {
  const token = useAuthStore.getState().token;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  if (options.idempotencyKey) {
    headers['X-Idempotency-Key'] = options.idempotencyKey;
  }

  const formattedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  let url = '';
  if (endpoint.startsWith('http')) {
    url = endpoint;
  } else if (formattedEndpoint.startsWith('/api/v1') || formattedEndpoint.startsWith('/auth')) {
    url = `${BASE_URL}${formattedEndpoint}`;
  } else {
    url = `${BASE_URL}/api/v1${formattedEndpoint}`;
  }

  const res = await fetch(url, {
    ...options,
    headers,
  });

  if (!res.ok) {
    let errorText = `API error (${res.status})`;
    try {
      const errData = await res.json();
      errorText = errData.message || errData.error || errorText;
    } catch {
      // Ignore JSON parse error
    }
    throw new Error(errorText);
  }

  return (await res.json()) as T;
};
