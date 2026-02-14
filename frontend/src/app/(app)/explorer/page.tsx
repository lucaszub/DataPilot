"use client";

import React, { useCallback, useMemo, useState } from "react";
import useSWR from "swr";
import {
  Play,
  Save,
  Clock,
  Rows3,
  BookmarkPlus,
  Trash2,
  FileCode,
  ChevronDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { SqlEditor } from "@/components/features/SqlEditor";
import { QueryResultTable } from "@/components/features/QueryResultTable";
import { useSavedQueries } from "@/hooks/useQueries";
import {
  api,
  type WorkspaceResponse,
  type QueryExecuteResponse,
  type SemanticLayerDetail,
  type SemanticLayerListItem,
} from "@/lib/api";
import { cn } from "@/lib/utils";

export default function ExplorerPage() {
  // --- State ---
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState<string | null>(null);
  const [sqlText, setSqlText] = useState("SELECT * FROM ");
  const [result, setResult] = useState<QueryExecuteResponse | null>(null);
  const [isExecuting, setIsExecuting] = useState(false);
  const [execError, setExecError] = useState<string | null>(null);

  // Saved query UI
  const [showSaveForm, setShowSaveForm] = useState(false);
  const [saveName, setSaveName] = useState("");
  const [saveChartType, setSaveChartType] = useState<string>("table");
  const [isSaving, setIsSaving] = useState(false);
  const [showSavedPanel, setShowSavedPanel] = useState(true);

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

  // Fetch full semantic layer detail for autocompletion
  const { data: layerDetail } = useSWR<SemanticLayerDetail>(
    semanticLayer && semanticLayer.length > 0 ? `semantic-layer-detail-${semanticLayer[0].id}` : null,
    () => api.semanticLayers.getById(semanticLayer![0].id)
  );

  const completionTables = useMemo(() => {
    const result: Record<string, string[]> = {};
    if (!layerDetail?.definitions_json) return result;

    for (const node of layerDetail.definitions_json.nodes) {
      result[node.data_source_name] = node.columns.map((c) => c.name);
    }
    return result;
  }, [layerDetail]);

  // --- Handlers ---
  const handleExecute = useCallback(async () => {
    if (!selectedWorkspaceId || !sqlText.trim()) return;

    setIsExecuting(true);
    setExecError(null);

    try {
      const response = await api.queries.execute({
        sql_text: sqlText,
        workspace_id: selectedWorkspaceId,
      });
      setResult(response);
    } catch (err) {
      setExecError(err instanceof Error ? err.message : "Erreur lors de l'execution.");
      setResult(null);
    } finally {
      setIsExecuting(false);
    }
  }, [selectedWorkspaceId, sqlText]);

  async function handleSaveQuery(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedWorkspaceId || !saveName.trim() || !sqlText.trim()) return;

    setIsSaving(true);
    try {
      await api.queries.createSaved({
        name: saveName.trim(),
        sql_text: sqlText,
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
    setSqlText(queryText);
  }

  async function handleDeleteSaved(queryId: string) {
    try {
      await api.queries.deleteSaved(queryId);
      mutateSaved();
    } catch {
      // Silent
    }
  }

  // --- Render ---
  return (
    <div className="flex h-[calc(100vh-3rem)] md:h-screen">
      {/* Main content */}
      <div className="flex flex-1 flex-col min-w-0 overflow-hidden">
        {/* Toolbar */}
        <div className="flex items-center gap-3 border-b border-gray-200 bg-white px-4 py-3">
          <h1 className="text-lg font-bold text-gray-900 shrink-0">Explorer</h1>

          {/* Workspace selector */}
          <div className="relative">
            <select
              value={selectedWorkspaceId ?? ""}
              onChange={(e) => setSelectedWorkspaceId(e.target.value || null)}
              disabled={wsLoading}
              aria-label="Selectionner un workspace"
              className="appearance-none rounded-lg border border-gray-200 bg-gray-50 px-3 py-1.5 pr-8 text-sm text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
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
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
          </div>

          <div className="flex-1" />

          {/* Run button */}
          <Button
            onClick={handleExecute}
            disabled={isExecuting || !selectedWorkspaceId || !sqlText.trim()}
            aria-busy={isExecuting}
            className="gap-2"
          >
            <Play className="h-4 w-4" aria-hidden="true" />
            {isExecuting ? "Execution..." : "Executer"}
          </Button>

          {/* Save button */}
          <Button
            variant="outline"
            onClick={() => setShowSaveForm(!showSaveForm)}
            disabled={!sqlText.trim()}
            className="gap-2"
          >
            <Save className="h-4 w-4" aria-hidden="true" />
            Sauvegarder
          </Button>

          {/* Toggle saved panel */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowSavedPanel(!showSavedPanel)}
            aria-label={showSavedPanel ? "Masquer les requetes sauvegardees" : "Afficher les requetes sauvegardees"}
            className={cn(
              "h-9 w-9",
              showSavedPanel && "bg-indigo-50 text-indigo-600"
            )}
          >
            <BookmarkPlus className="h-4 w-4" aria-hidden="true" />
          </Button>
        </div>

        {/* Save form (inline) */}
        {showSaveForm && (
          <form
            onSubmit={handleSaveQuery}
            className="flex items-center gap-3 border-b border-gray-200 bg-indigo-50 px-4 py-2"
          >
            <input
              type="text"
              placeholder="Nom de la requete..."
              value={saveName}
              onChange={(e) => setSaveName(e.target.value)}
              className="rounded-md border border-gray-200 bg-white px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 flex-1 max-w-xs"
              autoFocus
              required
            />
            <select
              value={saveChartType}
              onChange={(e) => setSaveChartType(e.target.value)}
              className="rounded-md border border-gray-200 bg-white px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
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

        {/* Editor + Results split */}
        <div className="flex flex-1 flex-col overflow-hidden">
          {/* SQL Editor */}
          <div className="border-b border-gray-200 p-4 shrink-0">
            <SqlEditor
              value={sqlText}
              onChange={setSqlText}
              onExecute={handleExecute}
              tables={completionTables}
              placeholder="SELECT * FROM ... (Ctrl+Entree pour executer)"
            />
            <p className="mt-2 text-xs text-gray-400">
              Ctrl+Entree pour executer
            </p>
          </div>

          {/* Results */}
          <div className="flex-1 overflow-auto p-4">
            {execError && (
              <Alert variant="destructive" className="mb-4">
                {execError}
              </Alert>
            )}

            {/* Status bar */}
            {result && !execError && (
              <div className="mb-3 flex items-center gap-4 text-sm text-gray-500">
                <span className="flex items-center gap-1.5">
                  <Rows3 className="h-4 w-4" aria-hidden="true" />
                  {result.row_count.toLocaleString("fr-FR")} ligne{result.row_count > 1 ? "s" : ""}
                </span>
                <span className="flex items-center gap-1.5">
                  <Clock className="h-4 w-4" aria-hidden="true" />
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

      {/* Saved Queries Panel */}
      {showSavedPanel && (
        <aside className="w-72 shrink-0 border-l border-gray-200 bg-white flex flex-col overflow-hidden">
          <div className="border-b border-gray-100 px-4 py-3">
            <h2 className="text-sm font-semibold text-gray-900">
              Requetes sauvegardees
            </h2>
          </div>
          <div className="flex-1 overflow-y-auto p-2">
            {savedQueries.length === 0 ? (
              <p className="px-2 py-8 text-center text-xs text-gray-400">
                Aucune requete sauvegardee.
              </p>
            ) : (
              <ul className="space-y-1" role="list">
                {savedQueries.map((sq) => (
                  <li
                    key={sq.id}
                    className="group flex items-start gap-2 rounded-lg px-3 py-2.5 hover:bg-gray-50 transition-colors"
                  >
                    <FileCode className="h-4 w-4 mt-0.5 shrink-0 text-indigo-500" aria-hidden="true" />
                    <button
                      type="button"
                      className="flex-1 min-w-0 text-left"
                      onClick={() => handleLoadSavedQuery(sq.sql_text)}
                      aria-label={`Charger la requete ${sq.name}`}
                    >
                      <span className="block text-sm font-medium text-gray-800 truncate">
                        {sq.name}
                      </span>
                      {sq.chart_type && (
                        <span className="inline-flex items-center rounded-full bg-gray-100 px-1.5 py-0.5 text-xs text-gray-500 mt-0.5">
                          {sq.chart_type}
                        </span>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteSaved(sq.id)}
                      aria-label={`Supprimer ${sq.name}`}
                      className="shrink-0 mt-0.5 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </aside>
      )}
    </div>
  );
}
