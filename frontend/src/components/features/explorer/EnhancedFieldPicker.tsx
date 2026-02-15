"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Search, ChevronRight, ChevronDown, Database, Check, BarChart3, Calendar, Hash, Type, TrendingUp, Filter, ArrowUpDown, Calculator, Eye } from 'lucide-react';
import { cn } from '@/lib/utils';
import { api, SavedQueryResponse } from '@/lib/api';
import { useExplorer, SelectedField, ChartType } from './ExplorerContext';

const getTypeIcon = (type: string): React.ReactNode => {
  const upperType = type.toUpperCase();
  if (['DOUBLE', 'FLOAT', 'INTEGER', 'BIGINT', 'SMALLINT', 'DECIMAL', 'TINYINT', 'HUGEINT'].includes(upperType)) {
    return <Hash className="h-3 w-3" />;
  }
  if (['TIMESTAMP', 'DATE', 'TIME'].includes(upperType)) {
    return <Calendar className="h-3 w-3" />;
  }
  if (upperType === 'BOOLEAN') {
    return <Check className="h-3 w-3" />;
  }
  return <Type className="h-3 w-3" />;
};

const chartTypeLabels: Record<ChartType, string> = {
  table: 'Tableau',
  bar: 'Barres',
  line: 'Lignes',
  pie: 'Camembert',
  kpi: 'KPI',
  area: 'Aire',
};

interface ContextMenuState {
  visible: boolean;
  x: number;
  y: number;
  tableName: string;
  columnName: string;
  columnType: string;
  role: 'dimension' | 'measure' | 'key';
}

