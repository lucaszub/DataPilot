"use client";

import React, { useMemo, useState } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
} from "@tanstack/react-table";
import { ChevronLeft, ChevronRight, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ColumnInfo } from "@/lib/api";

interface QueryResultTableProps {
  columns: ColumnInfo[];
  rows: Record<string, unknown>[];
  isLoading?: boolean;
}

export function QueryResultTable({
  columns: columnInfos,
  rows,
  isLoading = false,
}: QueryResultTableProps) {
  const [sorting, setSorting] = useState<SortingState>([]);

  const columns = useMemo<ColumnDef<Record<string, unknown>>[]>(() => {
    return columnInfos.map((col) => ({
      accessorKey: col.name,
      header: col.name,
      cell: ({ getValue }) => {
        const val = getValue();
        if (val === null || val === undefined) {
          return <span className="text-gray-400 italic">null</span>;
        }
        return <span title={String(val)}>{String(val)}</span>;
      },
    }));
  }, [columnInfos]);

  const table = useReactTable({
    data: rows,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
      pagination: { pageSize: 50 },
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12 text-gray-500">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent mr-3" />
        Execution en cours...
      </div>
    );
  }

  if (columnInfos.length === 0) {
    return (
      <div className="flex items-center justify-center py-12 text-sm text-gray-500">
        Executez une requete pour voir les resultats.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="overflow-x-auto rounded-lg border border-gray-200">
        <table className="w-full text-sm" aria-label="Resultats de la requete">
          <thead className="bg-gray-50 border-b border-gray-200">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    scope="col"
                    className="px-4 py-3 text-left font-semibold text-gray-700 whitespace-nowrap select-none"
                  >
                    {header.isPlaceholder ? null : (
                      <button
                        type="button"
                        className="flex items-center gap-1.5 hover:text-indigo-600 transition-colors"
                        onClick={header.column.getToggleSortingHandler()}
                        aria-label={`Trier par ${flexRender(header.column.columnDef.header, header.getContext())}`}
                      >
                        {flexRender(header.column.columnDef.header, header.getContext())}
                        {header.column.getIsSorted() === "asc" ? (
                          <ArrowUp className="h-3.5 w-3.5 text-indigo-600" />
                        ) : header.column.getIsSorted() === "desc" ? (
                          <ArrowDown className="h-3.5 w-3.5 text-indigo-600" />
                        ) : (
                          <ArrowUpDown className="h-3.5 w-3.5 text-gray-400" />
                        )}
                      </button>
                    )}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody className="divide-y divide-gray-100 bg-white">
            {table.getRowModel().rows.length === 0 ? (
              <tr>
                <td
                  colSpan={columnInfos.length || 1}
                  className="px-4 py-8 text-center text-gray-500"
                >
                  Aucun resultat.
                </td>
              </tr>
            ) : (
              table.getRowModel().rows.map((row) => (
                <tr key={row.id} className="hover:bg-gray-50 transition-colors">
                  {row.getVisibleCells().map((cell) => (
                    <td
                      key={cell.id}
                      className="px-4 py-3 text-gray-700 max-w-xs truncate"
                    >
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {rows.length > 0 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">
            {rows.length.toLocaleString("fr-FR")} ligne{rows.length > 1 ? "s" : ""}
          </p>
          {table.getPageCount() > 1 && (
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
                aria-label="Page precedente"
              >
                <ChevronLeft className="h-4 w-4" aria-hidden="true" />
                Precedent
              </Button>
              <span className="text-sm text-gray-700 tabular-nums" aria-live="polite">
                Page {table.getState().pagination.pageIndex + 1} sur {table.getPageCount()}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
                aria-label="Page suivante"
              >
                Suivant
                <ChevronRight className="h-4 w-4" aria-hidden="true" />
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
