"use client";

import React, { useState, useMemo } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  ColumnDef,
  flexRender,
} from '@tanstack/react-table';
import { Filter, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useExplorer } from './ExplorerContext';

const numberFormatter = new Intl.NumberFormat('fr-FR', {
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

const dateFormatter = new Intl.DateTimeFormat('fr-FR', {
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

type AggregationType = 'SUM' | 'AVG' | 'MIN' | 'MAX' | 'COUNT';

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

export function SpreadsheetView() {
  const { state } = useExplorer();
  const [selectedRow, setSelectedRow] = useState<number | null>(null);
  const [columnWidths, setColumnWidths] = useState<Record<string, number>>({});
  const [columnAggregations, setColumnAggregations] = useState<Record<string, AggregationType>>({});
  const [columnFilters, setColumnFilters] = useState<Record<string, string>>({});
  const [showFilterPopover, setShowFilterPopover] = useState<string | null>(null);

  const cycleAggregation = (columnName: string) => {
    const current = columnAggregations[columnName] || 'SUM';
    const cycle: AggregationType[] = ['SUM', 'AVG', 'MIN', 'MAX', 'COUNT'];
    const nextIndex = (cycle.indexOf(current) + 1) % cycle.length;
    setColumnAggregations(prev => ({
      ...prev,
      [columnName]: cycle[nextIndex],
    }));
  };

  const calculateFooterValue = (columnKey: string, columnType: string | undefined): string => {
    if (!state.result) return '';

    const values = state.result.rows
      .map(row => row[columnKey])
      .filter(v => v !== null && v !== undefined);

    if (values.length === 0) return '—';

    const aggType = columnAggregations[columnKey] || 'SUM';

    if (columnType === 'DOUBLE') {
      const numericValues = values.filter(v => typeof v === 'number') as number[];
      if (numericValues.length === 0) return '—';

      let result = 0;
      switch (aggType) {
        case 'SUM':
          result = numericValues.reduce((a, b) => a + b, 0);
          break;
        case 'AVG':
          result = numericValues.reduce((a, b) => a + b, 0) / numericValues.length;
          break;
        case 'MIN':
          result = Math.min(...numericValues);
          break;
        case 'MAX':
          result = Math.max(...numericValues);
          break;
        case 'COUNT':
          result = numericValues.length;
          break;
      }
      return numberFormatter.format(result);
    }

    return `${values.length}`;
  };

  const columns = useMemo<ColumnDef<Record<string, unknown>>[]>(() => {
    if (!state.result || state.result.columns.length === 0) {
      return [];
    }

    return state.result.columns.map(col => ({
      accessorKey: col.key,
      header: () => (
        <div className="flex items-center gap-1">
          <span className="flex-1 font-medium text-xs">{col.name}</span>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowFilterPopover(showFilterPopover === col.key ? null : col.key);
            }}
            className={cn(
              "p-0.5 rounded hover:bg-muted transition-colors",
              columnFilters[col.key] && "text-primary"
            )}
          >
            <Filter className="h-3 w-3" />
          </button>
        </div>
      ),
      cell: ({ getValue }) => {
        const value = getValue();
        const displayType = col.type === 'DOUBLE' ? 'number' : col.type === 'DATE' || col.type === 'TIMESTAMP' ? 'date' : 'string';
        return (
          <span className={cn(
            'text-xs',
            col.type === 'DOUBLE' && 'text-right tabular-nums',
            (value === null || value === undefined) && 'italic text-muted-foreground'
          )}>
            {formatCellValue(value, displayType)}
          </span>
        );
      },
      footer: () => (
        <button
          onClick={() => col.type === 'DOUBLE' && cycleAggregation(col.key)}
          className={cn(
            "text-xs font-medium text-left w-full hover:bg-muted/50 transition-colors p-1 rounded",
            col.type === 'DOUBLE' ? 'cursor-pointer text-primary' : 'cursor-default text-muted-foreground'
          )}
        >
          <div className="flex items-center gap-1">
            {col.type === 'DOUBLE' && (
              <span className="text-[10px] uppercase opacity-70">
                {columnAggregations[col.key] || 'SUM'}
              </span>
            )}
            <span className={col.type === 'DOUBLE' ? 'tabular-nums' : ''}>
              {calculateFooterValue(col.key, col.type)}
            </span>
          </div>
        </button>
      ),
      size: columnWidths[col.key] || 150,
    }));
  }, [state.result, columnWidths, columnAggregations, columnFilters, showFilterPopover]);

  const table = useReactTable({
    data: state.result?.rows || [],
    columns,
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
          <p className="text-muted-foreground text-sm">
            Aucune donnée à afficher en mode tableur
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Spreadsheet table */}
      <div className="border border-border rounded-lg overflow-hidden bg-card">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead className="bg-muted/50 border-b border-border sticky top-0">
              {table.getHeaderGroups().map(headerGroup => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map(header => (
                    <th
                      key={header.id}
                      className="px-2 py-1.5 text-left border-r border-border last:border-r-0 relative"
                      style={{ width: header.column.getSize() }}
                    >
                      {flexRender(
                        header.column.columnDef.header,
                        header.getContext()
                      )}

                      {/* Resize handle */}
                      <div
                        onMouseDown={(e) => {
                          const startX = e.clientX;
                          const startWidth = header.column.getSize();

                          const handleMouseMove = (e: MouseEvent) => {
                            const diff = e.clientX - startX;
                            const newWidth = Math.max(50, startWidth + diff);
                            setColumnWidths(prev => ({
                              ...prev,
                              [header.column.id]: newWidth,
                            }));
                          };

                          const handleMouseUp = () => {
                            document.removeEventListener('mousemove', handleMouseMove);
                            document.removeEventListener('mouseup', handleMouseUp);
                          };

                          document.addEventListener('mousemove', handleMouseMove);
                          document.addEventListener('mouseup', handleMouseUp);
                        }}
                        className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-primary/50"
                      />

                      {/* Filter popover */}
                      {showFilterPopover === header.column.id && (
                        <div className="absolute z-10 mt-1 bg-card border border-border rounded-lg shadow-lg p-2 min-w-[200px]">
                          <input
                            type="text"
                            placeholder="Filtrer..."
                            value={columnFilters[header.column.id] || ''}
                            onChange={(e) => setColumnFilters(prev => ({
                              ...prev,
                              [header.column.id]: e.target.value,
                            }))}
                            className="w-full px-2 py-1 text-xs bg-background border border-border rounded focus:outline-none focus:ring-1 focus:ring-primary"
                          />
                        </div>
                      )}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody className="divide-y divide-border">
              {table.getRowModel().rows.map((row, idx) => (
                <tr
                  key={row.id}
                  onClick={() => setSelectedRow(idx)}
                  className={cn(
                    'hover:bg-muted/30 transition-colors cursor-pointer',
                    idx % 2 === 0 && 'bg-muted/5',
                    selectedRow === idx && 'ring-2 ring-primary ring-inset'
                  )}
                >
                  {row.getVisibleCells().map(cell => (
                    <td
                      key={cell.id}
                      className="px-2 py-1 border-r border-border last:border-r-0"
                    >
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-muted/50 border-t-2 border-border sticky bottom-0">
              {table.getFooterGroups().map(footerGroup => (
                <tr key={footerGroup.id}>
                  {footerGroup.headers.map(header => (
                    <td
                      key={header.id}
                      className="px-2 py-1.5 border-r border-border last:border-r-0"
                    >
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
        <div className="text-xs text-muted-foreground">
          Lignes{' '}
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
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
            className={cn(
              "p-1.5 rounded border border-border transition-colors",
              table.getCanPreviousPage()
                ? "hover:bg-muted text-foreground"
                : "opacity-50 cursor-not-allowed text-muted-foreground"
            )}
          >
            <ChevronLeft className="h-3.5 w-3.5" />
          </button>

          <div className="text-xs text-muted-foreground">
            <span className="font-medium text-foreground">
              {table.getState().pagination.pageIndex + 1}
            </span>
            {' '}/{' '}
            <span className="font-medium text-foreground">
              {table.getPageCount()}
            </span>
          </div>

          <button
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
            className={cn(
              "p-1.5 rounded border border-border transition-colors",
              table.getCanNextPage()
                ? "hover:bg-muted text-foreground"
                : "opacity-50 cursor-not-allowed text-muted-foreground"
            )}
          >
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
