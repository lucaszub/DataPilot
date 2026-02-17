"use client";

import { useCallback, useState, useEffect, useMemo } from 'react';
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  type Connection,
  type Edge,
  type Node,
  ReactFlowProvider,
  type OnConnect,
  BackgroundVariant,
  useReactFlow,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import {
  Save,
  Database,
  Loader2,
  Search,
  X,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Wand2,
  Trash2,
  Plus,
  Upload,
  Eye,
  GripVertical,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { TableNode, type TableNodeData } from '@/components/features/TableNode';
import { JoinEdge, type JoinEdgeData } from '@/components/features/JoinEdge';
import { JoinConfigPanel, type JoinConfig } from '@/components/features/JoinConfigPanel';
import { UploadCsvModal } from '@/components/features/UploadCsvModal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  api,
  type DataSourceListItem,
  type DataSourceDetail,
  type SemanticLayerDefinitions,
  type SemanticLayerDetail,
} from '@/lib/api';

const nodeTypes = { tableNode: TableNode };
const edgeTypes = { joinEdge: JoinEdge };

const NUMERIC_TYPES = ['DOUBLE', 'FLOAT', 'DECIMAL', 'INTEGER', 'BIGINT', 'SMALLINT', 'TINYINT', 'HUGEINT'];

function inferColumnRole(name: string, type: string): 'dimension' | 'measure' {
  const lower = name.toLowerCase();
  if (lower.endsWith('_id') || lower === 'id') return 'dimension';
  if (NUMERIC_TYPES.includes(type.toUpperCase())) return 'measure';
  return 'dimension';
}

interface PendingConnection {
  connection: Connection;
  sourceNode: Node<TableNodeData['data']>;
  targetNode: Node<TableNodeData['data']>;
  suggestedSourceColumn?: string;
  suggestedTargetColumn?: string;
}

