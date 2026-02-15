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

// Dashboard 1: "Vue d'ensemble commerciale"
const dashboardCommercial: MockDashboard = {
  id: 'dash-1',
  name: 'Vue d\'ensemble commerciale',
  description: 'Tableau de bord principal pour le suivi du chiffre d\'affaires, commandes et clients',
  createdAt: '2025-01-15T10:00:00Z',
  updatedAt: '2026-02-14T14:30:00Z',
  theme: 'indigo',
  widgets: [
    // Row 1: KPIs (4 cards, 3 cols each)
    {
      id: 'w-1-1',
      type: 'kpi',
      title: 'Chiffre d\'affaires total',
      kpiValue: '5,24M€',
      kpiLabel: 'CA TTC',
      kpiTrend: 12.5,
      kpiTrendDirection: 'up',
      layout: { x: 0, y: 0, w: 3, h: 2 }
    },
    {
      id: 'w-1-2',
      type: 'kpi',
      title: 'Nombre de commandes',
      kpiValue: '487',
      kpiLabel: 'Commandes terminées',
      kpiTrend: 8.3,
      kpiTrendDirection: 'up',
      layout: { x: 3, y: 0, w: 3, h: 2 }
    },
    {
      id: 'w-1-3',
      type: 'kpi',
      title: 'Panier moyen',
      kpiValue: '10 759€',
      kpiLabel: 'Par commande',
      kpiTrend: 3.8,
      kpiTrendDirection: 'up',
      layout: { x: 6, y: 0, w: 3, h: 2 }
    },
    {
      id: 'w-1-4',
      type: 'kpi',
      title: 'Clients actifs',
      savedQueryId: 'sq-014',
      kpiLabel: 'Avec ≥1 commande',
      kpiTrend: 15.2,
      kpiTrendDirection: 'up',
      layout: { x: 9, y: 0, w: 3, h: 2 }
    },
    // Row 2: Charts
    {
      id: 'w-1-5',
      type: 'chart',
      title: 'Évolution du CA mensuel',
      chartType: 'line',
      savedQueryId: 'sq-001',
      layout: { x: 0, y: 2, w: 8, h: 4 }
    },
    {
      id: 'w-1-6',
      type: 'chart',
      title: 'Top 10 clients',
      chartType: 'bar',
      savedQueryId: 'sq-002',
      layout: { x: 8, y: 2, w: 4, h: 4 }
    },
    // Row 3: More insights
    {
      id: 'w-1-7',
      type: 'chart',
      title: 'Répartition par catégorie',
      chartType: 'pie',
      savedQueryId: 'sq-003',
      layout: { x: 0, y: 6, w: 4, h: 4 }
    },
    {
      id: 'w-1-8',
      type: 'table',
      title: 'Commandes récentes',
      savedQueryId: 'sq-004',
      layout: { x: 4, y: 6, w: 8, h: 4 }
    }
  ]
};

