"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Download, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useExplorer } from './ExplorerContext';

type ExportFormat = 'csv_fr' | 'csv_int';

const formatLabels: Record<ExportFormat, string> = {
  csv_fr: 'CSV (format français)',
  csv_int: 'CSV (format international)',
};

function formatCsvValue(value: unknown, format: ExportFormat): string {
  if (value === null || value === undefined) {
    return '';
  }

  const str = String(value);

  // Handle numbers
  if (typeof value === 'number') {
    if (format === 'csv_fr') {
      // French format: comma as decimal separator
      return str.replace('.', ',');
    }
    return str;
  }

  // Escape quotes and wrap in quotes if contains delimiter or newline
  const delimiter = format === 'csv_fr' ? ';' : ',';
  if (str.includes(delimiter) || str.includes('\n') || str.includes('"')) {
    return `"${str.replace(/"/g, '""')}"`;
  }

  return str;
}

function generateCsv(
  rows: Record<string, unknown>[],
  columns: Array<{ key: string; name: string }>,
  format: ExportFormat
): string {
  const delimiter = format === 'csv_fr' ? ';' : ',';
  const lines: string[] = [];

  // Header row
  const headers = columns.map(col => col.name).join(delimiter);
  lines.push(headers);

  // Data rows
  rows.forEach(row => {
    const values = columns.map(col => formatCsvValue(row[col.key], format));
    lines.push(values.join(delimiter));
  });

  return lines.join('\n');
}

export function ExportButton() {
  const { state } = useExplorer();
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };

    if (showDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showDropdown]);

  const exportCsv = (format: ExportFormat) => {
    if (!state.result || state.result.rows.length === 0) return;

    const csv = generateCsv(state.result.rows, state.result.columns, format);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);

    const date = new Date().toISOString().split('T')[0];
    const filename = `datapilot-export-${date}.csv`;

    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setShowDropdown(false);
  };

  const hasData = state.result && state.result.rows.length > 0;

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        disabled={!hasData}
        className={cn(
          "flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors",
          hasData
            ? "bg-muted text-foreground hover:bg-muted/80"
            : "bg-muted text-muted-foreground cursor-not-allowed opacity-50"
        )}
      >
        <Download className="h-4 w-4" />
        <span>Exporter</span>
        <ChevronDown className="h-3.5 w-3.5" />
      </button>

      {/* Dropdown menu */}
      {showDropdown && hasData && (
        <div className="absolute right-0 mt-2 w-56 bg-card border border-border rounded-lg shadow-lg overflow-hidden z-10">
          <div className="py-1">
            <button
              onClick={() => exportCsv('csv_fr')}
              className="w-full px-4 py-2 text-left text-sm hover:bg-muted/50 transition-colors flex items-center gap-2"
            >
              <Download className="h-4 w-4 text-muted-foreground" />
              <div>
                <div className="text-foreground font-medium">
                  {formatLabels.csv_fr}
                </div>
                <div className="text-xs text-muted-foreground">
                  Délimiteur: ; / Décimal: ,
                </div>
              </div>
            </button>

            <button
              onClick={() => exportCsv('csv_int')}
              className="w-full px-4 py-2 text-left text-sm hover:bg-muted/50 transition-colors flex items-center gap-2"
            >
              <Download className="h-4 w-4 text-muted-foreground" />
              <div>
                <div className="text-foreground font-medium">
                  {formatLabels.csv_int}
                </div>
                <div className="text-xs text-muted-foreground">
                  Délimiteur: , / Décimal: .
                </div>
              </div>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
