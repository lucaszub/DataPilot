"use client";

import React from 'react';
import { Play, Table, Sheet, BarChart3, Grid3x3, Download, Code, Sparkles, Clock, Loader2, Terminal, Filter, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useExplorer, ViewMode, ChartType } from './ExplorerContext';

const viewModeIcons: Record<ViewMode, React.ReactNode> = {
  table: <Table className="h-4 w-4" />,
  spreadsheet: <Sheet className="h-4 w-4" />,
  chart: <BarChart3 className="h-4 w-4" />,
  pivot: <Grid3x3 className="h-4 w-4" />,
};

const viewModeLabels: Record<ViewMode, string> = {
  table: 'Tableau',
  spreadsheet: 'Tableur',
  chart: 'Graphique',
  pivot: 'Pivot',
};

const chartTypeIcons: Record<ChartType, React.ReactNode> = {
  table: <Table className="h-4 w-4" />,
  bar: <BarChart3 className="h-4 w-4" />,
  line: <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
  </svg>,
  pie: <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M21.21 15.89A10 10 0 1 1 8 2.83" />
    <path d="M22 12A10 10 0 0 0 12 2v10z" />
  </svg>,
  kpi: <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
    <polyline points="16 7 22 7 22 13" />
  </svg>,
  area: <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M3 18v-6a9 9 0 0 1 18 0v6" />
    <path d="M21 18H3" />
  </svg>,
};

export function ExplorerToolbar() {
  const { state, dispatch, executeQuery } = useExplorer();

  const setViewMode = (mode: ViewMode) => {
    dispatch({ type: 'SET_VIEW_MODE', mode });
  };

  const setChartType = (chartType: ChartType) => {
    dispatch({ type: 'SET_CHART_TYPE', chartType });
  };

  const toggleSqlMode = () => {
    dispatch({ type: 'SET_SQL_MODE', mode: state.sqlMode === 'visual' ? 'sql' : 'visual' });
  };

  const toggleSqlPreview = () => {
    dispatch({ type: 'TOGGLE_SQL_PREVIEW' });
  };

  const toggleFilters = () => {
    dispatch({ type: 'TOGGLE_FILTERS' });
  };

  const resetQuery = () => {
    dispatch({ type: 'RESET' });
  };

  const toggleHistory = () => {
    dispatch({ type: 'TOGGLE_HISTORY' });
  };

  const toggleAiPanel = () => {
    dispatch({ type: 'TOGGLE_AI_PANEL' });
  };

  const setQueryLimit = (limit: number) => {
    dispatch({ type: 'SET_QUERY_LIMIT', limit });
  };

  const canExecute = state.selectedFields.length > 0;

  return (
    <div className="flex items-center justify-between px-4 py-3 bg-card border-b border-border">
      {/* Left group */}
      <div className="flex items-center gap-3">
        {/* Run button */}
        <button
          onClick={executeQuery}
          disabled={!canExecute || state.isExecuting}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors",
            canExecute && !state.isExecuting
              ? "bg-primary text-white hover:bg-primary/90"
              : "bg-muted text-muted-foreground cursor-not-allowed"
          )}
        >
          {state.isExecuting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Play className="h-4 w-4" />
          )}
          <span>Exécuter</span>
        </button>

        {/* View mode selector */}
        <div className="flex items-center bg-muted rounded-lg p-1">
          {(['table', 'spreadsheet', 'chart'] as ViewMode[]).map((mode) => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors",
                state.viewMode === mode
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {viewModeIcons[mode]}
              <span>{viewModeLabels[mode]}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Center group - Chart type selector (visible in chart mode) */}
      {state.viewMode === 'chart' && (
        <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
          {(['bar', 'line', 'pie', 'area', 'kpi'] as ChartType[]).map((type) => (
            <button
              key={type}
              onClick={() => setChartType(type)}
              className={cn(
                "p-2 rounded-md transition-colors",
                state.chartType === type
                  ? "bg-primary text-white"
                  : "text-muted-foreground hover:text-foreground hover:bg-background"
              )}
              title={type.toUpperCase()}
            >
              {chartTypeIcons[type]}
            </button>
          ))}
        </div>
      )}

      {/* Right group */}
      <div className="flex items-center gap-2">
        {/* Limit input */}
        <div className="flex items-center gap-2 px-3 py-1.5 bg-muted rounded-lg">
          <span className="text-sm text-muted-foreground">Limite:</span>
          <input
            type="number"
            value={state.queryLimit}
            onChange={(e) => {
              const value = parseInt(e.target.value);
              if (!isNaN(value) && value > 0) {
                setQueryLimit(value);
              }
            }}
            className="w-20 px-2 py-0.5 text-sm bg-background border border-border rounded focus:outline-none focus:ring-1 focus:ring-primary"
            min="1"
            max="10000"
          />
        </div>

        {/* Filter toggle */}
        <button
          onClick={toggleFilters}
          className={cn(
            "flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors",
            state.showFilters
              ? "bg-primary/10 text-primary border border-primary/20"
              : "bg-muted text-muted-foreground hover:text-foreground"
          )}
        >
          <Filter className="h-4 w-4" />
          <span>Filtres</span>
          {state.filters.length > 0 && (
            <span className="px-1.5 py-0.5 text-[10px] bg-primary text-white rounded-full min-w-[18px] text-center">
              {state.filters.length}
            </span>
          )}
        </button>

        {/* SQL Preview toggle */}
        <button
          onClick={toggleSqlPreview}
          className={cn(
            "flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors",
            state.showSqlPreview
              ? "bg-blue-500/10 text-blue-600 border border-blue-500/20"
              : "bg-muted text-muted-foreground hover:text-foreground"
          )}
        >
          <Terminal className="h-4 w-4" />
          <span>SQL</span>
        </button>

        {/* AI button */}
        <button
          onClick={toggleAiPanel}
          className={cn(
            "flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors",
            state.showAiPanel
              ? "bg-primary/10 text-primary border border-primary/20"
              : "bg-muted text-muted-foreground hover:text-foreground"
          )}
        >
          <Sparkles className="h-4 w-4" />
          <span>IA</span>
        </button>

        {/* History button */}
        <button
          onClick={toggleHistory}
          className={cn(
            "flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors",
            state.showHistory
              ? "bg-primary/10 text-primary border border-primary/20"
              : "bg-muted text-muted-foreground hover:text-foreground"
          )}
        >
          <Clock className="h-4 w-4" />
        </button>

        {/* Export */}
        <button
          disabled={!state.result}
          className={cn(
            "flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors",
            state.result
              ? "bg-muted text-foreground hover:bg-muted/80"
              : "bg-muted text-muted-foreground cursor-not-allowed opacity-50"
          )}
        >
          <Download className="h-4 w-4" />
        </button>

        {/* Reset */}
        <button
          onClick={resetQuery}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium bg-muted text-muted-foreground hover:text-foreground transition-colors"
          title="Réinitialiser"
        >
          <RotateCcw className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
