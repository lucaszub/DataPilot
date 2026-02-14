/**
 * Centralized API client for DataPilot.
 * Handles auth headers, token refresh, and error handling.
 */

import {
  getAccessToken,
  getRefreshToken,
  setTokens,
  clearTokens,
} from "./auth";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

// --- Types ---

export interface RegisterPayload {
  email: string;
  password: string;
  tenant_id: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface AuthTokens {
  access_token: string;
  refresh_token: string;
  token_type: string;
}

export interface UserResponse {
  id: string;
  email: string;
  tenant_id: string;
  role: string;
  created_at: string;
}

// --- Data Source Types ---

export interface DataSourceListItem {
  id: string;
  type: string;
  name: string;
  row_count: number | null;
  column_count: number | null;
  created_at: string;
}

export interface DataSourceDetail extends DataSourceListItem {
  tenant_id: string;
  schema_cache: {
    columns: Array<{ name: string; type: string }>;
    row_count: number;
    sample_rows: Record<string, unknown>[];
  } | null;
}

export interface DataSourcePreview {
  columns: Array<{ name: string; type: string }>;
  rows: Record<string, unknown>[];
  total_rows: number;
  page: number;
  page_size: number;
  total_pages: number;
}

// --- Concurrent refresh guard ---

let isRefreshing = false;
let refreshSubscribers: Array<(token: string) => void> = [];

function subscribeTokenRefresh(cb: (token: string) => void) {
  refreshSubscribers.push(cb);
}

function onTokenRefreshed(token: string) {
  refreshSubscribers.forEach((cb) => cb(token));
  refreshSubscribers = [];
}

// --- Core request function ---

async function request<T>(
  path: string,
  options: RequestInit = {},
  retry = true
): Promise<T> {
  const accessToken = getAccessToken();

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };

  if (accessToken) {
    headers["Authorization"] = `Bearer ${accessToken}`;
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
  });

  // Handle 401 — attempt token refresh
  if (response.status === 401 && retry) {
    const refreshToken = getRefreshToken();

    if (!refreshToken) {
      clearTokens();
      if (typeof window !== "undefined") {
        window.location.href = "/login";
      }
      throw new Error("Session expirée. Veuillez vous reconnecter.");
    }

    if (isRefreshing) {
      // Wait for the ongoing refresh to complete
      return new Promise<T>((resolve, reject) => {
        subscribeTokenRefresh(async (newToken: string) => {
          try {
            const retryHeaders = {
              ...headers,
              Authorization: `Bearer ${newToken}`,
            };
            const retryResponse = await fetch(`${API_URL}${path}`, {
              ...options,
              headers: retryHeaders,
            });
            if (!retryResponse.ok) {
              reject(new Error("Erreur lors de la requête."));
            } else {
              resolve(retryResponse.json() as Promise<T>);
            }
          } catch (err) {
            reject(err);
          }
        });
      });
    }

    isRefreshing = true;

    try {
      const refreshResponse = await fetch(`${API_URL}/api/v1/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh_token: refreshToken }),
      });

      if (!refreshResponse.ok) {
        clearTokens();
        isRefreshing = false;
        if (typeof window !== "undefined") {
          window.location.href = "/login";
        }
        throw new Error("Session expirée. Veuillez vous reconnecter.");
      }

      const data = (await refreshResponse.json()) as {
        access_token: string;
        token_type: string;
      };
      setTokens(data.access_token, refreshToken);
      isRefreshing = false;
      onTokenRefreshed(data.access_token);

      // Retry original request with new token
      return request<T>(path, options, false);
    } catch (err) {
      isRefreshing = false;
      clearTokens();
      if (typeof window !== "undefined") {
        window.location.href = "/login";
      }
      throw err;
    }
  }

  if (!response.ok) {
    let errorMessage = `Erreur ${response.status}`;
    try {
      const errorData = (await response.json()) as { detail?: string };
      if (errorData.detail) {
        errorMessage =
          typeof errorData.detail === "string"
            ? errorData.detail
            : JSON.stringify(errorData.detail);
      }
    } catch {
      // ignore JSON parse errors
    }
    throw new Error(errorMessage);
  }

  return response.json() as Promise<T>;
}

// --- Auth API ---

const authApi = {
  register(payload: RegisterPayload): Promise<UserResponse> {
    return request<UserResponse>("/api/v1/auth/register", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  login(payload: LoginPayload): Promise<AuthTokens> {
    return request<AuthTokens>("/api/v1/auth/login", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  refresh(refreshToken: string): Promise<{ access_token: string; token_type: string }> {
    return request<{ access_token: string; token_type: string }>(
      "/api/v1/auth/refresh",
      {
        method: "POST",
        body: JSON.stringify({ refresh_token: refreshToken }),
      },
      false // never retry refresh with itself
    );
  },

  me(): Promise<UserResponse> {
    return request<UserResponse>("/api/v1/auth/me");
  },
};

// --- Data Sources API ---

const dataSourcesApi = {
  upload(file: File, name: string): Promise<DataSourceDetail> {
    const accessToken = getAccessToken();
    const formData = new FormData();
    formData.append("file", file);
    formData.append("name", name);

    const headers: Record<string, string> = {};
    if (accessToken) {
      headers["Authorization"] = `Bearer ${accessToken}`;
    }

    return fetch(`${API_URL}/api/v1/data-sources/upload`, {
      method: "POST",
      headers,
      body: formData,
    }).then(async (response) => {
      if (!response.ok) {
        let errorMessage = `Erreur ${response.status}`;
        try {
          const errorData = (await response.json()) as { detail?: string };
          if (errorData.detail) {
            errorMessage =
              typeof errorData.detail === "string"
                ? errorData.detail
                : JSON.stringify(errorData.detail);
          }
        } catch {
          // ignore JSON parse errors
        }
        throw new Error(errorMessage);
      }
      return response.json() as Promise<DataSourceDetail>;
    });
  },

  list(skip = 0, limit = 100): Promise<DataSourceListItem[]> {
    return request<DataSourceListItem[]>(
      `/api/v1/data-sources/?skip=${skip}&limit=${limit}`
    );
  },

  getById(id: string): Promise<DataSourceDetail> {
    return request<DataSourceDetail>(`/api/v1/data-sources/${id}`);
  },

  delete(id: string): Promise<void> {
    return request<void>(`/api/v1/data-sources/${id}`, {
      method: "DELETE",
    });
  },

  preview(
    id: string,
    page = 1,
    pageSize = 50
  ): Promise<DataSourcePreview> {
    return request<DataSourcePreview>(
      `/api/v1/data-sources/${id}/preview?page=${page}&page_size=${pageSize}`
    );
  },
};

export const api = {
  auth: authApi,
  dataSources: dataSourcesApi,
};

// Keep backward-compatible export for any existing usage
export async function apiFetch(
  path: string,
  options?: RequestInit
): Promise<Response> {
  return fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
  });
}
