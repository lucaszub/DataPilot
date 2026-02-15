/**
 * Hook to load workspace, semantic layer, and data sources for the Explorer.
 * Builds TableDef[] and RelationshipDef[] from real backend data.
 */

import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import type { WorkspaceResponse, SemanticLayerDetail } from '@/lib/api';
import {
  buildTablesFromSemanticLayer,
  buildRelationshipsFromEdges,
  sanitizeViewName,
} from '@/lib/explorer-types';
import type { TableDef, RelationshipDef } from '@/lib/explorer-types';

interface ExplorerData {
  workspaces: WorkspaceResponse[];
  currentWorkspaceId: string | null;
  setCurrentWorkspaceId: (id: string) => void;
  tables: TableDef[];
  relationships: RelationshipDef[];
  semanticLayer: SemanticLayerDetail | null;
  isLoading: boolean;
  error: string | null;
  reload: () => void;
}

export function useExplorerData(): ExplorerData {
  const [workspaces, setWorkspaces] = useState<WorkspaceResponse[]>([]);
  const [currentWorkspaceId, setCurrentWorkspaceId] = useState<string | null>(null);
  const [tables, setTables] = useState<TableDef[]>([]);
  const [relationships, setRelationships] = useState<RelationshipDef[]>([]);
  const [semanticLayer, setSemanticLayer] = useState<SemanticLayerDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  const reload = useCallback(() => setReloadKey(k => k + 1), []);

  // 1. Load workspaces
  useEffect(() => {
    setIsLoading(true);
    setError(null);

    api.workspaces.list()
      .then(ws => {
        setWorkspaces(ws);
        if (ws.length > 0 && !currentWorkspaceId) {
          setCurrentWorkspaceId(ws[0].id);
        }
        if (ws.length === 0) {
          setIsLoading(false);
        }
      })
      .catch(err => {
        setError(err instanceof Error ? err.message : 'Erreur de chargement des workspaces');
        setIsLoading(false);
      });
  }, [reloadKey]); // eslint-disable-line react-hooks/exhaustive-deps

  // 2. When workspace changes, load semantic layer + data sources
  useEffect(() => {
    if (!currentWorkspaceId) return;

    setIsLoading(true);
    setError(null);

    (async () => {
      try {
        const layers = await api.semanticLayers.list(currentWorkspaceId);

        if (layers.length === 0) {
          setTables([]);
          setRelationships([]);
          setSemanticLayer(null);
          setIsLoading(false);
          return;
        }

        const sl = await api.semanticLayers.getById(layers[0].id);
        setSemanticLayer(sl);

        if (!sl.definitions_json?.nodes?.length) {
          setTables([]);
          setRelationships([]);
          setIsLoading(false);
          return;
        }

        // Load data source details for each node
        const dsIds = [...new Set(sl.definitions_json.nodes.map(n => n.data_source_id))];
        const dsDetails = await Promise.all(
          dsIds.map(id => api.dataSources.getById(id))
        );
        const dsMap = new Map(dsDetails.map(ds => [ds.id, ds]));

        // Build tables and relationships
        const builtTables = buildTablesFromSemanticLayer(sl.definitions_json.nodes, dsMap);
        setTables(builtTables);

        const nodeIdToViewName = new Map<string, string>();
        sl.definitions_json.nodes.forEach(node => {
          nodeIdToViewName.set(node.id, sanitizeViewName(node.data_source_name));
        });

        const builtRels = buildRelationshipsFromEdges(
          sl.definitions_json.edges || [],
          nodeIdToViewName,
        );
        setRelationships(builtRels);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erreur de chargement');
      } finally {
        setIsLoading(false);
      }
    })();
  }, [currentWorkspaceId, reloadKey]);

  return {
    workspaces,
    currentWorkspaceId,
    setCurrentWorkspaceId,
    tables,
    relationships,
    semanticLayer,
    isLoading,
    error,
    reload,
  };
}
