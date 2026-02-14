import React from "react";
import {
  ChevronDown,
  ChevronRight,
  Trash2,
  FileCode,
  Plus,
  CalendarDays,
  Hash,
  Type as TypeIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { isNumericType, isDateType } from "./utils";
import type { SelectedField } from "./types";
import type { WorkspaceResponse, SemanticLayerDetail, SavedQueryResponse } from "@/lib/api";

interface ExplorerSidebarProps {
  workspaces: WorkspaceResponse[] | undefined;
  selectedWorkspaceId: string | null;
  setSelectedWorkspaceId: (id: string | null) => void;
  layerDetail: SemanticLayerDetail | undefined;
  expandedModels: Set<string>;
  toggleModel: (modelName: string) => void;
  selectedFields: SelectedField[];
  addField: (columnName: string, tableName: string, colType: string, colRole?: 'dimension' | 'measure' | 'ignore') => void;
  metrics: Array<{ name: string; tableName: string }>;
  savedQueries: SavedQueryResponse[];
  showSavedQueries: boolean;
  setShowSavedQueries: (show: boolean) => void;
  handleLoadSavedQuery: (queryText: string) => void;
  handleDeleteSaved: (queryId: string) => void;
  wsLoading: boolean;
}

export function ExplorerSidebar({
  workspaces,
  selectedWorkspaceId,
  setSelectedWorkspaceId,
  layerDetail,
  expandedModels,
  toggleModel,
  selectedFields,
  addField,
  metrics,
  savedQueries,
  showSavedQueries,
  setShowSavedQueries,
  handleLoadSavedQuery,
  handleDeleteSaved,
  wsLoading,
}: ExplorerSidebarProps) {
  return (
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
  );
}
