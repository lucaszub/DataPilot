"use client";

import { useCallback, useState, useEffect, useRef } from 'react';
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
import { Save, Database, Loader2 } from 'lucide-react';
import { TableNode, type TableNodeData } from '@/components/features/TableNode';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { api, type DataSourceListItem, type DataSourceDetail, type SemanticLayerDefinitions, type SemanticLayerDetail } from '@/lib/api';

const nodeTypes = { tableNode: TableNode };

function ModelCanvas() {
  const reactFlowInstance = useReactFlow();
  const [nodes, setNodes, onNodesChange] = useNodesState<TableNodeData>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [dataSources, setDataSources] = useState<DataSourceListItem[]>([]);
  const [isLoadingSources, setIsLoadingSources] = useState(true);
  const [modelName, setModelName] = useState('Mon modele');
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [workspaceId, setWorkspaceId] = useState<string | null>(null);
  const [currentLayerId, setCurrentLayerId] = useState<string | null>(null);

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
              type: 'smoothstep' as const,
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

  const onConnect: OnConnect = useCallback((params: Connection) => {
    setEdges((eds) => addEdge({ ...params, type: 'smoothstep' }, eds));
  }, [setEdges]);

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

  const handleSave = useCallback(async () => {
    if (!workspaceId) {
      setSaveMessage('Workspace non disponible');
      setTimeout(() => setSaveMessage(null), 3000);
      return;
    }

    setIsSaving(true);
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
        edges: edges.map(edge => ({
          id: edge.id,
          source_node: edge.source,
          source_column: edge.sourceHandle?.replace('-source', '') || '',
          target_node: edge.target,
          target_column: edge.targetHandle?.replace('-target', '') || '',
          join_type: 'LEFT' as const,
        })),
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

      setSaveMessage('Modele sauvegarde avec succes');
      setTimeout(() => setSaveMessage(null), 3000);
    } catch (error) {
      console.error('Failed to save semantic layer:', error);
      setSaveMessage('Erreur lors de la sauvegarde');
      setTimeout(() => setSaveMessage(null), 3000);
    } finally {
      setIsSaving(false);
    }
  }, [nodes, edges, modelName, workspaceId, currentLayerId]);

  return (
    <div className="flex h-[calc(100vh-4rem)]">
      {/* Left panel: data source list */}
      <div className="w-64 border-r bg-white flex flex-col">
        <div className="p-4 border-b border-gray-100">
          <h3 className="font-semibold text-sm text-gray-500 uppercase mb-3">
            Sources disponibles
          </h3>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {isLoadingSources ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-indigo-600" />
            </div>
          ) : dataSources.length === 0 ? (
            <div className="text-center py-8">
              <Database className="h-8 w-8 mx-auto text-gray-300 mb-2" />
              <p className="text-sm text-gray-500">
                Aucune source disponible
              </p>
            </div>
          ) : (
            dataSources.map((source) => (
              <div
                key={source.id}
                draggable
                onDragStart={(event) => {
                  event.dataTransfer.setData('application/datapilot-source', source.id);
                  event.dataTransfer.effectAllowed = 'move';
                }}
                className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 bg-white hover:border-indigo-300 hover:shadow-sm cursor-grab active:cursor-grabbing transition-all"
              >
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-50">
                  <Database className="h-4 w-4 text-indigo-600" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-gray-900">
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
      <div className="flex-1 flex flex-col">
        {/* Toolbar */}
        <div className="flex items-center justify-between gap-4 border-b border-gray-200 bg-white px-4 py-3">
          <Input
            type="text"
            value={modelName}
            onChange={(e) => setModelName(e.target.value)}
            className="max-w-xs"
            placeholder="Nom du modele"
          />

          <div className="flex items-center gap-3">
            {saveMessage && (
              <span className={`text-sm ${saveMessage.includes('succes') ? 'text-green-600' : 'text-red-600'}`}>
                {saveMessage}
              </span>
            )}
            <Button
              onClick={handleSave}
              disabled={isSaving || nodes.length === 0}
              aria-label="Sauvegarder le modele"
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
          className="flex-1"
          onDragOver={onDragOver}
          onDrop={onDrop}
        >
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            nodeTypes={nodeTypes}
            fitView
            className="bg-gray-50"
          >
            <Controls />
            <MiniMap
              nodeColor={(node) => '#4F46E5'}
              className="bg-white border border-gray-200 rounded-lg"
            />
            <Background variant={BackgroundVariant.Dots} gap={12} size={1} />
          </ReactFlow>
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
