"use client";

import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Column {
  name: string;
  type: string;
}

interface DataPreviewTableProps {
  columns: Column[];
  rows: Record<string, unknown>[];
  page: number;
  totalPages: number;
  totalRows: number;
  onPrevPage: () => void;
  onNextPage: () => void;
  isLoading?: boolean;
}

export function DataPreviewTable({
  columns,
  rows,
  page,
  totalPages,
  totalRows,
  onPrevPage,
  onNextPage,
  isLoading = false,
}: DataPreviewTableProps) {
  return (
    <div className="space-y-3">
      {/* Table */}
      <div className="overflow-x-auto rounded-lg border border-gray-200">
        <table
          className="w-full text-sm"
          aria-label="Apercu des donnees"
          aria-busy={isLoading}
        >
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              {columns.map((col) => (
                <th
                  key={col.name}
                  scope="col"
                  className="px-4 py-3 text-left font-semibold text-gray-700 whitespace-nowrap"
                >
                  {col.name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 bg-white">
            {isLoading ? (
              <tr>
                <td
                  colSpan={columns.length || 1}
                  className="px-4 py-8 text-center text-gray-500"
                >
                  Chargement...
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length || 1}
                  className="px-4 py-8 text-center text-gray-500"
                >
                  Aucune donnee disponible.
                </td>
              </tr>
            ) : (
              rows.map((row, rowIndex) => (
                <tr
                  key={rowIndex}
                  className="hover:bg-gray-50 transition-colors"
                >
                  {columns.map((col) => (
                    <td
                      key={col.name}
                      className="px-4 py-3 text-gray-700 max-w-xs truncate"
                      title={String(row[col.name] ?? "")}
                    >
                      {row[col.name] === null || row[col.name] === undefined ? (
                        <span className="text-gray-400 italic">null</span>
                      ) : (
                        String(row[col.name])
                      )}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">
          {totalRows.toLocaleString("fr-FR")} lignes au total
        </p>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={onPrevPage}
            disabled={page <= 1 || isLoading}
            aria-label="Page precedente"
          >
            <ChevronLeft className="h-4 w-4" aria-hidden="true" />
            Precedent
          </Button>
          <span className="text-sm text-gray-700 tabular-nums" aria-live="polite">
            Page {page} sur {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={onNextPage}
            disabled={page >= totalPages || isLoading}
            aria-label="Page suivante"
          >
            Suivant
            <ChevronRight className="h-4 w-4" aria-hidden="true" />
          </Button>
        </div>
      </div>
    </div>
  );
}