export function EnhancedFieldPicker() {
  const { state, dispatch, tables, workspaceId } = useExplorer();
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedTables, setExpandedTables] = useState<Set<string>>(new Set(['customers', 'orders']));
  const [showSavedQueries, setShowSavedQueries] = useState(false);
  const [savedQueries, setSavedQueries] = useState<SavedQueryResponse[]>([]);
  const [contextMenu, setContextMenu] = useState<ContextMenuState>({
    visible: false, x: 0, y: 0, tableName: '', columnName: '', columnType: '', role: 'dimension',
  });
  const contextMenuRef = useRef<HTMLDivElement>(null);

  // Load saved queries
  useEffect(() => {
    if (!workspaceId) return;

    const loadQueries = async () => {
      try {
        const queries = await api.queries.listSaved(workspaceId);
        setSavedQueries(queries);
      } catch (error) {
        console.error('Failed to load saved queries:', error);
      }
    };

    loadQueries();
  }, [workspaceId]);

  // Close context menu on outside click
  useEffect(() => {
    const handleClick = () => setContextMenu(prev => ({ ...prev, visible: false }));
    if (contextMenu.visible) {
      document.addEventListener('click', handleClick);
      return () => document.removeEventListener('click', handleClick);
    }
  }, [contextMenu.visible]);

  const handleContextMenu = (e: React.MouseEvent, tableName: string, columnName: string, columnType: string, role: 'dimension' | 'measure' | 'key') => {
    e.preventDefault();
    setContextMenu({
      visible: true,
      x: Math.min(e.clientX, window.innerWidth - 200),
      y: Math.min(e.clientY, window.innerHeight - 250),
      tableName,
      columnName,
      columnType,
      role,
    });
  };

  const handleContextAction = (action: 'add' | 'filter' | 'sort_asc' | 'sort_desc' | 'preview') => {
    const { tableName, columnName, columnType, role } = contextMenu;
    switch (action) {
      case 'add':
        addField(tableName, columnName, columnType, role);
        break;
      case 'filter':
        dispatch({
          type: 'ADD_FILTER',
          filter: {
            id: `filter-${Date.now()}`,
            column: columnName,
            tableName,
            type: columnType,
            operator: 'equals',
            value: '',
          },
        });
        break;
      case 'sort_asc':
        dispatch({
          type: 'ADD_SORT',
          sort: {
            id: `sort-${Date.now()}`,
            column: columnName,
            tableName,
            direction: 'ASC',
          },
        });
        break;
      case 'sort_desc':
        dispatch({
          type: 'ADD_SORT',
          sort: {
            id: `sort-${Date.now()}`,
            column: columnName,
            tableName,
            direction: 'DESC',
          },
        });
        break;
      case 'preview':
        dispatch({ type: 'TOGGLE_SQL_PREVIEW' });
        break;
    }
    setContextMenu(prev => ({ ...prev, visible: false }));
  };

  const toggleTable = (tableName: string) => {
    setExpandedTables(prev => {
      const next = new Set(prev);
      if (next.has(tableName)) {
        next.delete(tableName);
      } else {
        next.add(tableName);
      }
      return next;
    });
  };

  const isFieldSelected = (tableName: string, columnName: string) => {
    return state.selectedFields.some(f => f.tableName === tableName && f.name === columnName);
  };

  const addField = (tableName: string, columnName: string, columnType: string, role: 'dimension' | 'measure' | 'key') => {
    const field: SelectedField = {
      id: `${tableName}.${columnName}`,
      name: columnName,
      tableName,
      type: columnType,
      role,
      aggregation: role === 'measure' ? 'SUM' : 'none',
      dateGranularity: ['TIMESTAMP', 'DATE', 'TIME'].includes(columnType.toUpperCase()) ? 'month' : 'raw',
    };
    dispatch({ type: 'ADD_FIELD', field });
  };

  const addAllDimensions = (tableName: string) => {
    const table = tables.find(t => t.name === tableName);
    if (!table) return;

    table.columns
      .filter(col => col.role === 'dimension')
      .forEach(col => {
        if (!isFieldSelected(tableName, col.name)) {
          addField(tableName, col.name, col.type, col.role);
        }
      });
  };

  const addAllMeasures = (tableName: string) => {
    const table = tables.find(t => t.name === tableName);
    if (!table) return;

    table.columns
      .filter(col => col.role === 'measure')
      .forEach(col => {
        if (!isFieldSelected(tableName, col.name)) {
          addField(tableName, col.name, col.type, col.role);
        }
      });
  };

  const loadSavedQuery = (queryId: string) => {
    const query = savedQueries.find(q => q.id === queryId);
    if (!query) return;
    dispatch({
      type: 'LOAD_SAVED_SQL',
      sql: query.sql_text,
      chartType: query.chart_type as ChartType
    });
  };

  const filteredTables = tables.filter(table => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      table.displayName.toLowerCase().includes(query) ||
      table.columns.some(col => col.name.toLowerCase().includes(query))
    );
  });

  return (
    <div className="h-full flex flex-col bg-card border-r border-border">
      {/* Search */}
      <div className="p-3 border-b border-border">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Rechercher un champ..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>
      </div>

      {/* Tables */}
      <div className="flex-1 overflow-y-auto">
        {filteredTables.map(table => {
          const isExpanded = expandedTables.has(table.name);
          const dimensions = table.columns.filter(col => col.role === 'dimension');
          const measures = table.columns.filter(col => col.role === 'measure');

          return (
            <div key={table.name} className="border-b border-border">
              {/* Table header */}
              <button
                onClick={() => toggleTable(table.name)}
                className="w-full px-3 py-2.5 flex items-center gap-2 hover:bg-muted/50 transition-colors"
              >
                {isExpanded ? (
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                )}
                <Database className="h-4 w-4 text-primary" />
                <span className="flex-1 text-left text-sm font-medium text-foreground">
                  {table.displayName}
                </span>
                <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                  {table.rowCount}
                </span>
              </button>

              {/* Columns */}
              {isExpanded && (
                <div className="pb-2">
                  {/* Dimensions */}
                  {dimensions.length > 0 && (
                    <div className="mb-2">
                      <div className="px-3 py-1.5 flex items-center justify-between">
                        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                          Dimensions
                        </span>
                        <button
                          onClick={() => addAllDimensions(table.name)}
                          className="text-xs text-primary hover:text-primary/80 hover:underline"
                        >
                          Ajouter tout
                        </button>
                      </div>
                      {dimensions.map(col => {
                        const selected = isFieldSelected(table.name, col.name);
                        return (
                          <button
                            key={col.name}
                            onClick={() => !selected && addField(table.name, col.name, col.type, col.role)}
                            onContextMenu={(e) => handleContextMenu(e, table.name, col.name, col.type, col.role)}
                            className={cn(
                              "w-full px-3 py-1.5 flex items-center gap-2 hover:bg-muted/50 transition-colors",
                              selected && "bg-primary/10"
                            )}
                            title={col.name}
                          >
                            <div className="h-2 w-2 rounded-full bg-blue-500" />
                            <div className="text-muted-foreground">
                              {getTypeIcon(col.type)}
                            </div>
                            <span className="flex-1 text-left text-sm text-foreground">
                              {col.name}
                            </span>
                            {selected && <Check className="h-4 w-4 text-primary" />}
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {/* Measures */}
                  {measures.length > 0 && (
                    <div>
                      <div className="px-3 py-1.5 flex items-center justify-between">
                        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                          Mesures
                        </span>
                        <button
                          onClick={() => addAllMeasures(table.name)}
                          className="text-xs text-primary hover:text-primary/80 hover:underline"
                        >
                          Ajouter tout
                        </button>
                      </div>
                      {measures.map(col => {
                        const selected = isFieldSelected(table.name, col.name);
                        return (
                          <button
                            key={col.name}
                            onClick={() => !selected && addField(table.name, col.name, col.type, col.role)}
                            onContextMenu={(e) => handleContextMenu(e, table.name, col.name, col.type, col.role)}
                            className={cn(
                              "w-full px-3 py-1.5 flex items-center gap-2 hover:bg-muted/50 transition-colors",
                              selected && "bg-primary/10"
                            )}
                            title={col.name}
                          >
                            <div className="h-2 w-2 rounded-full bg-primary" />
                            <div className="text-muted-foreground">
                              {getTypeIcon(col.type)}
                            </div>
                            <span className="flex-1 text-left text-sm text-foreground">
                              {col.name}
                            </span>
                            {selected && <Check className="h-4 w-4 text-primary" />}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Saved Queries */}
      <div className="border-t border-border">
        <button
          onClick={() => setShowSavedQueries(!showSavedQueries)}
          className="w-full px-3 py-2.5 flex items-center gap-2 hover:bg-muted/50 transition-colors"
        >
          {showSavedQueries ? (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          )}
          <TrendingUp className="h-4 w-4 text-primary" />
          <span className="flex-1 text-left text-sm font-medium text-foreground">
            Requêtes sauvegardées
          </span>
          <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
            {savedQueries.length}
          </span>
        </button>

        {showSavedQueries && (
          <div className="max-h-48 overflow-y-auto">
            {savedQueries.map(query => (
              <button
                key={query.id}
                onClick={() => loadSavedQuery(query.id)}
                className="w-full px-3 py-2 hover:bg-muted/50 transition-colors text-left"
              >
                <div className="flex items-center gap-2">
                  <BarChart3 className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-foreground truncate">
                      {query.name}
                    </div>
                    {query.sql_text && (
                      <div className="text-xs text-muted-foreground truncate font-mono">
                        {query.sql_text.substring(0, 40)}...
                      </div>
                    )}
                  </div>
                  <span className="text-xs text-primary bg-primary/10 px-2 py-0.5 rounded-full flex-shrink-0">
                    {chartTypeLabels[query.chart_type as ChartType]}
                  </span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Context Menu */}
      {contextMenu.visible && (
        <div
          ref={contextMenuRef}
          style={{ position: 'fixed', left: contextMenu.x, top: contextMenu.y, zIndex: 100 }}
          className="w-52 bg-card border border-border rounded-lg shadow-xl overflow-hidden"
        >
          <div className="px-3 py-1.5 bg-muted/50 border-b border-border">
            <span className="text-xs font-medium text-foreground">{contextMenu.tableName}.{contextMenu.columnName}</span>
          </div>
          <div className="py-1">
            <button
              onClick={() => handleContextAction('add')}
              className="w-full px-3 py-1.5 flex items-center gap-2 text-sm text-foreground hover:bg-muted/50 transition-colors"
            >
              <Eye className="h-3.5 w-3.5 text-muted-foreground" />
              Ajouter à la requête
            </button>
            <button
              onClick={() => handleContextAction('filter')}
              className="w-full px-3 py-1.5 flex items-center gap-2 text-sm text-foreground hover:bg-muted/50 transition-colors"
            >
              <Filter className="h-3.5 w-3.5 text-muted-foreground" />
              Filtrer par ce champ
            </button>
            <button
              onClick={() => handleContextAction('sort_asc')}
              className="w-full px-3 py-1.5 flex items-center gap-2 text-sm text-foreground hover:bg-muted/50 transition-colors"
            >
              <ArrowUpDown className="h-3.5 w-3.5 text-muted-foreground" />
              Trier croissant
            </button>
            <button
              onClick={() => handleContextAction('sort_desc')}
              className="w-full px-3 py-1.5 flex items-center gap-2 text-sm text-foreground hover:bg-muted/50 transition-colors"
            >
              <ArrowUpDown className="h-3.5 w-3.5 text-muted-foreground" />
              Trier décroissant
            </button>
            <div className="border-t border-border my-1" />
            <button
              onClick={() => handleContextAction('preview')}
              className="w-full px-3 py-1.5 flex items-center gap-2 text-sm text-foreground hover:bg-muted/50 transition-colors"
            >
              <Calculator className="h-3.5 w-3.5 text-muted-foreground" />
              Voir le SQL
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
