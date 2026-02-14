import React from "react";
import { cn } from "@/lib/utils";

interface Column {
  name: string;
  type: string;
}

interface SchemaTableProps {
  columns: Column[];
}

const TYPE_BADGE_CLASSES: Record<string, string> = {
  VARCHAR: "bg-blue-100 text-blue-700",
  TEXT: "bg-blue-100 text-blue-700",
  INTEGER: "bg-purple-100 text-purple-700",
  BIGINT: "bg-purple-100 text-purple-700",
  INT: "bg-purple-100 text-purple-700",
  DOUBLE: "bg-green-100 text-green-700",
  FLOAT: "bg-green-100 text-green-700",
  DECIMAL: "bg-green-100 text-green-700",
  BOOLEAN: "bg-orange-100 text-orange-700",
  DATE: "bg-red-100 text-red-700",
  TIMESTAMP: "bg-red-100 text-red-700",
};

function getTypeBadgeClass(type: string): string {
  const normalized = type.toUpperCase();
  for (const key of Object.keys(TYPE_BADGE_CLASSES)) {
    if (normalized.startsWith(key)) {
      return TYPE_BADGE_CLASSES[key];
    }
  }
  return "bg-gray-100 text-gray-600";
}

export function SchemaTable({ columns }: SchemaTableProps) {
  if (columns.length === 0) {
    return (
      <p className="text-sm text-gray-500">Aucune colonne disponible.</p>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border border-gray-200">
      <table className="w-full text-sm" aria-label="Schema des colonnes">
        <thead className="bg-gray-50 border-b border-gray-200">
          <tr>
            <th
              scope="col"
              className="px-4 py-3 text-left font-semibold text-gray-700"
            >
              Colonne
            </th>
            <th
              scope="col"
              className="px-4 py-3 text-left font-semibold text-gray-700"
            >
              Type
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 bg-white">
          {columns.map((col, index) => (
            <tr key={index} className="hover:bg-gray-50 transition-colors">
              <td className="px-4 py-3 font-mono text-sm text-gray-900">
                {col.name}
              </td>
              <td className="px-4 py-3">
                <span
                  className={cn(
                    "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
                    getTypeBadgeClass(col.type)
                  )}
                >
                  {col.type}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
