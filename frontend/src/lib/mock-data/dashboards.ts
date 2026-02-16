// Mock Dashboard Configurations for DataPilot

import { getSavedQueryById, type SavedQuery } from '@/lib/mock-data/saved-queries';

export interface DashboardWidget {
  id: string;
  type: 'kpi' | 'chart' | 'table' | 'text';
  title: string;
  chartType?: 'bar' | 'line' | 'pie' | 'area';
  savedQueryId?: string;
  // KPI specific
  kpiValue?: number | string;
  kpiLabel?: string;
  kpiTrend?: number; // percentage change
  kpiTrendDirection?: 'up' | 'down';
  // Inline data for widgets without saved queries
  data?: Record<string, any>[];
  // Layout
  layout: { x: number; y: number; w: number; h: number };
}

export interface MockDashboard {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  updatedAt: string;
  widgets: DashboardWidget[];
  theme: string;
}

// Mock data removed -- dashboards are now loaded from the API only.
export const mockDashboards: MockDashboard[] = [];

// Helper to get dashboard by ID (always returns undefined -- kept for backward compat)
export function getDashboardById(_id: string): MockDashboard | undefined {
  return undefined;
}

// Helper to get widgets with resolved saved queries
export function getWidgetWithData(widget: DashboardWidget): DashboardWidget & { query?: SavedQuery } {
  if (widget.savedQueryId) {
    const query = getSavedQueryById(widget.savedQueryId);
    return { ...widget, query };
  }
  return widget;
}

// Helper to compute KPI value from saved query results
export function computeKpiFromQuery(query: SavedQuery | undefined): string {
  if (!query?.results?.length) return 'N/A';

  const firstRow = query.results[0];
  const value = firstRow[Object.keys(firstRow)[0]];

  // Format based on type
  if (typeof value === 'number') {
    // Revenue: format as EUR
    if (value > 100000) {
      return `${(value / 1000000).toFixed(2)}M€`;
    }
    if (value > 1000) {
      return `${(value / 1000).toFixed(1)}k€`;
    }
    return `${value}`;
  }

  return String(value);
}
