"use client"

import { cn } from '@/lib/utils';

interface TableWidgetProps {
  data: Record<string, any>[];
  columns?: string[];
}

export function TableWidget({ data, columns }: TableWidgetProps) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
        Aucune donnée disponible
      </div>
    );
  }

  const cols = columns || Object.keys(data[0]);

  // Format value based on type
  const formatValue = (value: any): string => {
    if (value === null || value === undefined) return '-';

    if (typeof value === 'number') {
      return new Intl.NumberFormat('fr-FR', {
        maximumFractionDigits: 2,
      }).format(value);
    }

    return String(value);
  };

  // Check if column likely contains numbers
  const isNumericColumn = (colName: string): boolean => {
    const sample = data.slice(0, 5);
    return sample.every(row => typeof row[colName] === 'number');
  };

  return (
    <div className="w-full h-full overflow-auto">
      <table className="w-full text-xs">
        <thead className="sticky top-0 bg-muted z-10">
          <tr>
            {cols.map((col) => (
              <th
                key={col}
                className={cn(
                  "px-3 py-2 text-left font-semibold border-b border-border",
                  isNumericColumn(col) && "text-right"
                )}
              >
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.slice(0, 10).map((row, rowIndex) => (
            <tr
              key={rowIndex}
              className={cn(
                "hover:bg-muted/50 transition-colors",
                rowIndex % 2 === 0 ? "bg-background" : "bg-muted/20"
              )}
            >
              {cols.map((col) => (
                <td
                  key={col}
                  className={cn(
                    "px-3 py-2 border-b border-border",
                    isNumericColumn(col) && "text-right"
                  )}
                >
                  {formatValue(row[col])}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {data.length > 10 && (
        <div className="text-xs text-muted-foreground text-center py-2">
          Affichage de 10 lignes sur {data.length}
        </div>
      )}
    </div>
  );
}