// Dashboard 2: "Analyse produits"
const dashboardProduits: MockDashboard = {
  id: 'dash-2',
  name: 'Analyse produits',
  description: 'Suivi des marges, inventaire et performances produits',
  createdAt: '2025-01-20T09:30:00Z',
  updatedAt: '2026-02-14T16:45:00Z',
  theme: 'emerald',
  widgets: [
    // Row 1: KPIs
    {
      id: 'w-2-1',
      type: 'kpi',
      title: 'Marge moyenne',
      kpiValue: '42,3%',
      kpiLabel: 'Taux de marge',
      kpiTrend: 2.1,
      kpiTrendDirection: 'up',
      layout: { x: 0, y: 0, w: 4, h: 2 }
    },
    {
      id: 'w-2-2',
      type: 'kpi',
      title: 'Produits en stock',
      kpiValue: '1 247',
      kpiLabel: 'Références actives',
      kpiTrend: -3.5,
      kpiTrendDirection: 'down',
      layout: { x: 4, y: 0, w: 4, h: 2 }
    },
    {
      id: 'w-2-3',
      type: 'kpi',
      title: 'CA produits',
      kpiValue: '5,24M€',
      kpiLabel: 'Ventes totales',
      kpiTrend: 11.8,
      kpiTrendDirection: 'up',
      layout: { x: 8, y: 0, w: 4, h: 2 }
    },
    // Row 2: Charts
    {
      id: 'w-2-4',
      type: 'chart',
      title: 'Marge par produit (Top 15)',
      chartType: 'bar',
      savedQueryId: 'sq-005',
      layout: { x: 0, y: 2, w: 6, h: 4 }
    },
    {
      id: 'w-2-5',
      type: 'chart',
      title: 'Répartition sous-catégories',
      chartType: 'pie',
      savedQueryId: 'sq-010',
      layout: { x: 6, y: 2, w: 6, h: 4 }
    },
    // Row 3: Inventory Table
    {
      id: 'w-2-6',
      type: 'table',
      title: 'Inventaire produits',
      data: [
        { produit: 'Serveur Dell PowerEdge R740', categorie: 'Hardware', stock: 45, prix_unitaire: 3200, marge: 38 },
        { produit: 'Licence Microsoft 365 E3', categorie: 'Software', stock: 250, prix_unitaire: 32, marge: 55 },
        { produit: 'Firewall Fortinet FortiGate 100F', categorie: 'Security', stock: 12, prix_unitaire: 1850, marge: 42 },
        { produit: 'Switch Cisco Catalyst 2960', categorie: 'Networking', stock: 68, prix_unitaire: 890, marge: 35 },
        { produit: 'Laptop HP EliteBook 840 G9', categorie: 'Hardware', stock: 120, prix_unitaire: 1450, marge: 28 },
        { produit: 'SAN NetApp FAS2750', categorie: 'Storage', stock: 8, prix_unitaire: 18500, marge: 48 },
        { produit: 'Licence VMware vSphere Essentials', categorie: 'Software', stock: 95, prix_unitaire: 550, marge: 52 },
        { produit: 'Onduleur APC Smart-UPS 3000VA', categorie: 'Power', stock: 34, prix_unitaire: 1200, marge: 32 },
        { produit: 'Ecran Dell UltraSharp U2723DE', categorie: 'Peripherals', stock: 180, prix_unitaire: 420, marge: 25 },
        { produit: 'Caméra Axis P1375 4K', categorie: 'Security', stock: 22, prix_unitaire: 780, marge: 40 }
      ],
      layout: { x: 0, y: 6, w: 12, h: 4 }
    }
  ]
};

// Dashboard 3: "Suivi clients"
const dashboardClients: MockDashboard = {
  id: 'dash-3',
  name: 'Suivi clients',
  description: 'Analyse de la base clients, segmentation et acquisition',
  createdAt: '2025-02-01T11:15:00Z',
  updatedAt: '2026-02-14T17:20:00Z',
  theme: 'blue',
  widgets: [
    // Row 1: KPIs
    {
      id: 'w-3-1',
      type: 'kpi',
      title: 'Nombre de clients',
      kpiValue: '342',
      kpiLabel: 'Clients totaux',
      kpiTrend: 6.2,
      kpiTrendDirection: 'up',
      layout: { x: 0, y: 0, w: 4, h: 2 }
    },
    {
      id: 'w-3-2',
      type: 'kpi',
      title: 'Nouveaux ce mois',
      kpiValue: '18',
      kpiLabel: 'Acquisitions février',
      kpiTrend: 12.5,
      kpiTrendDirection: 'up',
      layout: { x: 4, y: 0, w: 4, h: 2 }
    },
    {
      id: 'w-3-3',
      type: 'kpi',
      title: 'Taux de rétention',
      kpiValue: '87,4%',
      kpiLabel: 'Clients actifs 12 mois',
      kpiTrend: 1.8,
      kpiTrendDirection: 'up',
      layout: { x: 8, y: 0, w: 4, h: 2 }
    },
    // Row 2: Charts
    {
      id: 'w-3-4',
      type: 'chart',
      title: 'Distribution par segment',
      chartType: 'bar',
      savedQueryId: 'sq-011',
      layout: { x: 0, y: 2, w: 6, h: 4 }
    },
    {
      id: 'w-3-5',
      type: 'chart',
      title: 'Acquisition mensuelle clients',
      chartType: 'line',
      savedQueryId: 'sq-013',
      layout: { x: 6, y: 2, w: 6, h: 4 }
    },
    // Row 3: Top Customers Table
    {
      id: 'w-3-6',
      type: 'table',
      title: 'Top clients par CA',
      savedQueryId: 'sq-012',
      layout: { x: 0, y: 6, w: 12, h: 4 }
    }
  ]
};

// Export all dashboards
export const mockDashboards: MockDashboard[] = [
  dashboardCommercial,
  dashboardProduits,
  dashboardClients
];

// Helper to get dashboard by ID
export function getDashboardById(id: string): MockDashboard | undefined {
  return mockDashboards.find(d => d.id === id);
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
