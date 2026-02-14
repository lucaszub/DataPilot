import React from "react";
import { ArrowUpDown, Plus, ChevronDown, ChevronRight, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { SortRule } from "./types";
import type { SemanticLayerDetail } from "@/lib/api";

interface SortPanelProps {
  sortRules: SortRule[];
  addSort: () => void;
  updateSort: (index: number, updates: Partial<SortRule>) => void;
  removeSort: (index: number) => void;
  showSorts: boolean;
  setShowSorts: (show: boolean) => void;
  layerDetail: SemanticLayerDetail | undefined;
}

export function SortPanel({
  sortRules,
  addSort,
  updateSort,
  removeSort,
  showSorts,
  setShowSorts,
  layerDetail,
}: SortPanelProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setShowSorts(!showSorts)}
          className="flex items-center gap-1.5 text-xs text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ArrowUpDown className="h-3.5 w-3.5" />
          Tri
          {sortRules.length > 0 && (
            <span className="inline-flex items-center justify-center h-4 w-4 rounded-full bg-teal-100 text-teal-700 text-[10px] font-semibold">
              {sortRules.length}
            </span>
          )}
          {showSorts ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
        </button>
        {showSorts && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={addSort}
            className="h-6 px-2 text-xs"
          >
            <Plus className="h-3 w-3 mr-1" />
            Ajouter un tri
          </Button>
        )}
      </div>

      {showSorts && sortRules.length > 0 && (
        <div className="space-y-2 pl-5">
          {sortRules.map((sort, index) => {
            // Get available columns from all nodes
            const allColumns = layerDetail?.definitions_json?.nodes.flatMap(node =>
              node.columns
                .filter(col => col.role !== 'ignore')
                .map(col => ({
                  name: col.name,
                  tableName: node.data_source_name,
                  label: `${node.data_source_name}.${col.name}`,
                }))
            ) ?? [];

            return (
              <div key={index} className="flex items-center gap-2 text-xs">
                {/* Column selector */}
                <select
                  value={`${sort.tableName}.${sort.column}`}
                  onChange={(e) => {
                    const [tableName, ...columnParts] = e.target.value.split('.');
                    const column = columnParts.join('.');
                    updateSort(index, { tableName, column });
                  }}
                  className="rounded-md border border-gray-200 bg-white px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-teal-500"
                >
                  {allColumns.map((col) => (
                    <option key={col.label} value={col.label}>
                      {col.label}
                    </option>
                  ))}
                </select>

                {/* Direction toggle */}
                <select
                  value={sort.direction}
                  onChange={(e) => updateSort(index, { direction: e.target.value as 'ASC' | 'DESC' })}
                  className="rounded-md border border-gray-200 bg-white px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-teal-500"
                >
                  <option value="ASC">Croissant</option>
                  <option value="DESC">Décroissant</option>
                </select>

                {/* Remove button */}
                <button
                  type="button"
                  onClick={() => removeSort(index)}
                  className="text-gray-400 hover:text-red-500 transition-colors"
                  aria-label="Supprimer le tri"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
