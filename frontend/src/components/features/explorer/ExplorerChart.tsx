"use client";

import React, { useMemo } from 'react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { TrendingUp } from 'lucide-react';
import { useExplorer } from './ExplorerContext';

const COLORS = ['#FF5789', '#8B5CF6', '#3B82F6', '#F59E0B', '#10B981', '#EC4899'];

const numberFormatter = new Intl.NumberFormat('fr-FR', {
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

export function ExplorerChart() {
  const { state } = useExplorer();

  const chartData = useMemo(() => {
    if (!state.result || state.result.rows.length === 0) {
      return [];
    }

    // Transform rows into chart-friendly format
    return state.result.rows.map(row => {
      const transformed: Record<string, unknown> = {};
      state.result!.columns.forEach(col => {
        transformed[col.name] = row[col.key];
      });
      return transformed;
    });
  }, [state.result]);

  const dimensions = useMemo(() => {
    if (!state.result) return [];
    return state.result.columns.filter(col =>
      state.selectedFields.find(f => f.name === col.name && f.tableName === col.tableName && f.role === 'dimension')
    );
  }, [state.result, state.selectedFields]);

  const measures = useMemo(() => {
    if (!state.result) return [];
    return state.result.columns.filter(col =>
      state.selectedFields.find(f => f.name === col.name && f.tableName === col.tableName && f.role === 'measure')
    );
  }, [state.result, state.selectedFields]);

  const firstDimension = dimensions[0]?.name || '';
  const firstMeasure = measures[0]?.name || '';

  if (!state.result || chartData.length === 0) {
    return (
      <div className="flex items-center justify-center h-96 bg-card border border-border rounded-lg">
        <div className="text-center">
          <p className="text-muted-foreground">
            Sélectionnez des champs et exécutez la requête pour afficher un graphique
          </p>
        </div>
      </div>
    );
  }

  // KPI Chart
  if (state.chartType === 'kpi') {
    if (!firstMeasure) {
      return (
        <div className="flex items-center justify-center h-96 bg-card border border-border rounded-lg">
          <p className="text-muted-foreground">Sélectionnez au moins une mesure pour le KPI</p>
        </div>
      );
    }

    // Calculate KPI value (sum of first measure)
    const kpiValue = chartData.reduce((acc, row) => {
      const val = row[firstMeasure];
      return acc + (typeof val === 'number' ? val : 0);
    }, 0);

    return (
      <div className="flex items-center justify-center h-96 bg-card border border-border rounded-lg">
        <div className="text-center">
          <div className="flex items-center justify-center gap-3 mb-2">
            <TrendingUp className="h-12 w-12 text-primary" />
          </div>
          <div className="text-6xl font-bold text-foreground mb-2">
            {numberFormatter.format(kpiValue)}
          </div>
          <div className="text-lg text-muted-foreground">
            {measures[0].name}
          </div>
          {chartData.length > 1 && (
            <div className="text-sm text-muted-foreground mt-2">
              sur {chartData.length} lignes
            </div>
          )}
        </div>
      </div>
    );
  }

  // Pie Chart
  if (state.chartType === 'pie') {
    if (!firstDimension || !firstMeasure) {
      return (
        <div className="flex items-center justify-center h-96 bg-card border border-border rounded-lg">
          <p className="text-muted-foreground">
            Sélectionnez une dimension et une mesure pour le graphique en camembert
          </p>
        </div>
      );
    }

    const pieData = chartData.map(row => ({
      name: String(row[firstDimension]),
      value: typeof row[firstMeasure] === 'number' ? row[firstMeasure] : 0,
    })).slice(0, 10); // Limit to top 10

    return (
      <div className="h-96 bg-card border border-border rounded-lg p-4">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={pieData}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius={120}
              label={(entry) => `${entry.name}: ${numberFormatter.format(entry.value)}`}
            >
              {pieData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value: number) => numberFormatter.format(value)}
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '0.5rem',
              }}
            />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>
    );
  }

  // Bar Chart
  if (state.chartType === 'bar') {
    if (!firstDimension || measures.length === 0) {
      return (
        <div className="flex items-center justify-center h-96 bg-card border border-border rounded-lg">
          <p className="text-muted-foreground">
            Sélectionnez une dimension et au moins une mesure pour le graphique en barres
          </p>
        </div>
      );
    }

    return (
      <div className="h-96 bg-card border border-border rounded-lg p-4">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis
              dataKey={firstDimension}
              stroke="hsl(var(--muted-foreground))"
              tick={{ fill: 'hsl(var(--muted-foreground))' }}
            />
            <YAxis
              stroke="hsl(var(--muted-foreground))"
              tick={{ fill: 'hsl(var(--muted-foreground))' }}
              tickFormatter={(value) => numberFormatter.format(value)}
            />
            <Tooltip
              formatter={(value: number) => numberFormatter.format(value)}
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '0.5rem',
              }}
            />
            <Legend />
            {measures.map((measure, idx) => (
              <Bar
                key={measure.name}
                dataKey={measure.name}
                fill={COLORS[idx % COLORS.length]}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>
    );
  }

  // Line Chart
  if (state.chartType === 'line') {
    if (!firstDimension || measures.length === 0) {
      return (
        <div className="flex items-center justify-center h-96 bg-card border border-border rounded-lg">
          <p className="text-muted-foreground">
            Sélectionnez une dimension et au moins une mesure pour le graphique en lignes
          </p>
        </div>
      );
    }

    return (
      <div className="h-96 bg-card border border-border rounded-lg p-4">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis
              dataKey={firstDimension}
              stroke="hsl(var(--muted-foreground))"
              tick={{ fill: 'hsl(var(--muted-foreground))' }}
            />
            <YAxis
              stroke="hsl(var(--muted-foreground))"
              tick={{ fill: 'hsl(var(--muted-foreground))' }}
              tickFormatter={(value) => numberFormatter.format(value)}
            />
            <Tooltip
              formatter={(value: number) => numberFormatter.format(value)}
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '0.5rem',
              }}
            />
            <Legend />
            {measures.map((measure, idx) => (
              <Line
                key={measure.name}
                type="monotone"
                dataKey={measure.name}
                stroke={COLORS[idx % COLORS.length]}
                strokeWidth={2}
                dot={{ fill: COLORS[idx % COLORS.length] }}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    );
  }

  // Area Chart
  if (state.chartType === 'area') {
    if (!firstDimension || measures.length === 0) {
      return (
        <div className="flex items-center justify-center h-96 bg-card border border-border rounded-lg">
          <p className="text-muted-foreground">
            Sélectionnez une dimension et au moins une mesure pour le graphique en aire
          </p>
        </div>
      );
    }

    return (
      <div className="h-96 bg-card border border-border rounded-lg p-4">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis
              dataKey={firstDimension}
              stroke="hsl(var(--muted-foreground))"
              tick={{ fill: 'hsl(var(--muted-foreground))' }}
            />
            <YAxis
              stroke="hsl(var(--muted-foreground))"
              tick={{ fill: 'hsl(var(--muted-foreground))' }}
              tickFormatter={(value) => numberFormatter.format(value)}
            />
            <Tooltip
              formatter={(value: number) => numberFormatter.format(value)}
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '0.5rem',
              }}
            />
            <Legend />
            {measures.map((measure, idx) => (
              <Area
                key={measure.name}
                type="monotone"
                dataKey={measure.name}
                fill={COLORS[idx % COLORS.length]}
                stroke={COLORS[idx % COLORS.length]}
                fillOpacity={0.6}
              />
            ))}
          </AreaChart>
        </ResponsiveContainer>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center h-96 bg-card border border-border rounded-lg">
      <p className="text-muted-foreground">Type de graphique non supporté</p>
    </div>
  );
}
