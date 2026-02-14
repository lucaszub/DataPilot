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
import { api, type DataSourceListItem, type DataSourceDetail, type SemanticLayerDefinitions } from '@/lib/api';

const nodeTypes = { tableNode: TableNode };

function ModelCanvas() {
  const reactFlowInstance = useReactFlow();
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [dataSources, setDataSources] = useState<DataSourceListItem[]>([]);
  const [isLoadingSources, setIsLoadingSources] = useState(true);
  const [modelName, setModelName] = useState('Mon modele');
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

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

    // Get the data source details to access schema_cache
    try {
      const dataSource: DataSourceDetail = await api.dataSources.getById(dataSourceId);

      if (!dataSource.schema_cache) {
        console.error('Data source has no schema cache');
        return;
      }

      // Get drop position in ReactFlow coordinates
      const reactFlowBounds = event.currentTarget.getBoundingClientRect();
      const position = reactFlowInstance.screenToFlowPosition({
        x: event.clientX - reactFlowBounds.left,
        y: event.clientY - reactFlowBounds.top,
      });

      // Create columns with default role 'dimension'
      const columns = dataSource.schema_cache.columns.map(col => ({
        name: col.name,
        type: col.type,
        role: 'dimension' as const,
      }));

      // Create new table node
      const newNode: Node<TableNodeData> = {
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
    setIsSaving(true);
    setSaveMessage(null);

    try {
      // Convert ReactFlow nodes/edges to SemanticLayerDefinitions format
      const definitions: SemanticLayerDefinitions = {
        nodes: nodes.map(node => ({
          id: node.id,
          data_source_id: (node.data as TableNodeData).dataSourceId,
          data_source_name: (node.data as TableNodeData).label,
          position: node.position,
          columns: (node.data as TableNodeData).columns,
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

      // For now, we'll create a new semantic layer each time
      // In a real app, you'd track if we're editing an existing one
      // and use workspace_id from context/auth
      const workspaceId = '00000000-0000-0000-0000-000000000000'; // TODO: get from workspace context

      await api.semanticLayers.create({
        workspace_id: workspaceId,
        name: modelName,
        definitions_json: definitions,
      });

      setSaveMessage('Modele sauvegarde avec succes');
      setTimeout(() => setSaveMessage(null), 3000);
    } catch (error) {
      console.error('Failed to save semantic layer:', error);
      setSaveMessage('Erreur lors de la sauvegarde');
      setTimeout(() => setSaveMessage(null), 3000);
    } finally {
      setIsSaving(false);
    }
  }, [nodes, edges, modelName]);

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
