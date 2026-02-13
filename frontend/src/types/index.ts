// Shared TypeScript types for DataPilot frontend

export interface User {
  id: string;
  email: string;
  tenantId: string;
  role: string;
  createdAt: string;
}

export interface Workspace {
  id: string;
  tenantId: string;
  name: string;
  settings: Record<string, unknown> | null;
  createdAt: string;
}

export interface DataSource {
  id: string;
  tenantId: string;
  type: "postgresql" | "mysql" | "csv";
  name: string;
  schemaCache: Record<string, unknown> | null;
  createdAt: string;
}

export interface Dashboard {
  id: string;
  tenantId: string;
  workspaceId: string;
  name: string;
  layoutJson: Record<string, unknown> | null;
  createdAt: string;
}

export interface Widget {
  id: string;
  dashboardId: string;
  queryJson: Record<string, unknown> | null;
  chartType: string;
  position: Record<string, unknown> | null;
}

export interface AIQueryRequest {
  question: string;
  dataSourceId: string;
}

export interface AIQueryResponse {
  sql: string;
  results: Record<string, unknown>[];
  chartSuggestion: Record<string, unknown> | null;
}
