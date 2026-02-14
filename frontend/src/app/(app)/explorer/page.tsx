"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import useSWR from "swr";
import {
  Play,
  Save,
  Clock,
  Rows3,
  ChevronDown,
  ChevronRight,
  Trash2,
  FileCode,
  X,
  Plus,
  MoreHorizontal,
  Check,
  Code2,
  CalendarDays,
  Hash,
  Type as TypeIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { QueryResultTable } from "@/components/features/QueryResultTable";
import { SqlEditor } from "@/components/features/SqlEditor";
import { useSavedQueries } from "@/hooks/useQueries";
import {
  api,
  type WorkspaceResponse,
  type QueryExecuteResponse,
  type SemanticLayerDetail,
  type SemanticLayerListItem,
} from "@/lib/api";
import { cn } from "@/lib/utils";

type AggregationType = 'none' | 'SUM' | 'COUNT' | 'AVG' | 'MIN' | 'MAX' | 'MEDIAN' | 'COUNT_DISTINCT';
type DateGranularity = 'raw' | 'year' | 'quarter' | 'month' | 'week' | 'day';

interface SelectedField {
  name: string;
  tableName: string;
  type: string;
  aggregation: AggregationType;
  dateGranularity: DateGranularity;
}

// --- Type detection helpers ---
const isNumericType = (type: string) => /int|float|double|decimal|numeric|number|bigint|real/i.test(type);
const isDateType = (type: string) => /date|time|timestamp/i.test(type);
const isTextType = (type: string) => !isNumericType(type) && !isDateType(type);

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

  // Aggregation dropdown state
  const [openDropdownIndex, setOpenDropdownIndex] = useState<number | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Date granularity dropdown state
  const [openDateDropdownIndex, setOpenDateDropdownIndex] = useState<number | null>(null);
  const dateDropdownRef = useRef<HTMLDivElement>(null);

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

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpenDropdownIndex(null);
      }
      if (dateDropdownRef.current && !dateDropdownRef.current.contains(event.target as Node)) {
        setOpenDateDropdownIndex(null);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
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

      sql += '\nLIMIT 100';
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

    sql += '\nLIMIT 100';
    return sql;
  }, [selectedFields, layerDetail]);

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

  const setAggregation = useCallback((index: number, aggregation: AggregationType) => {
    setSelectedFields(prev => prev.map((f, i) => {
      if (i !== index) return f;
      return { ...f, aggregation };
    }));
    setOpenDropdownIndex(null);
  }, []);

  const toggleDropdown = useCallback((index: number) => {
    setOpenDropdownIndex(prev => prev === index ? null : index);
  }, []);

  const setDateGranularity = useCallback((index: number, granularity: DateGranularity) => {
    setSelectedFields(prev => prev.map((f, i) => {
      if (i !== index) return f;
      return { ...f, dateGranularity: granularity };
    }));
    setOpenDateDropdownIndex(null);
  }, []);

  const toggleDateDropdown = useCallback((index: number) => {
    setOpenDateDropdownIndex(prev => prev === index ? null : index);
  }, []);

  // Sync generatedSql to customSql when in visual mode
  useEffect(() => {
    if (sqlMode === 'visual') {
      setCustomSql(generatedSql);
    }
  }, [generatedSql, sqlMode]);

  // Get the current SQL to execute
  const currentSql = sqlMode === 'sql' ? customSql : generatedSql;

  // Auto-execute when fields change in visual mode (debounced)
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
  }, [selectedFields, selectedWorkspaceId, generatedSql, sqlMode]);

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
    <div className="flex h-[calc(100vh-3rem)] md:h-screen bg-gray-50">
      {/* Left Sidebar */}
      <aside className="w-56 shrink-0 bg-white border-r border-gray-200 flex flex-col overflow-hidden">
        {/* Workspace selector */}
        <div className="px-3 py-3 border-b border-gray-200">
          <div className="relative">
            <select
              value={selectedWorkspaceId ?? ""}
              onChange={(e) => setSelectedWorkspaceId(e.target.value || null)}
              disabled={wsLoading}
              aria-label="Selectionner un workspace"
              className="w-full appearance-none rounded-md border border-gray-200 bg-gray-50 px-2.5 py-1.5 pr-7 text-sm text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
            >
              {wsLoading && <option value="">Chargement...</option>}
              {workspaces?.map((ws) => (
                <option key={ws.id} value={ws.id}>
                  {ws.name}
                </option>
              ))}
              {!wsLoading && (!workspaces || workspaces.length === 0) && (
                <option value="">Aucun workspace</option>
              )}
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 pointer-events-none" />
          </div>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto">
          {/* Models section */}
          <div className="py-2">
            <div className="px-3 py-1.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Modeles
            </div>
            {layerDetail?.definitions_json?.nodes && layerDetail.definitions_json.nodes.length > 0 ? (
              <div className="space-y-0.5">
                {layerDetail.definitions_json.nodes.map((node) => {
                  const isExpanded = expandedModels.has(node.data_source_name);
                  return (
                    <div key={node.id}>
                      <button
                        type="button"
                        onClick={() => toggleModel(node.data_source_name)}
                        className="w-full flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        {isExpanded ? (
                          <ChevronDown className="h-3.5 w-3.5 text-gray-400" />
                        ) : (
                          <ChevronRight className="h-3.5 w-3.5 text-gray-400" />
                        )}
                        <span className="font-medium truncate">{node.data_source_name}</span>
                      </button>
                      {isExpanded && (
                        <div className="pl-8 space-y-0.5">
                          {/* Group columns by type: dimensions first, then measures */}
                          {(() => {
                            const dimensions = node.columns.filter(col =>
                              col.role === 'dimension' || (col.role !== 'measure' && !isNumericType(col.type))
                            );
                            const measures = node.columns.filter(col =>
                              col.role === 'measure' || (col.role !== 'dimension' && isNumericType(col.type))
                            );
                            const ignored = node.columns.filter(col => col.role === 'ignore');

                            return (
                              <>
                                {dimensions.length > 0 && (
                                  <div className="pb-1">
                                    <div className="px-2 py-1 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
                                      Dimensions
                                    </div>
                                    {dimensions.map((col) => {
                                      const isSelected = selectedFields.some(
                                        f => f.name === col.name && f.tableName === node.data_source_name
                                      );
                                      const isDimDate = isDateType(col.type);
                                      const Icon = isDimDate ? CalendarDays : TypeIcon;

                                      return (
                                        <button
                                          key={col.name}
                                          type="button"
                                          onClick={() => addField(col.name, node.data_source_name, col.type, col.role)}
                                          disabled={isSelected}
                                          className={cn(
                                            "w-full flex items-center gap-1.5 text-left px-2 py-1 text-xs rounded transition-colors",
                                            isSelected
                                              ? "text-gray-600 bg-gray-100 cursor-not-allowed"
                                              : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                                          )}
                                          title={`${col.name} (${col.type})`}
                                        >
                                          <Icon className="h-3 w-3 shrink-0 text-gray-400" />
                                          <span className="font-mono truncate flex-1">{col.name}</span>
                                          <Plus className={cn(
                                            "h-3 w-3 shrink-0",
                                            isSelected ? "opacity-30" : ""
                                          )} />
                                        </button>
                                      );
                                    })}
                                  </div>
                                )}
                                {measures.length > 0 && (
                                  <div className="pb-1">
                                    <div className="px-2 py-1 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
                                      Mesures
                                    </div>
                                    {measures.map((col) => {
                                      const isSelected = selectedFields.some(
                                        f => f.name === col.name && f.tableName === node.data_source_name
                                      );

                                      return (
                                        <button
                                          key={col.name}
                                          type="button"
                                          onClick={() => addField(col.name, node.data_source_name, col.type, col.role)}
                                          disabled={isSelected}
                                          className={cn(
                                            "w-full flex items-center gap-1.5 text-left px-2 py-1 text-xs rounded transition-colors",
                                            isSelected
                                              ? "text-teal-600 bg-teal-50 cursor-not-allowed"
                                              : "text-teal-600 hover:bg-teal-50"
                                          )}
                                          title={`${col.name} (${col.type})`}
                                        >
                                          <Hash className="h-3 w-3 shrink-0 text-teal-500" />
                                          <span className="font-mono truncate flex-1">{col.name}</span>
                                          <Plus className={cn(
                                            "h-3 w-3 shrink-0",
                                            isSelected ? "opacity-30" : ""
                                          )} />
                                        </button>
                                      );
                                    })}
                                  </div>
                                )}
                                {ignored.length > 0 && (
                                  <div className="pb-1">
                                    <div className="px-2 py-1 text-[10px] font-semibold text-gray-300 uppercase tracking-wider">
                                      Ignorés
                                    </div>
                                    {ignored.map((col) => {
                                      const isSelected = selectedFields.some(
                                        f => f.name === col.name && f.tableName === node.data_source_name
                                      );

                                      return (
                                        <button
                                          key={col.name}
                                          type="button"
                                          onClick={() => addField(col.name, node.data_source_name, col.type, col.role)}
                                          disabled={isSelected}
                                          className={cn(
                                            "w-full flex items-center gap-1.5 text-left px-2 py-1 text-xs rounded transition-colors opacity-40",
                                            isSelected
                                              ? "text-gray-400 bg-gray-50 cursor-not-allowed"
                                              : "text-gray-400 hover:bg-gray-50"
                                          )}
                                          title={`${col.name} (${col.type}) - ignoré`}
                                        >
                                          <TypeIcon className="h-3 w-3 shrink-0 text-gray-300" />
                                          <span className="font-mono truncate flex-1">{col.name}</span>
                                          <Plus className={cn(
                                            "h-3 w-3 shrink-0",
                                            isSelected ? "opacity-30" : ""
                                          )} />
                                        </button>
                                      );
                                    })}
                                  </div>
                                )}
                              </>
                            );
                          })()}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="px-3 py-2 text-xs text-gray-400">
                Aucun modele disponible
              </p>
            )}
          </div>

          {/* Metrics section */}
          <div className="py-2 border-t border-gray-100">
            <div className="px-3 py-1.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Metriques
            </div>
            {metrics.length > 0 ? (
              <div className="space-y-0.5 px-3">
                {metrics.map((metric, idx) => {
                  const isSelected = selectedFields.some(
                    f => f.name === metric.name && f.tableName === metric.tableName
                  );
                  return (
                    <button
                      key={`${metric.tableName}-${metric.name}-${idx}`}
                      type="button"
                      onClick={() => addField(metric.name, metric.tableName, 'numeric')}
                      disabled={isSelected}
                      className={cn(
                        "w-full text-left px-2 py-1 text-xs rounded transition-colors font-mono truncate",
                        isSelected
                          ? "text-teal-600 bg-teal-50 cursor-not-allowed"
                          : "text-teal-600 hover:bg-teal-50"
                      )}
                      title={`${metric.name} from ${metric.tableName}`}
                    >
                      <span className="mr-1.5">Σ</span>
                      {metric.name}
                    </button>
                  );
                })}
              </div>
            ) : (
              <p className="px-3 py-2 text-xs text-gray-400">
                Aucune metrique disponible
              </p>
            )}
          </div>

          {/* Saved Queries section */}
          <div className="py-2 border-t border-gray-100">
            <button
              type="button"
              onClick={() => setShowSavedQueries(!showSavedQueries)}
              className="w-full flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-gray-500 uppercase tracking-wider hover:bg-gray-50 transition-colors"
            >
              {showSavedQueries ? (
                <ChevronDown className="h-3.5 w-3.5" />
              ) : (
                <ChevronRight className="h-3.5 w-3.5" />
              )}
              Requetes sauvegardees
            </button>
            {showSavedQueries && (
              <div className="space-y-0.5 px-2 mt-1">
                {savedQueries.length === 0 ? (
                  <p className="px-2 py-2 text-xs text-gray-400">
                    Aucune requete
                  </p>
                ) : (
                  savedQueries.map((sq) => (
                    <div
                      key={sq.id}
                      className="group flex items-center gap-1.5 rounded px-2 py-1.5 hover:bg-gray-50 transition-colors"
                    >
                      <FileCode className="h-3 w-3 shrink-0 text-teal-500" />
                      <button
                        type="button"
                        className="flex-1 min-w-0 text-left text-xs text-gray-700 truncate"
                        onClick={() => handleLoadSavedQuery(sq.sql_text)}
                        title={sq.name}
                      >
                        {sq.name}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteSaved(sq.id)}
                        aria-label={`Supprimer ${sq.name}`}
                        className="shrink-0 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      </aside>

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
        <div className="border-b border-gray-200 bg-white px-4 py-3">
          {selectedFields.length === 0 ? (
            <div className="flex items-center justify-center py-6 text-sm text-gray-400">
              Cliquez sur les colonnes pour explorer vos données
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex flex-wrap gap-2">
                {selectedFields.map((field, index) => {
                  // Define all aggregation options
                  const allAggregationOptions: Array<{
                    value: AggregationType;
                    label: string;
                    sql: string;
                  }> = [
                    { value: 'none', label: 'Aucune', sql: 'RAW' },
                    { value: 'SUM', label: 'Somme', sql: 'SUM' },
                    { value: 'AVG', label: 'Moyenne', sql: 'AVG' },
                    { value: 'MEDIAN', label: 'Médiane', sql: 'MEDIAN' },
                    { value: 'MIN', label: 'Minimum', sql: 'MIN' },
                    { value: 'MAX', label: 'Maximum', sql: 'MAX' },
                    { value: 'COUNT', label: 'Comptage', sql: 'COUNT' },
                    { value: 'COUNT_DISTINCT', label: 'Comptage distinct', sql: 'COUNT DISTINCT' },
                  ];

                  // Filter aggregation options based on type
                  const aggregationOptions = (() => {
                    if (isNumericType(field.type)) {
                      // Numeric: all options
                      return allAggregationOptions;
                    } else if (isDateType(field.type) || isTextType(field.type)) {
                      // Date/Text: only RAW, COUNT, COUNT_DISTINCT
                      return allAggregationOptions.filter(opt =>
                        opt.value === 'none' || opt.value === 'COUNT' || opt.value === 'COUNT_DISTINCT'
                      );
                    }
                    return allAggregationOptions;
                  })();

                  const dateGranularityOptions: Array<{
                    value: DateGranularity;
                    label: string;
                  }> = [
                    { value: 'raw', label: 'Brut' },
                    { value: 'year', label: 'Année' },
                    { value: 'quarter', label: 'Trimestre' },
                    { value: 'month', label: 'Mois' },
                    { value: 'week', label: 'Semaine' },
                    { value: 'day', label: 'Jour' },
                  ];

                  const isDate = isDateType(field.type);
                  const isNumeric = isNumericType(field.type);
                  const isDimension = !isNumeric;

                  return (
                    <div
                      key={`${field.tableName}-${field.name}-${index}`}
                      className={cn(
                        "inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm relative",
                        isDimension
                          ? "bg-gray-50 border-gray-200"
                          : "bg-teal-50 border-teal-200"
                      )}
                      ref={openDropdownIndex === index ? dropdownRef : (openDateDropdownIndex === index ? dateDropdownRef : null)}
                    >
                      {/* Type icon */}
                      {isDate && <CalendarDays className="h-3 w-3 shrink-0 text-gray-400" />}
                      {!isDate && isNumeric && <Hash className="h-3 w-3 shrink-0 text-teal-500" />}
                      {!isDate && !isNumeric && <TypeIcon className="h-3 w-3 shrink-0 text-gray-400" />}

                      <span className="font-mono text-gray-700">
                        {field.name}
                        {isDate && field.dateGranularity !== 'raw' && (
                          <span className="ml-1.5 text-xs text-gray-500">
                            [{dateGranularityOptions.find(o => o.value === field.dateGranularity)?.label}]
                          </span>
                        )}
                      </span>
                      <span
                        className={cn(
                          "px-2 py-0.5 rounded text-xs font-medium",
                          field.aggregation === 'none'
                            ? "bg-gray-100 text-gray-600"
                            : "bg-teal-600 text-white"
                        )}
                      >
                        {field.aggregation === 'none' ? 'RAW' :
                         field.aggregation === 'COUNT_DISTINCT' ? 'COUNT DISTINCT' :
                         field.aggregation}
                      </span>

                      {/* Date granularity button (only for date columns) */}
                      {isDate && (
                        <button
                          type="button"
                          onClick={() => toggleDateDropdown(index)}
                          className="text-gray-400 hover:text-gray-600 transition-colors"
                          aria-label="Options de granularité"
                        >
                          <CalendarDays className="h-3.5 w-3.5" />
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => toggleDropdown(index)}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                        aria-label="Options d'agrégation"
                      >
                        <MoreHorizontal className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => removeField(index)}
                        className="text-gray-400 hover:text-red-500 transition-colors"
                        aria-label={`Retirer ${field.name}`}
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>

                      {/* Date granularity dropdown */}
                      {isDate && openDateDropdownIndex === index && (
                        <div className="absolute top-full left-0 mt-1 z-50 min-w-[160px] rounded-lg border border-gray-200 bg-white shadow-lg py-1">
                          {dateGranularityOptions.map((option) => (
                            <button
                              key={option.value}
                              type="button"
                              onClick={() => setDateGranularity(index, option.value)}
                              className="w-full flex items-center justify-between px-3 py-2 text-sm hover:bg-teal-50 transition-colors text-left"
                            >
                              <span className="text-gray-700">{option.label}</span>
                              {field.dateGranularity === option.value && (
                                <Check className="h-3.5 w-3.5 text-teal-600" />
                              )}
                            </button>
                          ))}
                        </div>
                      )}

                      {/* Aggregation dropdown menu */}
                      {openDropdownIndex === index && (
                        <div className="absolute top-full left-0 mt-1 z-50 min-w-[200px] rounded-lg border border-gray-200 bg-white shadow-lg py-1">
                          {aggregationOptions.map((option) => (
                            <button
                              key={option.value}
                              type="button"
                              onClick={() => setAggregation(index, option.value)}
                              className="w-full flex items-center justify-between px-3 py-2 text-sm hover:bg-teal-50 transition-colors text-left"
                            >
                              <span className="text-gray-700">{option.label}</span>
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-gray-400 font-mono">{option.sql}</span>
                                {field.aggregation === option.value && (
                                  <Check className="h-3.5 w-3.5 text-teal-600" />
                                )}
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* SQL toggle button */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowSql(!showSql)}
                  className="flex items-center gap-1.5 text-xs text-gray-600 hover:text-gray-900 transition-colors"
                >
                  <Code2 className="h-3.5 w-3.5" />
                  {showSql ? 'Masquer SQL' : 'Afficher SQL'}
                  {showSql ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                </button>
                {sqlMode === 'sql' && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-teal-100 text-teal-700 text-xs font-medium">
                    Mode SQL
                  </span>
                )}
              </div>
            </div>
          )}
        </div>

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

            {result && !execError && (
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
              </div>
            )}

            <QueryResultTable
              columns={result?.columns ?? []}
              rows={result?.rows ?? []}
              isLoading={isExecuting}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
