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

// --- Semantic Layer Types ---

export interface SemanticLayerNode {
  id: string;
  data_source_id: string;
  data_source_name: string;
  position: { x: number; y: number };
  columns: Array<{ name: string; type: string; role: 'dimension' | 'measure' | 'ignore' }>;
}

export interface SemanticLayerEdge {
  id: string;
  source_node: string;
  source_column: string;
  target_node: string;
  target_column: string;
  join_type: 'LEFT' | 'INNER' | 'RIGHT' | 'FULL';
}

export interface SemanticLayerDefinitions {
  nodes: SemanticLayerNode[];
  edges: SemanticLayerEdge[];
}

export interface SemanticLayerDetail {
  id: string;
  tenant_id: string;
  workspace_id: string;
  name: string;
  definitions_json: SemanticLayerDefinitions | null;
  created_at: string;
  updated_at: string | null;
}

export interface SemanticLayerListItem {
  id: string;
  workspace_id: string;
  name: string;
  created_at: string;
}

// --- Auto-Detect Join Types ---

export interface SuggestedEdge {
  source_ds_id: string;
  source_column: string;
  target_ds_id: string;
  target_column: string;
  join_type: string;
  confidence: number;
  reason: string;
}

export interface AutoDetectResponse {
  suggested_edges: SuggestedEdge[];
}

// --- Query Types ---

export interface ColumnInfo {
  name: string;
  type: string;
}

export interface QueryExecuteRequest {
  sql_text: string;
  workspace_id: string;
  limit?: number;
}

export interface QueryExecuteResponse {
  columns: ColumnInfo[];
  rows: Record<string, unknown>[];
  row_count: number;
  execution_time_ms: number;
}

export interface SavedQueryResponse {
  id: string;
  tenant_id: string;
  workspace_id: string;
  name: string;
  sql_text: string;
  chart_type: string | null;
  created_at: string;
  updated_at: string | null;
}

export interface SavedQueryCreate {
  name: string;
  sql_text: string;
  workspace_id: string;
  chart_type?: string | null;
}

export interface SavedQueryUpdate {
  name?: string;
  sql_text?: string;
  chart_type?: string | null;
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

  // Handle 204 No Content (e.g. DELETE responses)
  if (response.status === 204) {
    return undefined as T;
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

  updateColumnType(
    dataSourceId: string,
    columnName: string,
    newType: string
  ): Promise<DataSourceDetail> {
    return request<DataSourceDetail>(
      `/api/v1/data-sources/${dataSourceId}/columns/${encodeURIComponent(columnName)}/type`,
      {
        method: "PATCH",
        body: JSON.stringify({ new_type: newType }),
      }
    );
  },
};

// --- Workspace Types ---

export interface WorkspaceResponse {
  id: string;
  tenant_id: string;
  name: string;
  settings: Record<string, unknown> | null;
  created_at: string;
}

// --- Workspaces API ---

const workspacesApi = {
  list(skip = 0, limit = 100): Promise<WorkspaceResponse[]> {
    return request<WorkspaceResponse[]>(`/api/v1/workspaces/?skip=${skip}&limit=${limit}`);
  },

  getById(id: string): Promise<WorkspaceResponse> {
    return request<WorkspaceResponse>(`/api/v1/workspaces/${id}`);
  },

  create(data: { name: string; settings?: Record<string, unknown> }): Promise<WorkspaceResponse> {
    return request<WorkspaceResponse>('/api/v1/workspaces/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
};

// --- Semantic Layers API ---

const semanticLayersApi = {
  list(workspaceId: string): Promise<SemanticLayerListItem[]> {
    return request<SemanticLayerListItem[]>(`/api/v1/semantic-layers/?workspace_id=${workspaceId}`);
  },

  getById(id: string): Promise<SemanticLayerDetail> {
    return request<SemanticLayerDetail>(`/api/v1/semantic-layers/${id}`);
  },

  create(data: { workspace_id: string; name: string; definitions_json?: SemanticLayerDefinitions }): Promise<SemanticLayerDetail> {
    return request<SemanticLayerDetail>('/api/v1/semantic-layers/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  update(id: string, data: { name?: string; definitions_json?: SemanticLayerDefinitions }): Promise<SemanticLayerDetail> {
    return request<SemanticLayerDetail>(`/api/v1/semantic-layers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  delete(id: string): Promise<void> {
    return request<void>(`/api/v1/semantic-layers/${id}`, { method: 'DELETE' });
  },

  autoDetect(dataSourceIds: string[]): Promise<AutoDetectResponse> {
    return request<AutoDetectResponse>('/api/v1/semantic-layers/auto-detect', {
      method: 'POST',
      body: JSON.stringify({ data_source_ids: dataSourceIds }),
    });
  },
};

// --- Queries API ---

const queriesApi = {
  execute(data: QueryExecuteRequest): Promise<QueryExecuteResponse> {
    return request<QueryExecuteResponse>('/api/v1/queries/execute', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  listSaved(workspaceId: string, skip = 0, limit = 100): Promise<SavedQueryResponse[]> {
    return request<SavedQueryResponse[]>(
      `/api/v1/queries/saved?workspace_id=${workspaceId}&skip=${skip}&limit=${limit}`
    );
  },

  getSaved(id: string): Promise<SavedQueryResponse> {
    return request<SavedQueryResponse>(`/api/v1/queries/saved/${id}`);
  },

  createSaved(data: SavedQueryCreate): Promise<SavedQueryResponse> {
    return request<SavedQueryResponse>('/api/v1/queries/saved', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  updateSaved(id: string, data: SavedQueryUpdate): Promise<SavedQueryResponse> {
    return request<SavedQueryResponse>(`/api/v1/queries/saved/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  deleteSaved(id: string): Promise<void> {
    return request<void>(`/api/v1/queries/saved/${id}`, { method: 'DELETE' });
  },
};

export const api = {
  auth: authApi,
  workspaces: workspacesApi,
  dataSources: dataSourcesApi,
  semanticLayers: semanticLayersApi,
  queries: queriesApi,
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
