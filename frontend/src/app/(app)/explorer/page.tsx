"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import useSWR from "swr";
import { Play, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { SqlEditor } from "@/components/features/SqlEditor";
import { useSavedQueries } from "@/hooks/useQueries";
import {
  api,
  type WorkspaceResponse,
  type QueryExecuteResponse,
  type SemanticLayerDetail,
  type SemanticLayerListItem,
} from "@/lib/api";

// Import extracted components
import { ExplorerSidebar } from "@/components/features/explorer/ExplorerSidebar";
import { SelectedFieldsBar } from "@/components/features/explorer/SelectedFieldsBar";
import { ResultsArea } from "@/components/features/explorer/ResultsArea";

// Import types and utils
import type {
  SelectedField,
  QueryFilter,
  SortRule,
  ChartType,
  AggregationType,
  DateGranularity,
  FilterOperator,
} from "@/components/features/explorer/types";
import { isNumericType, isDateType } from "@/components/features/explorer/utils";

export default function ExplorerPage() {
  // --- State ---
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState<string | null>(null);
  const [selectedFields, setSelectedFields] = useState<SelectedField[]>([]);
  const [result, setResult] = useState<QueryExecuteResponse | null>(null);
  const [isExecuting, setIsExecuting] = useState(false);
  const [execError, setExecError] = useState<string | null>(null);
  const [showSql, setShowSql] = useState(false);

  // SQL mode state
  const [sqlMode, setSqlMode] = useState<'visual' | 'sql'>('visual');
  const [customSql, setCustomSql] = useState('');

  // Saved query UI
  const [showSaveForm, setShowSaveForm] = useState(false);
  const [saveName, setSaveName] = useState("");
  const [saveChartType, setSaveChartType] = useState<string>("table");
  const [isSaving, setIsSaving] = useState(false);

  // Sidebar state
  const [expandedModels, setExpandedModels] = useState<Set<string>>(new Set());
  const [showSavedQueries, setShowSavedQueries] = useState(true);

  // Chart state
  const [viewMode, setViewMode] = useState<'table' | 'chart'>('table');
  const [chartType, setChartType] = useState<ChartType>('bar');

  // Aggregation dropdown state
  const [openDropdownIndex, setOpenDropdownIndex] = useState<number | null>(null);
  const [openDateDropdownIndex, setOpenDateDropdownIndex] = useState<number | null>(null);

  // Filters and sorting state
  const [filters, setFilters] = useState<QueryFilter[]>([]);
  const [sortRules, setSortRules] = useState<SortRule[]>([]);
  const [queryLimit, setQueryLimit] = useState<number>(100);
  const [showFilters, setShowFilters] = useState(false);
  const [showSorts, setShowSorts] = useState(false);

  // --- Data fetching ---
  const { data: workspaces, isLoading: wsLoading } = useSWR<WorkspaceResponse[]>(
    "workspaces-list",
    () => api.workspaces.list()
  );

  // Auto-select first workspace
  React.useEffect(() => {
    if (workspaces && workspaces.length > 0 && !selectedWorkspaceId) {
      setSelectedWorkspaceId(workspaces[0].id);
    }
  }, [workspaces, selectedWorkspaceId]);

  const { data: semanticLayer } = useSWR<SemanticLayerListItem[]>(
    selectedWorkspaceId ? `semantic-layers-${selectedWorkspaceId}` : null,
    () => api.semanticLayers.list(selectedWorkspaceId!)
  );

  const { savedQueries, mutate: mutateSaved } = useSavedQueries(selectedWorkspaceId);

  // Fetch full semantic layer detail for columns
  const { data: layerDetail } = useSWR<SemanticLayerDetail>(
    semanticLayer && semanticLayer.length > 0 ? `semantic-layer-detail-${semanticLayer[0].id}` : null,
    () => api.semanticLayers.getById(semanticLayer![0].id)
  );

  const metrics = useMemo(() => {
    if (!layerDetail?.definitions_json) return [];
    const allMetrics: Array<{ name: string; tableName: string }> = [];

    for (const node of layerDetail.definitions_json.nodes) {
      for (const col of node.columns) {
        if (col.role === 'measure') {
          allMetrics.push({ name: col.name, tableName: node.data_source_name });
        }
      }
    }
    return allMetrics;
  }, [layerDetail]);

  // Auto-detect best chart type based on selected fields
  const autoDetectedChartType = useMemo((): ChartType => {
    if (selectedFields.length === 0) return 'table';

    const numericFields = selectedFields.filter(f => isNumericType(f.type));
    const dateFields = selectedFields.filter(f => isDateType(f.type));
    const dimensionFields = selectedFields.filter(f => !isNumericType(f.type));

    // KPI: exactly 1 numeric field, no dimensions
    if (numericFields.length === 1 && dimensionFields.length === 0) {
      return 'kpi';
    }

    // Line chart: date dimension + numeric measure
    if (dateFields.length >= 1 && numericFields.length >= 1) {
      return 'line';
    }

    // Pie chart: 1 text dimension + 1 numeric measure
    if (dimensionFields.length === 1 && numericFields.length === 1 && !dateFields.length) {
      return 'pie';
    }

    // Bar chart: 1+ dimension + 1+ numeric measure
    if (dimensionFields.length >= 1 && numericFields.length >= 1) {
      return 'bar';
    }

    // Fallback
    return 'table';
  }, [selectedFields]);

  // Update chart type when auto-detection changes and we're in chart view
  useEffect(() => {
    if (viewMode === 'chart') {
      setChartType(autoDetectedChartType);
    }
  }, [autoDetectedChartType, viewMode]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (openDropdownIndex !== null || openDateDropdownIndex !== null) {
        setOpenDropdownIndex(null);
        setOpenDateDropdownIndex(null);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [openDropdownIndex, openDateDropdownIndex]);

  // --- Helper: Generate WHERE clause from filters ---
  const generateWhereClause = useCallback((filterList: QueryFilter[]): string => {
    if (filterList.length === 0) return '';

    const conditions = filterList.map(filter => {
      // Skip filters with empty values (except null-check operators)
      const nullOps: FilterOperator[] = ['is_null', 'is_not_null', 'date_this_month', 'date_this_year', 'date_last_year'];
      if (!nullOps.includes(filter.operator) && !filter.value.trim()) return '';

      const qualifiedColumn = `${filter.tableName}.${filter.column}`;
      const escapedValue = filter.value.replace(/'/g, "''"); // SQL escape single quotes
      const escapedValue2 = filter.value2 ? filter.value2.replace(/'/g, "''") : '';

      switch (filter.operator) {
        // Text operators
        case 'equals':
          return `${qualifiedColumn} = '${escapedValue}'`;
        case 'not_equals':
          return `${qualifiedColumn} <> '${escapedValue}'`;
        case 'contains':
          return `${qualifiedColumn} LIKE '%${escapedValue}%'`;
        case 'not_contains':
          return `${qualifiedColumn} NOT LIKE '%${escapedValue}%'`;
        case 'starts_with':
          return `${qualifiedColumn} LIKE '${escapedValue}%'`;
        case 'ends_with':
          return `${qualifiedColumn} LIKE '%${escapedValue}'`;
        case 'is_null':
          return `${qualifiedColumn} IS NULL`;
        case 'is_not_null':
          return `${qualifiedColumn} IS NOT NULL`;

        // Numeric operators
        case 'gt':
          return `${qualifiedColumn} > ${escapedValue}`;
        case 'gte':
          return `${qualifiedColumn} >= ${escapedValue}`;
        case 'lt':
          return `${qualifiedColumn} < ${escapedValue}`;
        case 'lte':
          return `${qualifiedColumn} <= ${escapedValue}`;
        case 'between':
          return `${qualifiedColumn} BETWEEN ${escapedValue} AND ${escapedValue2}`;

        // Date operators
        case 'date_equals':
          return `${qualifiedColumn} = '${escapedValue}'`;
        case 'date_before':
          return `${qualifiedColumn} < '${escapedValue}'`;
        case 'date_after':
          return `${qualifiedColumn} > '${escapedValue}'`;
        case 'date_between':
          return `${qualifiedColumn} BETWEEN '${escapedValue}' AND '${escapedValue2}'`;
        case 'date_last_n_days':
          return `${qualifiedColumn} >= CURRENT_DATE - INTERVAL '${escapedValue} days'`;
        case 'date_last_n_months':
          return `${qualifiedColumn} >= CURRENT_DATE - INTERVAL '${escapedValue} months'`;
        case 'date_this_month':
          return `${qualifiedColumn} >= DATE_TRUNC('month', CURRENT_DATE)`;
        case 'date_this_year':
          return `${qualifiedColumn} >= DATE_TRUNC('year', CURRENT_DATE)`;
        case 'date_last_year':
          return `${qualifiedColumn} >= DATE_TRUNC('year', CURRENT_DATE - INTERVAL '1 year') AND ${qualifiedColumn} < DATE_TRUNC('year', CURRENT_DATE)`;

        default:
          return '';
      }
    }).filter(Boolean);

    return conditions.length > 0 ? `\nWHERE ${conditions.join(' AND ')}` : '';
  }, []);

  // --- Helper: Generate ORDER BY clause ---
  const generateOrderByClause = useCallback((sortList: SortRule[]): string => {
    if (sortList.length === 0) return '';
    const sortParts = sortList.map(sort => `${sort.tableName}.${sort.column} ${sort.direction}`);
    return `\nORDER BY ${sortParts.join(', ')}`;
  }, []);

  // --- SQL Generation with JOIN support ---
  const generatedSql = useMemo(() => {
    if (selectedFields.length === 0) return '';

    const tables = [...new Set(selectedFields.map(f => f.tableName))];
    const hasAggregation = selectedFields.some(f => f.aggregation !== 'none');

    // If only one table, no JOINs needed
    if (tables.length === 1) {
      const selectParts = selectedFields.map(f => {
        const qualifiedName = `${f.tableName}.${f.name}`;

        // Handle date granularity first
        let baseExpression = qualifiedName;
        let alias = f.name;
        if (isDateType(f.type) && f.dateGranularity !== 'raw') {
          baseExpression = `DATE_TRUNC('${f.dateGranularity}', ${qualifiedName})`;
          alias = `${f.name}_${f.dateGranularity}`;
        }

        // Then handle aggregation
        if (f.aggregation !== 'none') {
          if (f.aggregation === 'COUNT_DISTINCT') {
            return `COUNT(DISTINCT ${baseExpression}) AS ${alias}_count_distinct`;
          } else if (f.aggregation === 'MEDIAN') {
            return `MEDIAN(${baseExpression}) AS ${alias}_median`;
          }
          return `${f.aggregation}(${baseExpression}) AS ${alias}_${f.aggregation.toLowerCase()}`;
        }

        // No aggregation
        if (isDateType(f.type) && f.dateGranularity !== 'raw') {
          return `${baseExpression} AS ${alias}`;
        }
        return qualifiedName;
      });

      let sql = `SELECT ${selectParts.join(', ')}\nFROM ${tables[0]}`;

      // Add WHERE clause
      sql += generateWhereClause(filters);

      if (hasAggregation) {
        const groupByCols = selectedFields
          .filter(f => f.aggregation === 'none')
          .map(f => {
            const qualifiedName = `${f.tableName}.${f.name}`;
            if (isDateType(f.type) && f.dateGranularity !== 'raw') {
              return `DATE_TRUNC('${f.dateGranularity}', ${qualifiedName})`;
            }
            return qualifiedName;
          });
        if (groupByCols.length > 0) {
          sql += `\nGROUP BY ${groupByCols.join(', ')}`;
        }
      }

      // Add ORDER BY clause
      sql += generateOrderByClause(sortRules);

      sql += `\nLIMIT ${queryLimit}`;
      return sql;
    }

    // Multi-table query — need JOINs
    if (!layerDetail?.definitions_json?.edges || !layerDetail?.definitions_json?.nodes) {
      return '-- Error: Semantic layer edges not available';
    }

    // Extract definitions for type safety
    const definitions = layerDetail.definitions_json;
    const { nodes, edges } = definitions;

    // Build node ID → table name map
    const nodeIdToTable = new Map<string, string>();
    for (const node of nodes) {
      nodeIdToTable.set(node.id, node.data_source_name);
    }

    // Build adjacency list from edges (bidirectional for pathfinding)
    type EdgeWithDetails = { targetNode: string; edge: typeof edges[number] };
    const graph = new Map<string, EdgeWithDetails[]>();

    for (const edge of edges) {
      // Forward edge
      if (!graph.has(edge.source_node)) {
        graph.set(edge.source_node, []);
      }
      graph.get(edge.source_node)!.push({ targetNode: edge.target_node, edge });

      // Reverse edge (for pathfinding)
      if (!graph.has(edge.target_node)) {
        graph.set(edge.target_node, []);
      }
      graph.get(edge.target_node)!.push({
        targetNode: edge.source_node,
        edge: {
          ...edge,
          // Swap source/target for reverse traversal
          source_node: edge.target_node,
          source_column: edge.target_column,
          target_node: edge.source_node,
          target_column: edge.source_column,
        }
      });
    }

    // Find node IDs for each table
    const tableToNodeId = new Map<string, string>();
    for (const [nodeId, tableName] of nodeIdToTable.entries()) {
      tableToNodeId.set(tableName, nodeId);
    }

    // Find paths between tables using BFS
    function findPath(startTable: string, endTable: string): typeof edges | null {
      const startNode = tableToNodeId.get(startTable);
      const endNode = tableToNodeId.get(endTable);
      if (!startNode || !endNode) return null;

      const visited = new Set<string>();
      const queue: Array<{ node: string; path: typeof edges }> = [
        { node: startNode, path: [] }
      ];

      while (queue.length > 0) {
        const { node, path } = queue.shift()!;

        if (node === endNode) {
          return path;
        }

        if (visited.has(node)) continue;
        visited.add(node);

        const neighbors = graph.get(node) || [];
        for (const { targetNode, edge } of neighbors) {
          if (!visited.has(targetNode)) {
            queue.push({ node: targetNode, path: [...path, edge] });
          }
        }
      }

      return null;
    }

    // Determine primary table (most selected fields)
    const tableCounts = new Map<string, number>();
    for (const field of selectedFields) {
      tableCounts.set(field.tableName, (tableCounts.get(field.tableName) || 0) + 1);
    }
    const primaryTable = tables.reduce((a, b) =>
      (tableCounts.get(a) || 0) > (tableCounts.get(b) || 0) ? a : b
    );

    // Collect all edges needed to join all tables
    const joinEdges: typeof edges = [];
    const joinedTables = new Set<string>([primaryTable]);

    for (const table of tables) {
      if (table === primaryTable) continue;

      const path = findPath(primaryTable, table);
      if (!path) {
        return `-- Error: No join path found between ${primaryTable} and ${table}`;
      }

      // Add edges from the path that connect new tables
      for (const edge of path) {
        const sourceTable = nodeIdToTable.get(edge.source_node);
        const targetTable = nodeIdToTable.get(edge.target_node);

        if (!sourceTable || !targetTable) continue;

        // Only add edge if it connects a new table
        if (!joinedTables.has(targetTable)) {
          joinEdges.push(edge);
          joinedTables.add(targetTable);
        }
      }
    }

    // Build SELECT clause with qualified column names
    const selectParts = selectedFields.map(f => {
      const qualifiedName = `${f.tableName}.${f.name}`;

      // Handle date granularity first
      let baseExpression = qualifiedName;
      let alias = f.name;
      if (isDateType(f.type) && f.dateGranularity !== 'raw') {
        baseExpression = `DATE_TRUNC('${f.dateGranularity}', ${qualifiedName})`;
        alias = `${f.name}_${f.dateGranularity}`;
      }

      // Then handle aggregation
      if (f.aggregation !== 'none') {
        if (f.aggregation === 'COUNT_DISTINCT') {
          return `COUNT(DISTINCT ${baseExpression}) AS ${alias}_count_distinct`;
        } else if (f.aggregation === 'MEDIAN') {
          return `MEDIAN(${baseExpression}) AS ${alias}_median`;
        }
        return `${f.aggregation}(${baseExpression}) AS ${alias}_${f.aggregation.toLowerCase()}`;
      }

      // No aggregation
      if (isDateType(f.type) && f.dateGranularity !== 'raw') {
        return `${baseExpression} AS ${alias}`;
      }
      return qualifiedName;
    });

    let sql = `SELECT ${selectParts.join(', ')}\nFROM ${primaryTable}`;

    // Build JOIN clauses
    for (const edge of joinEdges) {
      const sourceTable = nodeIdToTable.get(edge.source_node);
      const targetTable = nodeIdToTable.get(edge.target_node);

      if (!sourceTable || !targetTable) continue;

      sql += `\n${edge.join_type} JOIN ${targetTable} ON ${sourceTable}.${edge.source_column} = ${targetTable}.${edge.target_column}`;
    }

    // Add WHERE clause
    sql += generateWhereClause(filters);

    // Build GROUP BY clause
    if (hasAggregation) {
      const groupByCols = selectedFields
        .filter(f => f.aggregation === 'none')
        .map(f => {
          const qualifiedName = `${f.tableName}.${f.name}`;
          if (isDateType(f.type) && f.dateGranularity !== 'raw') {
            return `DATE_TRUNC('${f.dateGranularity}', ${qualifiedName})`;
          }
          return qualifiedName;
        });
      if (groupByCols.length > 0) {
        sql += `\nGROUP BY ${groupByCols.join(', ')}`;
      }
    }

    // Add ORDER BY clause
    sql += generateOrderByClause(sortRules);

    sql += `\nLIMIT ${queryLimit}`;
    return sql;
  }, [selectedFields, layerDetail, filters, sortRules, queryLimit, generateWhereClause, generateOrderByClause]);

  // --- Handlers ---
  const addField = useCallback((columnName: string, tableName: string, colType: string, colRole?: 'dimension' | 'measure' | 'ignore') => {
    setSelectedFields(prev => {
      // Don't add duplicates
      if (prev.some(f => f.name === columnName && f.tableName === tableName)) {
        return prev;
      }

      // Smart defaults based on role or type
      let defaultAggregation: AggregationType = 'none';
      let defaultDateGranularity: DateGranularity = 'raw';

      if (colRole === 'measure' || (colRole !== 'dimension' && isNumericType(colType))) {
        defaultAggregation = 'SUM';
      }

      if (isDateType(colType)) {
        defaultDateGranularity = 'month';
      }

      return [...prev, {
        name: columnName,
        tableName,
        type: colType,
        aggregation: defaultAggregation,
        dateGranularity: defaultDateGranularity,
      }];
    });
  }, []);

  const removeField = useCallback((index: number) => {
    setSelectedFields(prev => prev.filter((_, i) => i !== index));
  }, []);

  const updateAggregation = useCallback((index: number, aggregation: AggregationType) => {
    setSelectedFields(prev => prev.map((f, i) => {
      if (i !== index) return f;
      return { ...f, aggregation };
    }));
    setOpenDropdownIndex(null);
  }, []);

  const updateDateGranularity = useCallback((index: number, granularity: DateGranularity) => {
    setSelectedFields(prev => prev.map((f, i) => {
      if (i !== index) return f;
      return { ...f, dateGranularity: granularity };
    }));
    setOpenDateDropdownIndex(null);
  }, []);

  // --- Filter handlers ---
  const addFilter = useCallback(() => {
    // Find the first available column from expanded models
    if (!layerDetail?.definitions_json?.nodes) return;

    const firstNode = layerDetail.definitions_json.nodes[0];
    const firstColumn = firstNode.columns.find(col => col.role !== 'ignore');

    if (!firstColumn) return;

    const newFilter: QueryFilter = {
      id: `filter-${Date.now()}-${Math.random()}`,
      column: firstColumn.name,
      tableName: firstNode.data_source_name,
      type: firstColumn.type,
      operator: isDateType(firstColumn.type) ? 'date_equals' : isNumericType(firstColumn.type) ? 'equals' : 'equals',
      value: '',
    };

    setFilters(prev => [...prev, newFilter]);
    setShowFilters(true);
  }, [layerDetail]);

  const updateFilter = useCallback((filterId: string, updates: Partial<QueryFilter>) => {
    setFilters(prev => prev.map(f => {
      if (f.id !== filterId) return f;

      // If column changed, reset operator and values
      if (updates.column !== undefined || updates.tableName !== undefined) {
        const newColumn = updates.column ?? f.column;
        const newTableName = updates.tableName ?? f.tableName;

        // Find the column type
        const node = layerDetail?.definitions_json?.nodes.find(n => n.data_source_name === newTableName);
        const col = node?.columns.find(c => c.name === newColumn);
        const newType = col?.type ?? f.type;

        return {
          ...f,
          ...updates,
          type: newType,
          operator: isDateType(newType) ? 'date_equals' : isNumericType(newType) ? 'equals' : 'equals',
          value: '',
          value2: undefined,
        };
      }

      return { ...f, ...updates };
    }));
  }, [layerDetail]);

  const removeFilter = useCallback((filterId: string) => {
    setFilters(prev => prev.filter(f => f.id !== filterId));
  }, []);

  // --- Sort handlers ---
  const addSort = useCallback(() => {
    // Find the first available column from expanded models
    if (!layerDetail?.definitions_json?.nodes) return;

    const firstNode = layerDetail.definitions_json.nodes[0];
    const firstColumn = firstNode.columns.find(col => col.role !== 'ignore');

    if (!firstColumn) return;

    const newSort: SortRule = {
      column: firstColumn.name,
      tableName: firstNode.data_source_name,
      direction: 'ASC',
    };

    setSortRules(prev => [...prev, newSort]);
    setShowSorts(true);
  }, [layerDetail]);

  const updateSort = useCallback((index: number, updates: Partial<SortRule>) => {
    setSortRules(prev => prev.map((s, i) => i === index ? { ...s, ...updates } : s));
  }, []);

  const removeSort = useCallback((index: number) => {
    setSortRules(prev => prev.filter((_, i) => i !== index));
  }, []);

  // Sync generatedSql to customSql when in visual mode
  useEffect(() => {
    if (sqlMode === 'visual') {
      setCustomSql(generatedSql);
    }
  }, [generatedSql, sqlMode]);

  // Get the current SQL to execute
  const currentSql = sqlMode === 'sql' ? customSql : generatedSql;

  // Auto-execute when fields/filters/sorts/limit change in visual mode (debounced)
  useEffect(() => {
    if (sqlMode === 'sql') return; // Don't auto-execute in SQL mode
    if (selectedFields.length === 0 || !selectedWorkspaceId) {
      setResult(null);
      return;
    }

    const timeoutId = setTimeout(async () => {
      setIsExecuting(true);
      setExecError(null);

      try {
        const response = await api.queries.execute({
          sql_text: generatedSql,
          workspace_id: selectedWorkspaceId,
        });
        setResult(response);
      } catch (err) {
        setExecError(err instanceof Error ? err.message : "Erreur lors de l'execution.");
        setResult(null);
      } finally {
        setIsExecuting(false);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [selectedFields, filters, sortRules, queryLimit, selectedWorkspaceId, generatedSql, sqlMode]);

  const handleExecute = useCallback(async () => {
    if (!selectedWorkspaceId) return;
    const sqlToExecute = sqlMode === 'sql' ? customSql : generatedSql;
    if (!sqlToExecute.trim()) return;

    setIsExecuting(true);
    setExecError(null);

    try {
      const response = await api.queries.execute({
        sql_text: sqlToExecute,
        workspace_id: selectedWorkspaceId,
      });
      setResult(response);
    } catch (err) {
      setExecError(err instanceof Error ? err.message : "Erreur lors de l'execution.");
      setResult(null);
    } finally {
      setIsExecuting(false);
    }
  }, [selectedWorkspaceId, customSql, generatedSql, sqlMode]);

  async function handleSaveQuery(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedWorkspaceId || !saveName.trim()) return;
    const sqlToSave = sqlMode === 'sql' ? customSql : generatedSql;
    if (!sqlToSave.trim()) return;

    setIsSaving(true);
    try {
      await api.queries.createSaved({
        name: saveName.trim(),
        sql_text: sqlToSave,
        workspace_id: selectedWorkspaceId,
        chart_type: saveChartType || null,
      });
      mutateSaved();
      setShowSaveForm(false);
      setSaveName("");
    } catch {
      // Error silently handled — user can retry
    } finally {
      setIsSaving(false);
    }
  }

  function handleLoadSavedQuery(queryText: string) {
    // Parse the SQL to extract fields (basic implementation)
    // For now, just show the SQL — user can rebuild selection manually
    setShowSql(true);
    // TODO: Parse SQL to rebuild selectedFields
  }

  async function handleDeleteSaved(queryId: string) {
    try {
      await api.queries.deleteSaved(queryId);
      mutateSaved();
    } catch {
      // Silent
    }
  }

  function toggleModel(modelName: string) {
    setExpandedModels(prev => {
      const next = new Set(prev);
      if (next.has(modelName)) {
        next.delete(modelName);
      } else {
        next.add(modelName);
      }
      return next;
    });
  }

  // --- Render ---
  return (
    <div className="flex h-[calc(100vh-3rem)] bg-gray-50">
      {/* Left Sidebar */}
      <ExplorerSidebar
        workspaces={workspaces}
        selectedWorkspaceId={selectedWorkspaceId}
        setSelectedWorkspaceId={setSelectedWorkspaceId}
        layerDetail={layerDetail}
        expandedModels={expandedModels}
        toggleModel={toggleModel}
        selectedFields={selectedFields}
        addField={addField}
        metrics={metrics}
        savedQueries={savedQueries}
        showSavedQueries={showSavedQueries}
        setShowSavedQueries={setShowSavedQueries}
        handleLoadSavedQuery={handleLoadSavedQuery}
        handleDeleteSaved={handleDeleteSaved}
        wsLoading={wsLoading}
      />

      {/* Main content */}
      <div className="flex flex-1 flex-col min-w-0 overflow-hidden">
        {/* Header bar */}
        <div className="flex items-center justify-between border-b border-gray-200 bg-white px-4 py-2.5">
          <h1 className="text-lg font-semibold text-gray-900">Explorateur de données</h1>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowSaveForm(!showSaveForm)}
              disabled={sqlMode === 'visual' ? selectedFields.length === 0 : !currentSql.trim()}
              className="gap-1.5"
            >
              <Save className="h-3.5 w-3.5" />
              Save
            </Button>
            <Button
              size="sm"
              onClick={handleExecute}
              disabled={isExecuting || !selectedWorkspaceId || (sqlMode === 'visual' ? selectedFields.length === 0 : !currentSql.trim())}
              aria-busy={isExecuting}
              className="gap-1.5 bg-teal-600 hover:bg-teal-700"
            >
              <Play className="h-3.5 w-3.5" />
              {isExecuting ? "Running..." : "Run"}
            </Button>
          </div>
        </div>

        {/* Save form (inline) */}
        {showSaveForm && (
          <form
            onSubmit={handleSaveQuery}
            className="flex items-center gap-3 border-b border-gray-200 bg-teal-50 px-4 py-2.5"
          >
            <input
              type="text"
              placeholder="Nom de la requete..."
              value={saveName}
              onChange={(e) => setSaveName(e.target.value)}
              className="rounded-md border border-gray-200 bg-white px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 flex-1 max-w-xs"
              autoFocus
              required
            />
            <select
              value={saveChartType}
              onChange={(e) => setSaveChartType(e.target.value)}
              className="rounded-md border border-gray-200 bg-white px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              aria-label="Type de graphique"
            >
              <option value="table">Table</option>
              <option value="bar">Barres</option>
              <option value="line">Lignes</option>
              <option value="pie">Camembert</option>
              <option value="kpi">KPI</option>
            </select>
            <Button type="submit" size="sm" disabled={isSaving || !saveName.trim()}>
              {isSaving ? "..." : "Enregistrer"}
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setShowSaveForm(false)}
            >
              Annuler
            </Button>
          </form>
        )}

        {/* Selected Fields Area */}
        <SelectedFieldsBar
          selectedFields={selectedFields}
          removeField={removeField}
          updateAggregation={updateAggregation}
          updateDateGranularity={updateDateGranularity}
          filters={filters}
          sorts={sortRules}
          showFilters={showFilters}
          showSorts={showSorts}
          setShowFilters={setShowFilters}
          setShowSorts={setShowSorts}
          addFilter={addFilter}
          updateFilter={updateFilter}
          removeFilter={removeFilter}
          addSort={addSort}
          updateSort={updateSort}
          removeSort={removeSort}
          showSql={showSql}
          setShowSql={setShowSql}
          sqlMode={sqlMode}
          layerDetail={layerDetail}
          openDropdownIndex={openDropdownIndex}
          setOpenDropdownIndex={setOpenDropdownIndex}
          openDateDropdownIndex={openDateDropdownIndex}
          setOpenDateDropdownIndex={setOpenDateDropdownIndex}
        />

        {/* SQL Editor Section */}
        {showSql && (
          <div className="border-b border-gray-200 bg-white px-4 py-3">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-gray-700">Requête SQL</span>
                {sqlMode === 'sql' && (
                  <button
                    type="button"
                    onClick={() => {
                      setSqlMode('visual');
                      setCustomSql(generatedSql);
                    }}
                    className="text-xs text-teal-600 hover:text-teal-700 underline"
                  >
                    Revenir au mode visuel
                  </button>
                )}
              </div>
            </div>
            <div className="h-[150px]">
              <SqlEditor
                value={currentSql}
                onChange={(value) => {
                  setCustomSql(value);
                  if (value !== generatedSql) {
                    setSqlMode('sql');
                  }
                }}
                onExecute={handleExecute}
                tables={
                  layerDetail?.definitions_json?.nodes.reduce((acc, node) => {
                    acc[node.data_source_name] = node.columns.map(col => col.name);
                    return acc;
                  }, {} as Record<string, string[]>) || {}
                }
                readOnly={false}
                placeholder="SELECT * FROM ..."
              />
            </div>
          </div>
        )}

        {/* Main content area */}
        <div className="flex flex-1 flex-col overflow-hidden bg-white">
          <div className="flex-1 overflow-auto p-4">
            {execError && (
              <Alert variant="destructive" className="mb-4">
                {execError}
              </Alert>
            )}

            {/* SQL generation warning (e.g., missing JOIN paths) */}
            {!execError && generatedSql.startsWith('-- Error:') && (
              <Alert variant="destructive" className="mb-4">
                {generatedSql.replace(/^-- Error:\s*/, '')}
              </Alert>
            )}

            <ResultsArea
              result={result}
              isExecuting={isExecuting}
              execError={execError}
              generatedSql={generatedSql}
              viewMode={viewMode}
              setViewMode={setViewMode}
              chartType={chartType}
              setChartType={setChartType}
              autoDetectedChartType={autoDetectedChartType}
              queryLimit={queryLimit}
              setQueryLimit={setQueryLimit}
              selectedFields={selectedFields}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
