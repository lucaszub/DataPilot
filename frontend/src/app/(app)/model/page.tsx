"use client";

import { useCallback, useState, useEffect, useMemo } from 'react';
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  type Connection,
  type Edge,
  type Node,
  ReactFlowProvider,
  type OnConnect,
  BackgroundVariant,
  useReactFlow,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Save, Database, Loader2, Search, X, CheckCircle2, AlertCircle, Sparkles } from 'lucide-react';
import { TableNode, type TableNodeData } from '@/components/features/TableNode';
import { JoinEdge, type JoinEdgeData } from '@/components/features/JoinEdge';
import { JoinConfigPanel, type JoinConfig } from '@/components/features/JoinConfigPanel';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { api, type DataSourceListItem, type DataSourceDetail, type SemanticLayerDefinitions, type SemanticLayerDetail } from '@/lib/api';

const nodeTypes = { tableNode: TableNode };
const edgeTypes = { joinEdge: JoinEdge };

interface PendingConnection {
  connection: Connection;
  sourceNode: Node<TableNodeData['data']>;
  targetNode: Node<TableNodeData['data']>;
  suggestedSourceColumn?: string;
  suggestedTargetColumn?: string;
}

function ModelCanvas() {
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

  // Fetch or create default workspace, then load existing semantic layer
  useEffect(() => {
    async function initWorkspaceAndModel() {
      try {
        // Get or create a default workspace
        let wsId: string;
        const workspaces = await api.workspaces.list();
        if (workspaces.length > 0) {
          wsId = workspaces[0].id;
        } else {
          const ws = await api.workspaces.create({ name: 'Espace par defaut' });
          wsId = ws.id;
        }
        setWorkspaceId(wsId);

        // Load existing semantic layer for this workspace (if any)
        const layers = await api.semanticLayers.list(wsId);
        if (layers.length > 0) {
          const layer = await api.semanticLayers.getById(layers[0].id);
          setCurrentLayerId(layer.id);
          setModelName(layer.name);

          // Restore nodes and edges from definitions_json
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

  // Fetch data sources on mount
  useEffect(() => {
    async function loadDataSources() {
      try {
        const sources = await api.dataSources.list();
        setDataSources(sources);
      } catch (error) {
        console.error('Failed to load data sources:', error);
      } finally {
        setIsLoadingSources(false);
      }
    }

    loadDataSources();
  }, []);

  // Auto-detect matching columns between two nodes
  const detectMatchingColumns = useCallback((
    sourceNode: Node<TableNodeData['data']>,
    targetNode: Node<TableNodeData['data']>,
    sourceHandle?: string | null,
    targetHandle?: string | null
  ): { sourceColumn?: string; targetColumn?: string } => {
    // If handles specify columns, use those
    if (sourceHandle && targetHandle) {
      const sourceCol = sourceHandle.replace('-source', '');
      const targetCol = targetHandle.replace('-target', '');
      return { sourceColumn: sourceCol, targetColumn: targetCol };
    }

    // Otherwise, look for matching column names
    const sourceColumns = sourceNode.data.columns.map(c => c.name);
    const targetColumns = targetNode.data.columns.map(c => c.name);

    // Find exact match
    const match = sourceColumns.find(sc => targetColumns.includes(sc));
    if (match) {
      return { sourceColumn: match, targetColumn: match };
    }

    // Find common ID patterns
    const idPatterns = ['id', '_id', 'ID'];
    for (const pattern of idPatterns) {
      const sourceId = sourceColumns.find(c => c.toLowerCase().includes(pattern.toLowerCase()));
      const targetId = targetColumns.find(c => c.toLowerCase().includes(pattern.toLowerCase()));
      if (sourceId && targetId) {
        return { sourceColumn: sourceId, targetColumn: targetId };
      }
    }

    return {};
  }, []);

  const onConnect: OnConnect = useCallback((params: Connection) => {
    // Find source and target nodes
    const sourceNode = nodes.find(n => n.id === params.source);
    const targetNode = nodes.find(n => n.id === params.target);

    if (!sourceNode || !targetNode) return;

    // Detect matching columns
    const { sourceColumn, targetColumn } = detectMatchingColumns(
      sourceNode as Node<TableNodeData['data']>,
      targetNode as Node<TableNodeData['data']>,
      params.sourceHandle,
      params.targetHandle
    );

    // Set pending connection to show config panel
    setPendingConnection({
      connection: params,
      sourceNode: sourceNode as Node<TableNodeData['data']>,
      targetNode: targetNode as Node<TableNodeData['data']>,
      suggestedSourceColumn: sourceColumn,
      suggestedTargetColumn: targetColumn,
    });
  }, [nodes, detectMatchingColumns]);

  // Confirm join configuration
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
        onEdit: undefined, // Will be set below
      } as JoinEdgeData,
    };

    setEdges((eds) => [...eds, newEdge]);
    setPendingConnection(null);
  }, [pendingConnection, setEdges]);

  const handleJoinCancel = useCallback(() => {
    setPendingConnection(null);
  }, []);

  // Edit existing edge
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

  // Attach edit handlers to edges
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

    // Capture drop coordinates synchronously before any async call
    const dropPosition = reactFlowInstance.screenToFlowPosition({
      x: event.clientX,
      y: event.clientY,
    });

    // Get the data source details to access schema_cache
    try {
      const dataSource: DataSourceDetail = await api.dataSources.getById(dataSourceId);

      if (!dataSource.schema_cache) {
        console.error('Data source has no schema cache');
        return;
      }

      const position = dropPosition;

      // Create columns with default role 'dimension'
      const columns = dataSource.schema_cache.columns.map(col => ({
        name: col.name,
        type: col.type,
        role: 'dimension' as const,
      }));

      // Create new table node
      const newNode: TableNodeData = {
        id: `table-${dataSourceId}-${Date.now()}`,
        type: 'tableNode',
        position,
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

  // Filter data sources by search query
  const filteredDataSources = useMemo(() => {
    if (!searchQuery.trim()) return dataSources;
    const query = searchQuery.toLowerCase();
    return dataSources.filter(source =>
      source.name.toLowerCase().includes(query)
    );
  }, [dataSources, searchQuery]);

  const handleSave = useCallback(async () => {
    if (!workspaceId) {
      setSaveStatus('error');
      setSaveMessage('Workspace non disponible');
      setTimeout(() => {
        setSaveStatus('idle');
        setSaveMessage(null);
      }, 3000);
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
        // Update existing semantic layer
        await api.semanticLayers.update(currentLayerId, {
          name: modelName,
          definitions_json: definitions,
        });
      } else {
        // Create new semantic layer
        const created = await api.semanticLayers.create({
          workspace_id: workspaceId,
          name: modelName,
          definitions_json: definitions,
        });
        setCurrentLayerId(created.id);
      }

      setSaveStatus('success');
      setSaveMessage('Modele sauvegarde avec succes');
      setTimeout(() => {
        setSaveStatus('idle');
        setSaveMessage(null);
      }, 3000);
    } catch (error) {
      console.error('Failed to save semantic layer:', error);
      setSaveStatus('error');
      setSaveMessage('Erreur lors de la sauvegarde');
      setTimeout(() => {
        setSaveStatus('idle');
        setSaveMessage(null);
      }, 3000);
    } finally {
      setIsSaving(false);
    }
  }, [nodes, edges, modelName, workspaceId, currentLayerId]);

  return (
    <div className="flex h-[calc(100vh-4rem)]">
      {/* Left panel: data source list */}
      <div className="w-72 border-r bg-gray-50 flex flex-col">
        <div className="p-4 border-b bg-white">
          <h3 className="font-semibold text-sm text-gray-700 uppercase tracking-wide mb-3">
            Sources de donnees
          </h3>

          {/* Search input */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Rechercher..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-9"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                aria-label="Effacer la recherche"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {isLoadingSources ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-teal-600" />
            </div>
          ) : filteredDataSources.length === 0 ? (
            <div className="text-center py-12">
              <Database className="h-10 w-10 mx-auto text-gray-300 mb-3" />
              <p className="text-sm font-medium text-gray-900 mb-1">
                {searchQuery ? 'Aucun resultat' : 'Aucune source'}
              </p>
              <p className="text-xs text-gray-500">
                {searchQuery ? 'Essayez un autre terme' : 'Importez des donnees pour commencer'}
              </p>
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
                className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 bg-white hover:border-teal-400 hover:shadow-md cursor-grab active:cursor-grabbing transition-all"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-teal-500 to-teal-600 shadow-sm">
                  <Database className="h-4 w-4 text-white" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-gray-900">
                    {source.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {source.column_count || 0} colonnes
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* ReactFlow canvas */}
      <div className="flex-1 flex flex-col bg-white">
        {/* Toolbar */}
        <div className="flex items-center justify-between gap-4 border-b border-gray-200 bg-white px-6 py-3 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-teal-500 to-teal-600 shadow-sm">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <Input
              type="text"
              value={modelName}
              onChange={(e) => setModelName(e.target.value)}
              className="max-w-xs font-semibold"
              placeholder="Nom du modele"
            />
          </div>

          <div className="flex items-center gap-3">
            {saveStatus !== 'idle' && (
              <div className="flex items-center gap-2">
                {saveStatus === 'saving' && (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin text-teal-600" />
                    <span className="text-sm text-gray-600">Sauvegarde...</span>
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
                    <AlertCircle className="h-4 w-4 text-red-600" />
                    <span className="text-sm text-red-600">{saveMessage}</span>
                  </>
                )}
              </div>
            )}
            <Button
              onClick={handleSave}
              disabled={isSaving || nodes.length === 0}
              aria-label="Sauvegarder le modele"
              size="default"
            >
              {isSaving ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
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
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-teal-100 mb-4">
                  <Database className="h-8 w-8 text-teal-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Creez votre modele de donnees
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  Glissez-deposez des sources depuis le panneau de gauche pour commencer.
                  Connectez les colonnes pour definir les relations entre vos tables.
                </p>
                <div className="inline-flex items-center gap-2 text-xs text-gray-500 bg-gray-100 px-3 py-2 rounded-lg">
                  <span className="font-semibold">Astuce:</span>
                  Cliquez sur les badges (D/M/—) pour changer le role des colonnes
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
            className="bg-gray-50"
          >
            <Controls className="bg-white border border-gray-200 rounded-lg shadow-lg" />
            <MiniMap
              nodeColor={(node) => '#0D9488'}
              className="bg-white border border-gray-200 rounded-lg shadow-lg"
            />
            <Background variant={BackgroundVariant.Dots} gap={16} size={1} color="#e5e7eb" />
          </ReactFlow>

          {/* Join configuration panel for new connections */}
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

          {/* Join configuration panel for editing existing edges */}
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
    </div>
  );
}

export default function ModelPage() {
  return (
    <ReactFlowProvider>
      <ModelCanvas />
    </ReactFlowProvider>
  );
}
