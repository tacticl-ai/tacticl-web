import { useAuthStore } from '../stores/auth-store';

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  'https://tacticl-core-1085580127767.us-east1.run.app';

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

class ApiClient {
  private async request<T>(
    path: string,
    options: RequestInit = {},
  ): Promise<T> {
    const token = useAuthStore.getState().token;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers,
      credentials: 'include',
    });

    if (response.status === 401) {
      useAuthStore.getState().clearAuth();
      throw new ApiError(401, 'Unauthorized');
    }

    if (!response.ok) {
      const body = await response.text();
      throw new ApiError(response.status, body);
    }

    if (response.status === 204) return undefined as T;
    return response.json();
  }

  get<T>(path: string) {
    return this.request<T>(path);
  }

  post<T>(path: string, body?: unknown) {
    return this.request<T>(path, {
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  put<T>(path: string, body?: unknown) {
    return this.request<T>(path, {
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  delete<T>(path: string) {
    return this.request<T>(path, { method: 'DELETE' });
  }
}

export const api = new ApiClient();
