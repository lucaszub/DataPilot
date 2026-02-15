// Pre-built Saved Queries

import type { QueryField, QueryFilter, QuerySort } from './query-engine';
import { executeMockQuery } from './query-engine';

export interface SavedQuery {
  id: string;
  name: string;
  description: string;
  fields: QueryField[];
  filters?: QueryFilter[];
  sorts?: QuerySort[];
  limit?: number;
  chartType: 'line' | 'bar' | 'pie' | 'table' | 'kpi' | 'area';
  results?: any; // Pre-computed results for faster loading
}

// Helper to pre-compute results
function createSavedQuery(
  id: string,
  name: string,
  description: string,
  fields: QueryField[],
  chartType: 'line' | 'bar' | 'pie' | 'table' | 'kpi' | 'area',
  filters?: QueryFilter[],
  sorts?: QuerySort[],
  limit?: number
): SavedQuery {
  const results = executeMockQuery(fields, filters, sorts, limit);
  return { id, name, description, fields, filters, sorts, limit, chartType, results };
}

export const savedQueries: SavedQuery[] = [
  // 1. Monthly Revenue (Line Chart)
  createSavedQuery(
    'sq-001',
    'Chiffre d\'affaires mensuel',
    'Evolution du chiffre d\'affaires mois par mois depuis janvier 2024',
    [
      { tableName: 'orders', columnName: 'order_date', aggregation: 'none', dateGranularity: 'month' },
      { tableName: 'orders', columnName: 'total_amount', aggregation: 'SUM' }
    ],
    'line',
    [
      { tableName: 'orders', columnName: 'status', operator: 'equals', value: 'completed' }
    ],
    [
      { tableName: 'orders', columnName: 'order_date', direction: 'ASC' }
    ]
  ),

  // 2. Top 10 Customers (Bar Chart)
  createSavedQuery(
    'sq-002',
    'Top 10 clients',
    'Les 10 clients ayant généré le plus de chiffre d\'affaires',
    [
      { tableName: 'customers', columnName: 'company', aggregation: 'none' },
      { tableName: 'orders', columnName: 'total_amount', aggregation: 'SUM' }
    ],
    'bar',
    [
      { tableName: 'orders', columnName: 'status', operator: 'equals', value: 'completed' }
    ],
    [
      { tableName: 'orders', columnName: 'total_amount', direction: 'DESC' }
    ],
    10
  ),

  // 3. Product Categories Distribution (Pie Chart)
  createSavedQuery(
    'sq-003',
    'Répartition par catégorie',
    'Répartition du chiffre d\'affaires par catégorie de produit',
    [
      { tableName: 'products', columnName: 'category', aggregation: 'none' },
      { tableName: 'order_items', columnName: 'line_total', aggregation: 'SUM' }
    ],
    'pie',
    [
      { tableName: 'orders', columnName: 'status', operator: 'equals', value: 'completed' }
    ]
  ),

  // 4. Recent Orders (Table)
  createSavedQuery(
    'sq-004',
    'Commandes récentes',
    'Les 50 commandes les plus récentes',
    [
      { tableName: 'orders', columnName: 'id', aggregation: 'none' },
      { tableName: 'orders', columnName: 'order_date', aggregation: 'none', dateGranularity: 'day' },
      { tableName: 'customers', columnName: 'company', aggregation: 'none' },
      { tableName: 'orders', columnName: 'total_amount', aggregation: 'none' },
      { tableName: 'orders', columnName: 'status', aggregation: 'none' }
    ],
    'table',
    undefined,
    [
      { tableName: 'orders', columnName: 'order_date', direction: 'DESC' }
    ],
    50
  ),

  // 5. Margin by Product (Bar Chart)
  createSavedQuery(
    'sq-005',
    'Marge par produit',
    'Marge moyenne par produit (top 15)',
    [
      { tableName: 'products', columnName: 'name', aggregation: 'none' },
      { tableName: 'products', columnName: 'unit_price', aggregation: 'AVG' },
      { tableName: 'products', columnName: 'cost_price', aggregation: 'AVG' }
    ],
    'bar',
    undefined,
    [
      { tableName: 'products', columnName: 'unit_price', direction: 'DESC' }
    ],
    15
  ),

  // 6. Total Revenue KPI (Single Number)
  createSavedQuery(
    'sq-006',
    'CA total',
    'Chiffre d\'affaires total des commandes terminées',
    [
      { tableName: 'orders', columnName: 'total_amount', aggregation: 'SUM' }
    ],
    'kpi',
    [
      { tableName: 'orders', columnName: 'status', operator: 'equals', value: 'completed' }
    ]
  ),

  // Additional queries for dashboard variety

  // 7. Order Count KPI
  createSavedQuery(
    'sq-007',
    'Nombre de commandes',
    'Nombre total de commandes terminées',
    [
      { tableName: 'orders', columnName: 'id', aggregation: 'COUNT' }
    ],
    'kpi',
    [
      { tableName: 'orders', columnName: 'status', operator: 'equals', value: 'completed' }
    ]
  ),

  // 8. Average Margin KPI
  createSavedQuery(
    'sq-008',
    'Marge moyenne',
    'Marge moyenne en pourcentage',
    [
      { tableName: 'products', columnName: 'unit_price', aggregation: 'AVG' },
      { tableName: 'products', columnName: 'cost_price', aggregation: 'AVG' }
    ],
    'kpi'
  ),

  // 9. Stock by Category
  createSavedQuery(
    'sq-009',
    'Stock par catégorie',
    'Quantité totale en stock par catégorie',
    [
      { tableName: 'products', columnName: 'category', aggregation: 'none' },
      { tableName: 'products', columnName: 'stock_qty', aggregation: 'SUM' }
    ],
    'bar',
    [
      { tableName: 'products', columnName: 'stock_qty', operator: 'gt', value: '0' }
    ]
  ),

  // 10. Subcategory Breakdown (Pie)
  createSavedQuery(
    'sq-010',
    'Sous-catégories',
    'Répartition des ventes par sous-catégorie',
    [
      { tableName: 'products', columnName: 'subcategory', aggregation: 'none' },
      { tableName: 'order_items', columnName: 'line_total', aggregation: 'SUM' }
    ],
    'pie',
    [
      { tableName: 'orders', columnName: 'status', operator: 'equals', value: 'completed' }
    ],
    [
      { tableName: 'order_items', columnName: 'line_total', direction: 'DESC' }
    ],
    8
  ),

  // 11. Customer Segment Distribution (Bar)
  createSavedQuery(
    'sq-011',
    'Distribution par segment',
    'Nombre de clients par segment',
    [
      { tableName: 'customers', columnName: 'segment', aggregation: 'none' },
      { tableName: 'customers', columnName: 'id', aggregation: 'COUNT' }
    ],
    'bar'
  ),

  // 12. Top Customers Table
  createSavedQuery(
    'sq-012',
    'Top clients détaillé',
    'Top 20 clients avec détails',
    [
      { tableName: 'customers', columnName: 'company', aggregation: 'none' },
      { tableName: 'customers', columnName: 'city', aggregation: 'none' },
      { tableName: 'customers', columnName: 'segment', aggregation: 'none' },
      { tableName: 'orders', columnName: 'id', aggregation: 'COUNT' },
      { tableName: 'orders', columnName: 'total_amount', aggregation: 'SUM' }
    ],
    'table',
    [
      { tableName: 'orders', columnName: 'status', operator: 'equals', value: 'completed' }
    ],
    [
      { tableName: 'orders', columnName: 'total_amount', direction: 'DESC' }
    ],
    20
  ),

  // 13. Monthly Customer Acquisition (Line)
  createSavedQuery(
    'sq-013',
    'Acquisition mensuelle clients',
    'Nouveaux clients par mois',
    [
      { tableName: 'customers', columnName: 'created_at', aggregation: 'none', dateGranularity: 'month' },
      { tableName: 'customers', columnName: 'id', aggregation: 'COUNT' }
    ],
    'line',
    undefined,
    [
      { tableName: 'customers', columnName: 'created_at', direction: 'ASC' }
    ]
  ),

  // 14. Active Customers KPI
  createSavedQuery(
    'sq-014',
    'Clients actifs',
    'Nombre de clients ayant passé au moins une commande',
    [
      { tableName: 'customers', columnName: 'id', aggregation: 'COUNT_DISTINCT' }
    ],
    'kpi',
    [
      { tableName: 'orders', columnName: 'status', operator: 'equals', value: 'completed' }
    ]
  ),

  // 15. Sales Trend (Area Chart)
  createSavedQuery(
    'sq-015',
    'Tendance des ventes',
    'Evolution hebdomadaire du chiffre d\'affaires',
    [
      { tableName: 'orders', columnName: 'order_date', aggregation: 'none', dateGranularity: 'week' },
      { tableName: 'orders', columnName: 'total_amount', aggregation: 'SUM' }
    ],
    'area',
    [
      { tableName: 'orders', columnName: 'status', operator: 'equals', value: 'completed' },
      { tableName: 'orders', columnName: 'order_date', operator: 'date_after', value: '2025-01-01' }
    ],
    [
      { tableName: 'orders', columnName: 'order_date', direction: 'ASC' }
    ]
  )
];

// Helper to get query by ID
export function getSavedQueryById(id: string): SavedQuery | undefined {
  return savedQueries.find(q => q.id === id);
}

// Helper to get queries by chart type
export function getSavedQueriesByChartType(chartType: string): SavedQuery[] {
  return savedQueries.filter(q => q.chartType === chartType);
}

// Export alias for components that import mockSavedQueries
export { savedQueries as mockSavedQueries };