function UnifiedDataCanvas() {
  const router = useRouter();
  const reactFlowInstance = useReactFlow();
  const [nodes, setNodes, onNodesChange] = useNodesState<TableNodeData>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [dataSources, setDataSources] = useState<DataSourceListItem[]>([]);
  const [isLoadingSources, setIsLoadingSources] = useState(true);
  const [modelName, setModelName] = useState('Mon modele');
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [workspaceId, setWorkspaceId] = useState<string | null>(null);
  const [currentLayerId, setCurrentLayerId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [pendingConnection, setPendingConnection] = useState<PendingConnection | null>(null);
  const [editingEdge, setEditingEdge] = useState<{ edge: Edge; sourceNode: Node<TableNodeData['data']>; targetNode: Node<TableNodeData['data']> } | null>(null);
  const [hasExistingLayer, setHasExistingLayer] = useState(false);
  const [isAutoDetecting, setIsAutoDetecting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [deletingSourceId, setDeletingSourceId] = useState<string | null>(null);

  // Fetch or create default workspace, then load existing semantic layer
  useEffect(() => {
    async function initWorkspaceAndModel() {
      try {
        let wsId: string;
        const workspaces = await api.workspaces.list();
        if (workspaces.length > 0) {
          wsId = workspaces[0].id;
        } else {
          const ws = await api.workspaces.create({ name: 'Espace par defaut' });
          wsId = ws.id;
        }
        setWorkspaceId(wsId);

        const layers = await api.semanticLayers.list(wsId);
        if (layers.length > 0) {
          setHasExistingLayer(true);
          const layer = await api.semanticLayers.getById(layers[0].id);
          setCurrentLayerId(layer.id);
          setModelName(layer.name);

          if (layer.definitions_json) {
            const restoredNodes = layer.definitions_json.nodes.map((n) => ({
              id: n.id,
              type: 'tableNode' as const,
              position: n.position,
              data: {
                label: n.data_source_name,
                columns: n.columns,
                dataSourceId: n.data_source_id,
              },
            }));
            const restoredEdges = layer.definitions_json.edges.map((e) => ({
              id: e.id,
              source: e.source_node,
              target: e.target_node,
              sourceHandle: `${e.source_column}-source`,
              targetHandle: `${e.target_column}-target`,
              type: 'joinEdge' as const,
              data: {
                joinType: e.join_type,
                sourceColumn: e.source_column,
                targetColumn: e.target_column,
              } as JoinEdgeData,
            }));
            setNodes(restoredNodes);
            setEdges(restoredEdges);
          }
        }
      } catch (error) {
        console.error('Failed to init workspace/model:', error);
      }
    }

    initWorkspaceAndModel();
  }, [setNodes, setEdges]);

  // Fetch data sources
  const loadDataSources = useCallback(async () => {
    try {
      const sources = await api.dataSources.list();
      setDataSources(sources);
    } catch (error) {
      console.error('Failed to load data sources:', error);
    } finally {
      setIsLoadingSources(false);
    }
  }, []);

  useEffect(() => {
    loadDataSources();
  }, [loadDataSources]);

  // Delete data source
  const handleDeleteSource = useCallback(async (sourceId: string) => {
    setDeletingSourceId(sourceId);
    try {
      await api.dataSources.delete(sourceId);
      setDataSources((prev) => prev.filter((s) => s.id !== sourceId));
      // Also remove any nodes that reference this data source
      setNodes((nds) => nds.filter((n) => n.data.dataSourceId !== sourceId));
    } catch (error) {
      console.error('Failed to delete data source:', error);
    } finally {
      setDeletingSourceId(null);
    }
  }, [setNodes]);

  // Auto-detect matching columns
  const detectMatchingColumns = useCallback((
    sourceNode: Node<TableNodeData['data']>,
    targetNode: Node<TableNodeData['data']>,
    sourceHandle?: string | null,
    targetHandle?: string | null
  ): { sourceColumn?: string; targetColumn?: string } => {
    if (sourceHandle && targetHandle) {
      return {
        sourceColumn: sourceHandle.replace('-source', ''),
        targetColumn: targetHandle.replace('-target', ''),
      };
    }
    const sourceColumns = sourceNode.data.columns.map(c => c.name);
    const targetColumns = targetNode.data.columns.map(c => c.name);
    const match = sourceColumns.find(sc => targetColumns.includes(sc));
    if (match) return { sourceColumn: match, targetColumn: match };

    const idPatterns = ['id', '_id', 'ID'];
    for (const pattern of idPatterns) {
      const sourceId = sourceColumns.find(c => c.toLowerCase().includes(pattern.toLowerCase()));
      const targetId = targetColumns.find(c => c.toLowerCase().includes(pattern.toLowerCase()));
      if (sourceId && targetId) return { sourceColumn: sourceId, targetColumn: targetId };
    }
    return {};
  }, []);

  const onConnect: OnConnect = useCallback((params: Connection) => {
    const sourceNode = nodes.find(n => n.id === params.source);
    const targetNode = nodes.find(n => n.id === params.target);
    if (!sourceNode || !targetNode) return;

    const { sourceColumn, targetColumn } = detectMatchingColumns(
      sourceNode as Node<TableNodeData['data']>,
      targetNode as Node<TableNodeData['data']>,
      params.sourceHandle,
      params.targetHandle
    );

    setPendingConnection({
      connection: params,
      sourceNode: sourceNode as Node<TableNodeData['data']>,
      targetNode: targetNode as Node<TableNodeData['data']>,
      suggestedSourceColumn: sourceColumn,
      suggestedTargetColumn: targetColumn,
    });
  }, [nodes, detectMatchingColumns]);

  const handleJoinConfirm = useCallback((config: Omit<JoinConfig, 'sourceNode' | 'targetNode'>) => {
    if (!pendingConnection) return;
    const { connection } = pendingConnection;
    const newEdge: Edge = {
      id: `${connection.source}-${connection.target}-${Date.now()}`,
      source: connection.source!,
      target: connection.target!,
      sourceHandle: `${config.sourceColumn}-source`,
      targetHandle: `${config.targetColumn}-target`,
      type: 'joinEdge',
      data: {
        joinType: config.joinType,
        sourceColumn: config.sourceColumn,
        targetColumn: config.targetColumn,
      } as JoinEdgeData,
    };
    setEdges((eds) => [...eds, newEdge]);
    setPendingConnection(null);
  }, [pendingConnection, setEdges]);

  const handleJoinCancel = useCallback(() => {
    setPendingConnection(null);
  }, []);

  const handleEditEdge = useCallback((edgeId: string) => {
    const edge = edges.find(e => e.id === edgeId);
    if (!edge) return;
    const sourceNode = nodes.find(n => n.id === edge.source);
    const targetNode = nodes.find(n => n.id === edge.target);
    if (!sourceNode || !targetNode) return;
    setEditingEdge({
      edge,
      sourceNode: sourceNode as Node<TableNodeData['data']>,
      targetNode: targetNode as Node<TableNodeData['data']>,
    });
  }, [edges, nodes]);

  const handleEditConfirm = useCallback((config: Omit<JoinConfig, 'sourceNode' | 'targetNode'>) => {
    if (!editingEdge) return;
    setEdges((eds) =>
      eds.map((e) =>
        e.id === editingEdge.edge.id
          ? {
              ...e,
              sourceHandle: `${config.sourceColumn}-source`,
              targetHandle: `${config.targetColumn}-target`,
              data: {
                ...(e.data || {}),
                joinType: config.joinType,
                sourceColumn: config.sourceColumn,
                targetColumn: config.targetColumn,
              } as JoinEdgeData,
            }
          : e
      )
    );
    setEditingEdge(null);
  }, [editingEdge, setEdges]);

  const handleEditCancel = useCallback(() => {
    setEditingEdge(null);
  }, []);

  const edgesWithHandlers = useMemo(() => {
    return edges.map((edge) => ({
      ...edge,
      data: {
        ...(edge.data || {}),
        onEdit: () => handleEditEdge(edge.id),
      } as JoinEdgeData,
    }));
  }, [edges, handleEditEdge]);

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(async (event: React.DragEvent) => {
    event.preventDefault();
    const dataSourceId = event.dataTransfer.getData('application/datapilot-source');
    if (!dataSourceId) return;

    const dropPosition = reactFlowInstance.screenToFlowPosition({
      x: event.clientX,
      y: event.clientY,
    });

    try {
      const dataSource: DataSourceDetail = await api.dataSources.getById(dataSourceId);
      if (!dataSource.schema_cache) {
        console.error('Data source has no schema cache');
        return;
      }

      const columns = dataSource.schema_cache.columns.map(col => ({
        name: col.name,
        type: col.type,
        role: inferColumnRole(col.name, col.type),
      }));

      const newNode: TableNodeData = {
        id: `table-${dataSourceId}-${Date.now()}`,
        type: 'tableNode',
        position: dropPosition,
        data: {
          label: dataSource.name,
          columns,
          dataSourceId: dataSource.id,
        },
      };

      setNodes((nds) => nds.concat(newNode));
    } catch (error) {
      console.error('Failed to load data source details:', error);
    }
  }, [reactFlowInstance, setNodes]);

  const filteredDataSources = useMemo(() => {
    if (!searchQuery.trim()) return dataSources;
    const query = searchQuery.toLowerCase();
    return dataSources.filter(source => source.name.toLowerCase().includes(query));
  }, [dataSources, searchQuery]);

  const handleSave = useCallback(async () => {
    if (!workspaceId) {
      setSaveStatus('error');
      setSaveMessage('Workspace non disponible');
      setTimeout(() => { setSaveStatus('idle'); setSaveMessage(null); }, 3000);
      return;
    }

    setIsSaving(true);
    setSaveStatus('saving');
    setSaveMessage(null);

    try {
      const definitions: SemanticLayerDefinitions = {
        nodes: nodes.map(node => ({
          id: node.id,
          data_source_id: node.data.dataSourceId,
          data_source_name: node.data.label,
          position: node.position,
          columns: node.data.columns,
        })),
        edges: edges.map(edge => {
          const edgeData = edge.data as JoinEdgeData | undefined;
          return {
            id: edge.id,
            source_node: edge.source,
            source_column: edgeData?.sourceColumn || edge.sourceHandle?.replace('-source', '') || '',
            target_node: edge.target,
            target_column: edgeData?.targetColumn || edge.targetHandle?.replace('-target', '') || '',
            join_type: edgeData?.joinType || 'LEFT',
          };
        }),
      };

      if (currentLayerId) {
        await api.semanticLayers.update(currentLayerId, {
          name: modelName,
          definitions_json: definitions,
        });
      } else {
        const created = await api.semanticLayers.create({
          workspace_id: workspaceId,
          name: modelName,
          definitions_json: definitions,
        });
        setCurrentLayerId(created.id);
        setHasExistingLayer(true);
      }

      setSaveStatus('success');
      setSaveMessage('Modele sauvegarde');
      setTimeout(() => { setSaveStatus('idle'); setSaveMessage(null); }, 3000);
    } catch (error) {
      console.error('Failed to save semantic layer:', error);
      setSaveStatus('error');
      setSaveMessage('Erreur lors de la sauvegarde');
      setTimeout(() => { setSaveStatus('idle'); setSaveMessage(null); }, 3000);
    } finally {
      setIsSaving(false);
    }
  }, [nodes, edges, modelName, workspaceId, currentLayerId]);

  const handleDeleteModel = useCallback(async () => {
    if (!currentLayerId) return;
    setIsDeleting(true);
    try {
      await api.semanticLayers.delete(currentLayerId);
      setNodes([]);
      setEdges([]);
      setCurrentLayerId(null);
      setHasExistingLayer(false);
      setModelName('Mon modele');
      setShowDeleteConfirm(false);
      setSaveStatus('success');
      setSaveMessage('Modele supprime');
      setTimeout(() => { setSaveStatus('idle'); setSaveMessage(null); }, 3000);
    } catch (error) {
      console.error('Failed to delete semantic layer:', error);
      setSaveStatus('error');
      setSaveMessage('Erreur lors de la suppression');
      setTimeout(() => { setSaveStatus('idle'); setSaveMessage(null); }, 3000);
    } finally {
      setIsDeleting(false);
    }
  }, [currentLayerId, setNodes, setEdges]);

  const handleAutoDetect = useCallback(async () => {
    if (dataSources.length < 2) return;
    setIsAutoDetecting(true);
    try {
      const details = await Promise.all(
        dataSources.map((ds) => api.dataSources.getById(ds.id))
      );

      const COLS = 3;
      const X_GAP = 380;
      const Y_GAP = 400;

      const newNodes: TableNodeData[] = details
        .filter((ds) => ds.schema_cache)
        .map((ds, idx) => ({
          id: `table-${ds.id}-${Date.now()}-${idx}`,
          type: 'tableNode' as const,
          position: {
            x: (idx % COLS) * X_GAP + 50,
            y: Math.floor(idx / COLS) * Y_GAP + 50,
          },
          data: {
            label: ds.name,
            columns: ds.schema_cache!.columns.map((col) => ({
              name: col.name,
              type: col.type,
              role: inferColumnRole(col.name, col.type),
            })),
            dataSourceId: ds.id,
          },
        }));

      setNodes(newNodes);

      const dsIds = dataSources.map((ds) => ds.id);
      const result = await api.semanticLayers.autoDetect(dsIds);

      const dsIdToNodeId: Record<string, string> = {};
      for (const node of newNodes) {
        dsIdToNodeId[node.data.dataSourceId] = node.id;
      }

      const newEdges: Edge[] = result.suggested_edges
        .filter(
          (s) =>
            dsIdToNodeId[s.source_ds_id] !== undefined &&
            dsIdToNodeId[s.target_ds_id] !== undefined
        )
        .map((s, idx) => ({
          id: `auto-edge-${idx}-${Date.now()}`,
          source: dsIdToNodeId[s.source_ds_id],
          target: dsIdToNodeId[s.target_ds_id],
          sourceHandle: `${s.source_column}-source`,
          targetHandle: `${s.target_column}-target`,
          type: 'joinEdge' as const,
          data: {
            joinType: s.join_type,
            sourceColumn: s.source_column,
            targetColumn: s.target_column,
          } as JoinEdgeData,
        }));

      setEdges(newEdges);
    } catch (error) {
      console.error('Auto-detect failed:', error);
    } finally {
      setIsAutoDetecting(false);
    }
  }, [dataSources, setNodes, setEdges]);

  const handleUploadSuccess = useCallback(() => {
    loadDataSources();
  }, [loadDataSources]);

  return (
    <div className="flex h-[calc(100vh-4rem)]">
      {/* Left panel: unified data sources */}
      <div className="w-72 border-r bg-card flex flex-col">
        {/* Panel header with upload button */}
        <div className="p-4 border-b bg-card">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-sm text-foreground uppercase tracking-wide">
              Sources de donnees
            </h3>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowUploadModal(true)}
              className="h-7 px-2 text-xs"
              aria-label="Importer un CSV"
            >
              <Plus className="h-3 w-3 mr-1" />
              CSV
            </Button>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Rechercher..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-9 h-8 text-sm"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                aria-label="Effacer la recherche"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        {/* Hint */}
        <div className="px-4 py-2 bg-muted/30 border-b text-[11px] text-muted-foreground">
          Glissez les sources vers le canevas pour construire votre modele
        </div>

        {/* Data sources list */}
        <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
          {isLoadingSources ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : filteredDataSources.length === 0 ? (
            <div className="text-center py-12">
              <Database className="h-10 w-10 mx-auto text-muted-foreground/30 mb-3" />
              <p className="text-sm font-medium text-foreground mb-1">
                {searchQuery ? 'Aucun resultat' : 'Aucune source'}
              </p>
              <p className="text-xs text-muted-foreground mb-4">
                {searchQuery ? 'Essayez un autre terme' : 'Importez des CSV pour commencer'}
              </p>
              {!searchQuery && (
                <Button
                  size="sm"
                  onClick={() => setShowUploadModal(true)}
                >
                  <Upload className="h-3 w-3 mr-1" />
                  Importer
                </Button>
              )}
            </div>
          ) : (
            filteredDataSources.map((source) => (
              <div
                key={source.id}
                draggable
                onDragStart={(event) => {
                  event.dataTransfer.setData('application/datapilot-source', source.id);
                  event.dataTransfer.effectAllowed = 'move';
                }}
                className="group flex items-center gap-2 p-2.5 rounded-lg border border-border bg-background hover:border-primary/50 hover:shadow-sm cursor-grab active:cursor-grabbing transition-all"
              >
                <GripVertical className="h-3.5 w-3.5 text-muted-foreground/40 shrink-0" />
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary/10">
                  <Database className="h-4 w-4 text-primary" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">
                    {source.name}
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    {source.column_count || 0} col. {source.row_count ? `/ ${source.row_count.toLocaleString('fr-FR')} lig.` : ''}
                  </p>
                </div>
                <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      router.push(`/sources/${source.id}`);
                    }}
                    className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground"
                    aria-label={`Voir ${source.name}`}
                    title="Voir les details"
                  >
                    <Eye className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteSource(source.id);
                    }}
                    disabled={deletingSourceId === source.id}
                    className="p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive"
                    aria-label={`Supprimer ${source.name}`}
                    title="Supprimer"
                  >
                    {deletingSourceId === source.id ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Trash2 className="h-3.5 w-3.5" />
                    )}
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Main area: ReactFlow canvas */}
      <div className="flex-1 flex flex-col bg-background">
        {/* Toolbar */}
        <div className="flex items-center justify-between gap-4 border-b border-border bg-card px-6 py-2.5">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
              <Sparkles className="h-4 w-4 text-primary" />
            </div>
            <Input
              type="text"
              value={modelName}
              onChange={(e) => setModelName(e.target.value)}
              className="max-w-xs font-semibold h-8 text-sm"
              placeholder="Nom du modele"
            />
          </div>

          <div className="flex items-center gap-2">
            {saveStatus !== 'idle' && (
              <div className="flex items-center gap-2">
                {saveStatus === 'saving' && (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin text-primary" />
                    <span className="text-sm text-muted-foreground">Sauvegarde...</span>
                  </>
                )}
                {saveStatus === 'success' && (
                  <>
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <span className="text-sm text-green-600">{saveMessage}</span>
                  </>
                )}
                {saveStatus === 'error' && (
                  <>
                    <AlertCircle className="h-4 w-4 text-destructive" />
                    <span className="text-sm text-destructive">{saveMessage}</span>
                  </>
                )}
              </div>
            )}
            {currentLayerId && (
              <Button
                onClick={() => setShowDeleteConfirm(true)}
                disabled={isDeleting}
                variant="outline"
                size="sm"
                className="text-destructive border-destructive/20 hover:bg-destructive/10"
              >
                {isDeleting ? (
                  <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                )}
                Supprimer
              </Button>
            )}
            {!hasExistingLayer && dataSources.length >= 2 && (
              <Button
                onClick={handleAutoDetect}
                disabled={isAutoDetecting}
                variant="outline"
                size="sm"
              >
                {isAutoDetecting ? (
                  <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Wand2 className="mr-1.5 h-3.5 w-3.5" />
                )}
                Auto-detecter
              </Button>
            )}
            <Button
              onClick={handleSave}
              disabled={isSaving || nodes.length === 0}
              size="sm"
            >
              {isSaving ? (
                <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
              ) : (
                <Save className="mr-1.5 h-3.5 w-3.5" />
              )}
              Sauvegarder
            </Button>
          </div>
        </div>

        {/* Canvas */}
        <div
          className="flex-1 relative"
          onDragOver={onDragOver}
          onDrop={onDrop}
        >
          {/* Empty state overlay */}
          {nodes.length === 0 && !isLoadingSources && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
              <div className="text-center max-w-md">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
                  <Database className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  Construisez votre modele de donnees
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Glissez-deposez des sources depuis le panneau de gauche,
                  puis reliez les tables pour creer des jointures.
                </p>
                {dataSources.length === 0 && (
                  <div className="pointer-events-auto mb-4">
                    <Button onClick={() => setShowUploadModal(true)} size="sm">
                      <Upload className="mr-2 h-4 w-4" />
                      Importer des CSV
                    </Button>
                  </div>
                )}
                {dataSources.length >= 2 && !hasExistingLayer && (
                  <div className="pointer-events-auto mb-4">
                    <Button
                      onClick={handleAutoDetect}
                      disabled={isAutoDetecting}
                      size="sm"
                    >
                      {isAutoDetecting ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Wand2 className="mr-2 h-4 w-4" />
                      )}
                      Auto-detecter les relations
                    </Button>
                  </div>
                )}
                <div className="inline-flex items-center gap-2 text-xs text-muted-foreground bg-muted px-3 py-2 rounded-lg">
                  <span className="font-semibold">Astuce:</span>
                  Cliquez sur les badges (D/M) pour changer le role des colonnes
                </div>
              </div>
            </div>
          )}

          <ReactFlow
            nodes={nodes}
            edges={edgesWithHandlers}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            nodeTypes={nodeTypes}
            edgeTypes={edgeTypes}
            fitView
            className="bg-muted/30"
          >
            <Controls className="bg-card border border-border rounded-lg shadow-lg" />
            <MiniMap
              nodeColor={() => 'hsl(var(--primary))'}
              className="bg-card border border-border rounded-lg shadow-lg"
            />
            <Background variant={BackgroundVariant.Dots} gap={16} size={1} color="hsl(var(--border))" />
          </ReactFlow>

          {/* Join config panel for new connections */}
          {pendingConnection && (
            <JoinConfigPanel
              sourceNodeLabel={pendingConnection.sourceNode.data.label}
              targetNodeLabel={pendingConnection.targetNode.data.label}
              sourceColumns={pendingConnection.sourceNode.data.columns.map(c => c.name)}
              targetColumns={pendingConnection.targetNode.data.columns.map(c => c.name)}
              suggestedSourceColumn={pendingConnection.suggestedSourceColumn}
              suggestedTargetColumn={pendingConnection.suggestedTargetColumn}
              onConfirm={handleJoinConfirm}
              onCancel={handleJoinCancel}
            />
          )}

          {/* Delete confirmation */}
          {showDeleteConfirm && (
            <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/30">
              <div className="bg-card rounded-lg shadow-xl p-6 max-w-sm mx-4 border">
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  Supprimer le modele ?
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Cette action est irreversible. Le modele semantique et toutes ses relations seront supprimees.
                </p>
                <div className="flex justify-end gap-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowDeleteConfirm(false)}
                    disabled={isDeleting}
                  >
                    Annuler
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={handleDeleteModel}
                    disabled={isDeleting}
                  >
                    {isDeleting ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="mr-2 h-4 w-4" />
                    )}
                    Supprimer
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Join config panel for editing existing edges */}
          {editingEdge && (() => {
            const edgeData = editingEdge.edge.data as JoinEdgeData | undefined;
            return (
              <JoinConfigPanel
                sourceNodeLabel={editingEdge.sourceNode.data.label}
                targetNodeLabel={editingEdge.targetNode.data.label}
                sourceColumns={editingEdge.sourceNode.data.columns.map(c => c.name)}
                targetColumns={editingEdge.targetNode.data.columns.map(c => c.name)}
                suggestedSourceColumn={edgeData?.sourceColumn}
                suggestedTargetColumn={edgeData?.targetColumn}
                initialJoinType={edgeData?.joinType}
                onConfirm={handleEditConfirm}
                onCancel={handleEditCancel}
              />
            );
          })()}
        </div>
      </div>

      {/* Upload modal */}
      {showUploadModal && (
        <UploadCsvModal
          onClose={() => setShowUploadModal(false)}
          onSuccess={handleUploadSuccess}
        />
      )}
    </div>
  );
}

export default function SourcesPage() {
  return (
    <ReactFlowProvider>
      <UnifiedDataCanvas />
    </ReactFlowProvider>
  );
}
