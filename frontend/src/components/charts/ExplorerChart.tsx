import React from 'react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
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

type ChartType = 'table' | 'bar' | 'line' | 'pie' | 'kpi';

interface ExplorerChartProps {
  chartType: ChartType;
  columns: Array<{ name: string; type: string }>;
  rows: Array<Record<string, unknown>>;
}

const TEAL_COLORS = ['#0d9488', '#14b8a6', '#2dd4bf', '#5eead4', '#99f6e4'];

const isNumericType = (type: string) => /int|float|double|decimal|numeric|number|bigint|real/i.test(type);
const isDateType = (type: string) => /date|time|timestamp/i.test(type);

export function ExplorerChart({ chartType, columns, rows }: ExplorerChartProps) {
  if (rows.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-400">
        Aucune donnée à afficher
      </div>
    );
  }

  const numericColumns = columns.filter((col) => isNumericType(col.type));
  const dimensionColumns = columns.filter((col) => !isNumericType(col.type));

  // KPI: large number display
  if (chartType === 'kpi') {
    const firstNumeric = numericColumns[0];
    if (!firstNumeric) {
      return (
        <div className="flex items-center justify-center h-64 text-gray-400">
          Aucune valeur numérique trouvée
        </div>
      );
    }
    const value = rows[0][firstNumeric.name];
    const displayValue = typeof value === 'number'
      ? value.toLocaleString('fr-FR', { maximumFractionDigits: 2 })
      : String(value);

    return (
      <div className="flex flex-col items-center justify-center h-96 gap-4">
        <div className="text-6xl font-bold text-teal-600">{displayValue}</div>
        <div className="text-lg text-gray-500">{firstNumeric.name}</div>
      </div>
    );
  }

  // Prepare data for charts
  const xAxisKey = dimensionColumns[0]?.name || columns[0]?.name || 'x';

  // Bar Chart
  if (chartType === 'bar') {
    return (
      <ResponsiveContainer width="100%" height={400}>
        <BarChart data={rows} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis dataKey={xAxisKey} stroke="#6b7280" fontSize={12} />
          <YAxis stroke="#6b7280" fontSize={12} />
          <Tooltip
            contentStyle={{
              backgroundColor: '#fff',
              border: '1px solid #e5e7eb',
              borderRadius: '6px',
            }}
          />
          <Legend />
          {numericColumns.map((col, idx) => (
            <Bar
              key={col.name}
              dataKey={col.name}
              fill={TEAL_COLORS[idx % TEAL_COLORS.length]}
              radius={[4, 4, 0, 0]}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    );
  }

  // Line Chart
  if (chartType === 'line') {
    return (
      <ResponsiveContainer width="100%" height={400}>
        <LineChart data={rows} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis dataKey={xAxisKey} stroke="#6b7280" fontSize={12} />
          <YAxis stroke="#6b7280" fontSize={12} />
          <Tooltip
            contentStyle={{
              backgroundColor: '#fff',
              border: '1px solid #e5e7eb',
              borderRadius: '6px',
            }}
          />
          <Legend />
          {numericColumns.map((col, idx) => (
            <Line
              key={col.name}
              type="monotone"
              dataKey={col.name}
              stroke={TEAL_COLORS[idx % TEAL_COLORS.length]}
              strokeWidth={2}
              dot={{ fill: TEAL_COLORS[idx % TEAL_COLORS.length], r: 4 }}
              activeDot={{ r: 6 }}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    );
  }

  // Pie Chart
  if (chartType === 'pie') {
    const nameKey = dimensionColumns[0]?.name || columns[0]?.name || 'name';
    const valueKey = numericColumns[0]?.name;

    if (!valueKey) {
      return (
        <div className="flex items-center justify-center h-64 text-gray-400">
          Aucune valeur numérique pour le graphique circulaire
        </div>
      );
    }

    return (
      <ResponsiveContainer width="100%" height={400}>
        <PieChart>
          <Pie
            data={rows}
            dataKey={valueKey}
            nameKey={nameKey}
            cx="50%"
            cy="50%"
            outerRadius={120}
            label={(entry) => entry[nameKey]}
            labelLine={{ stroke: '#6b7280' }}
          >
            {rows.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={TEAL_COLORS[index % TEAL_COLORS.length]} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              backgroundColor: '#fff',
              border: '1px solid #e5e7eb',
              borderRadius: '6px',
            }}
          />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    );
  }

  return null;
}
