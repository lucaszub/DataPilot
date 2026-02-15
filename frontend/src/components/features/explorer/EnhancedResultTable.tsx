"use client";

import React, { useMemo, useState } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  ColumnDef,
  SortingState,
  flexRender,
} from '@tanstack/react-table';
import { ArrowUp, ArrowDown, ChevronLeft, ChevronRight, MoreHorizontal, Plus, X, Calculator } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useExplorer, calcFormulaLabels } from './ExplorerContext';
import { ColumnActionsMenu } from './ColumnActionsMenu';
import { AddCalculatedColumnModal } from './AddCalculatedColumnModal';
import type { ColumnInfo } from '@/lib/mock-data/query-engine';

const numberFormatter = new Intl.NumberFormat('fr-FR', {
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

const dateFormatter = new Intl.DateTimeFormat('fr-FR', {
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

function formatCellValue(value: unknown, columnType?: string): string {
  if (value === null || value === undefined) {
    return '—';
  }

  if (columnType === 'number' && typeof value === 'number') {
    return numberFormatter.format(value);
  }

  if (columnType === 'date' && (value instanceof Date || typeof value === 'string')) {
    const date = value instanceof Date ? value : new Date(value);
    if (!isNaN(date.getTime())) {
      return dateFormatter.format(date);
    }
  }

  return String(value);
}

interface ColumnMenuState {
  column: ColumnInfo | null;
  position: { x: number; y: number };
}

export function EnhancedResultTable() {
  const { state, dispatch } = useExplorer();
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnMenu, setColumnMenu] = useState<ColumnMenuState>({ column: null, position: { x: 0, y: 0 } });
  const [showCalcModal, setShowCalcModal] = useState(false);
  const [calcModalPreselect, setCalcModalPreselect] = useState<string | undefined>(undefined);

  const columns = useMemo<ColumnDef<Record<string, unknown>>[]>(() => {
    if (!state.result || state.result.columns.length === 0) {
      return [];
    }

    // Regular data columns
    const dataCols: ColumnDef<Record<string, unknown>>[] = state.result.columns.map(col => {
      // Check if this is a calculated column
      const calcCol = state.calculatedColumns.find(cc => col.key === `calc_${cc.id}`);

      return {
        accessorKey: col.key,
        header: ({ column }) => {
          if (calcCol) {
            // Calculated column header: purple badge + remove button
            return (
              <div className="flex items-center gap-1.5 group/header">
                <div className="flex items-center gap-1.5 flex-1">
                  <Calculator className="h-3 w-3 text-purple-500" />
                  <span className="font-medium text-purple-700">{calcCol.label}</span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-purple-100 text-purple-600 font-medium">
                    {calcFormulaLabels[calcCol.formula].split('(')[0].trim()}
                  </span>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    dispatch({ type: 'REMOVE_CALCULATED_COLUMN', columnId: calcCol.id });
                  }}
                  className="p-0.5 rounded opacity-0 group-hover/header:opacity-100 hover:bg-red-100 transition-all"
                  title="Supprimer la colonne calculée"
                >
                  <X className="h-3 w-3 text-red-500" />
                </button>
              </div>
            );
          }

          // Normal column header
          return (
            <div className="flex items-center gap-1 group/header">
              <button
                onClick={() => {
                  const currentSort = column.getIsSorted();
                  const newDirection = currentSort === 'asc' ? 'desc' : 'asc';

                  const existingSort = state.sortRules.find(s => s.column === col.name && s.tableName === col.tableName);
                  if (existingSort) {
                    dispatch({ type: 'REMOVE_SORT', sortId: existingSort.id });
                  }

                  const newSort = {
                    id: `sort-${Date.now()}`,
                    column: col.name,
                    tableName: col.tableName,
                    direction: newDirection === 'asc' ? 'ASC' as const : 'DESC' as const,
                  };
                  dispatch({ type: 'ADD_SORT', sort: newSort });

                  column.toggleSorting(newDirection === 'desc');
                }}
                className="flex items-center gap-1.5 font-medium text-left hover:text-primary transition-colors flex-1"
              >
                <span className="text-[10px] text-muted-foreground">{col.tableName}.</span>
                {col.name}
                {column.getIsSorted() === 'asc' && <ArrowUp className="h-3.5 w-3.5" />}
                {column.getIsSorted() === 'desc' && <ArrowDown className="h-3.5 w-3.5" />}
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  const rect = (e.target as HTMLElement).getBoundingClientRect();
                  setColumnMenu({
                    column: col,
                    position: { x: rect.left, y: rect.bottom + 4 },
                  });
                }}
                className="p-0.5 rounded opacity-0 group-hover/header:opacity-100 hover:bg-muted transition-all"
                title="Actions sur la colonne"
              >
                <MoreHorizontal className="h-3.5 w-3.5 text-muted-foreground" />
              </button>
            </div>
          );
        },
        cell: ({ getValue }) => {
          const value = getValue();
          const isCalc = !!calcCol;
          return (
            <span className={cn(
              (col.type === 'DOUBLE' || isCalc) && 'text-right tabular-nums',
              isCalc && 'text-purple-700 font-medium',
              (value === null || value === undefined) && 'italic text-muted-foreground'
            )}>
              {formatCellValue(value, (col.type === 'DOUBLE' || isCalc) ? 'number' : col.type === 'DATE' || col.type === 'TIMESTAMP' ? 'date' : 'string')}
            </span>
          );
        },
        footer: () => {
          if (!state.result) return null;

          if (col.type === 'DOUBLE' || calcCol) {
            const sum = state.result.rows.reduce((acc, row) => {
              const val = row[col.key];
              return acc + (typeof val === 'number' ? val : 0);
            }, 0);
            return (
              <div className={cn("text-right font-medium tabular-nums", calcCol && "text-purple-700")}>
                {numberFormatter.format(sum)}
              </div>
            );
          }

          return (
            <div className="font-medium text-muted-foreground">
              {state.result.rows.length} lignes
            </div>
          );
        },
      };
    });

    // "+" column to add calculated columns
    dataCols.push({
      id: '__add_calc__',
      header: () => (
        <button
          onClick={() => {
            setCalcModalPreselect(undefined);
            setShowCalcModal(true);
          }}
          className="flex items-center justify-center w-full p-1 rounded hover:bg-primary/10 transition-colors group/add"
          title="Ajouter une colonne calculée"
        >
          <Plus className="h-4 w-4 text-muted-foreground group-hover/add:text-primary transition-colors" />
        </button>
      ),
      cell: () => null,
      footer: () => null,
      size: 44,
      minSize: 44,
      maxSize: 44,
    });

    return dataCols;
  }, [state.result, state.sortRules, state.calculatedColumns, dispatch]);

  const table = useReactTable({
    data: state.result?.rows || [],
    columns,
    state: {
      sorting,
    },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
      pagination: {
        pageSize: 50,
      },
    },
  });

  if (!state.result || state.result.rows.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 bg-card border border-border rounded-lg">
        <div className="text-center">
          <p className="text-muted-foreground">
            {state.selectedFields.length === 0
              ? 'Sélectionnez des champs pour commencer'
              : 'Cliquez sur "Exécuter" pour voir les résultats'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Table */}
      <div className="border border-border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/50 border-b border-border">
              {table.getHeaderGroups().map(headerGroup => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map(header => (
                    <th
                      key={header.id}
                      className="px-4 py-3 text-sm text-left"
                    >
                      {flexRender(
                        header.column.columnDef.header,
                        header.getContext()
                      )}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody className="bg-card divide-y divide-border">
              {table.getRowModel().rows.map((row, idx) => (
                <tr
                  key={row.id}
                  className={cn(
                    'hover:bg-muted/30 transition-colors',
                    idx % 2 === 0 && 'bg-muted/10'
                  )}
                >
                  {row.getVisibleCells().map(cell => (
                    <td key={cell.id} className="px-4 py-2.5 text-sm">
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-muted/50 border-t-2 border-border">
              {table.getFooterGroups().map(footerGroup => (
                <tr key={footerGroup.id}>
                  {footerGroup.headers.map(header => (
                    <td key={header.id} className="px-4 py-3 text-sm">
                      {flexRender(
                        header.column.columnDef.footer,
                        header.getContext()
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tfoot>
          </table>
        </div>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          Affichage de{' '}
          <span className="font-medium text-foreground">
            {table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1}
          </span>
          {' '}-{' '}
          <span className="font-medium text-foreground">
            {Math.min(
              (table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize,
              table.getFilteredRowModel().rows.length
            )}
          </span>
          {' '}sur{' '}
          <span className="font-medium text-foreground">
            {table.getFilteredRowModel().rows.length}
          </span>
          {' '}lignes
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
            className={cn(
              "p-2 rounded-lg border border-border transition-colors",
              table.getCanPreviousPage()
                ? "hover:bg-muted text-foreground"
                : "opacity-50 cursor-not-allowed text-muted-foreground"
            )}
          >
            <ChevronLeft className="h-4 w-4" />
          </button>

          <div className="text-sm text-muted-foreground">
            Page{' '}
            <span className="font-medium text-foreground">
              {table.getState().pagination.pageIndex + 1}
            </span>
            {' '}sur{' '}
            <span className="font-medium text-foreground">
              {table.getPageCount()}
            </span>
          </div>

          <button
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
            className={cn(
              "p-2 rounded-lg border border-border transition-colors",
              table.getCanNextPage()
                ? "hover:bg-muted text-foreground"
                : "opacity-50 cursor-not-allowed text-muted-foreground"
            )}
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Column Actions Menu */}
      {columnMenu.column && (
        <ColumnActionsMenu
          column={columnMenu.column}
          position={columnMenu.position}
          onClose={() => setColumnMenu({ column: null, position: { x: 0, y: 0 } })}
          onAddCalculatedColumn={(preselect) => {
            setCalcModalPreselect(preselect);
            setShowCalcModal(true);
            setColumnMenu({ column: null, position: { x: 0, y: 0 } });
          }}
        />
      )}

      {/* Add Calculated Column Modal */}
      {showCalcModal && (
        <AddCalculatedColumnModal
          onClose={() => setShowCalcModal(false)}
          preselectedColumnA={calcModalPreselect}
        />
      )}
    </div>
  );
}
