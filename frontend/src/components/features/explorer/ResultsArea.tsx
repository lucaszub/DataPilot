import React from "react";
import {
  Rows3,
  Clock,
  BarChart2,
  LineChart as LineChartIcon,
  PieChart as PieChartIcon,
  Table2,
  Hash,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { QueryResultTable } from "@/components/features/QueryResultTable";
import { ExplorerChart } from "@/components/charts/ExplorerChart";
import type { QueryExecuteResponse } from "@/lib/api";
import type { ChartType, SelectedField } from "./types";

interface ResultsAreaProps {
  result: QueryExecuteResponse | null;
  isExecuting: boolean;
  execError: string | null;
  generatedSql: string;
  viewMode: 'table' | 'chart';
  setViewMode: (mode: 'table' | 'chart') => void;
  chartType: ChartType;
  setChartType: (type: ChartType) => void;
  autoDetectedChartType: ChartType;
  queryLimit: number;
  setQueryLimit: (limit: number) => void;
  selectedFields: SelectedField[];
}

export function ResultsArea({
  result,
  isExecuting,
  execError,
  generatedSql,
  viewMode,
  setViewMode,
  chartType,
  setChartType,
  autoDetectedChartType,
  queryLimit,
  setQueryLimit,
  selectedFields,
}: ResultsAreaProps) {
  if (!result || execError) {
    return null;
  }

  return (
    <>
      <div className="mb-3 flex items-center gap-4 text-sm text-gray-500 border-b border-gray-100 pb-3">
        <span className="flex items-center gap-1.5">
          <Rows3 className="h-4 w-4" />
          {result.row_count.toLocaleString("fr-FR")} ligne{result.row_count > 1 ? "s" : ""}
        </span>
        <span className="flex items-center gap-1.5">
          <Clock className="h-4 w-4" />
          {result.execution_time_ms < 1000
            ? `${Math.round(result.execution_time_ms)} ms`
            : `${(result.execution_time_ms / 1000).toFixed(2)} s`}
        </span>

        {/* View toggle */}
        <div className="flex items-center gap-1 rounded-md border border-gray-200 p-0.5">
          <button
            type="button"
            onClick={() => setViewMode('table')}
            className={cn(
              "flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium transition-colors",
              viewMode === 'table'
                ? "bg-gray-900 text-white"
                : "text-gray-600 hover:bg-gray-50"
            )}
            title="Tableau"
          >
            <Table2 className="h-3.5 w-3.5" />
            Tableau
          </button>
          <button
            type="button"
            onClick={() => {
              setViewMode('chart');
              setChartType(autoDetectedChartType);
            }}
            className={cn(
              "flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium transition-colors",
              viewMode === 'chart'
                ? "bg-gray-900 text-white"
                : "text-gray-600 hover:bg-gray-50"
            )}
            title="Graphique"
          >
            <BarChart2 className="h-3.5 w-3.5" />
            Chart
          </button>
        </div>

        {/* Chart type selector (only visible when chart view is active) */}
        {viewMode === 'chart' && (
          <div className="flex items-center gap-1">
            <span className="text-xs text-gray-600 mr-1">Type:</span>
            <div className="flex items-center gap-0.5 rounded-md border border-gray-200 p-0.5">
              <button
                type="button"
                onClick={() => setChartType('kpi')}
                className={cn(
                  "p-1.5 rounded transition-colors",
                  chartType === 'kpi'
                    ? "bg-teal-100 text-teal-700"
                    : "text-gray-500 hover:bg-gray-50"
                )}
                title="KPI"
              >
                <Hash className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setChartType('bar')}
                className={cn(
                  "p-1.5 rounded transition-colors",
                  chartType === 'bar'
                    ? "bg-teal-100 text-teal-700"
                    : "text-gray-500 hover:bg-gray-50"
                )}
                title="Bar Chart"
              >
                <BarChart2 className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setChartType('line')}
                className={cn(
                  "p-1.5 rounded transition-colors",
                  chartType === 'line'
                    ? "bg-teal-100 text-teal-700"
                    : "text-gray-500 hover:bg-gray-50"
                )}
                title="Line Chart"
              >
                <LineChartIcon className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setChartType('pie')}
                className={cn(
                  "p-1.5 rounded transition-colors",
                  chartType === 'pie'
                    ? "bg-teal-100 text-teal-700"
                    : "text-gray-500 hover:bg-gray-50"
                )}
                title="Pie Chart"
              >
                <PieChartIcon className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setChartType('table')}
                className={cn(
                  "p-1.5 rounded transition-colors",
                  chartType === 'table'
                    ? "bg-teal-100 text-teal-700"
                    : "text-gray-500 hover:bg-gray-50"
                )}
                title="Table"
              >
                <Table2 className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        )}

        <div className="ml-auto flex items-center gap-2">
          <label htmlFor="query-limit" className="text-xs text-gray-600">
            Limite:
          </label>
          <input
            id="query-limit"
            type="number"
            min="10"
            max="10000"
            step="10"
            value={queryLimit}
            onChange={(e) => setQueryLimit(Math.max(10, Math.min(10000, parseInt(e.target.value) || 100)))}
            className="w-20 rounded-md border border-gray-200 bg-white px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-teal-500"
          />
        </div>
      </div>

      {viewMode === 'table' ? (
        <QueryResultTable
          columns={result?.columns ?? []}
          rows={result?.rows ?? []}
          isLoading={isExecuting}
        />
      ) : (
        <ExplorerChart
          chartType={chartType}
          columns={result?.columns ?? []}
          rows={result?.rows ?? []}
        />
      )}
    </>
  );
}
