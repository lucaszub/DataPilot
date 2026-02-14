"use client";

import { Handle, Position, type Node, type NodeProps } from '@xyflow/react';

interface ColumnData {
  name: string;
  type: string;
  role: 'dimension' | 'measure' | 'ignore';
}

export type TableNodeData = Node<{
  label: string;
  columns: ColumnData[];
  dataSourceId: string;
}, 'tableNode'>;

export function TableNode({ data }: NodeProps<TableNodeData>) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white shadow-md min-w-[240px]">
      {/* Header */}
      <div className="rounded-t-lg bg-indigo-600 px-4 py-2">
        <h3 className="text-sm font-semibold text-white truncate">
          {data.label}
        </h3>
      </div>

      {/* Columns */}
      <div className="divide-y divide-gray-100">
        {data.columns.map((column: ColumnData) => {
          const roleColor =
            column.role === 'dimension' ? 'text-blue-600 bg-blue-50' :
            column.role === 'measure' ? 'text-green-600 bg-green-50' :
            'text-gray-400 bg-gray-50';

          const roleLabel =
            column.role === 'dimension' ? 'D' :
            column.role === 'measure' ? 'M' :
            '—';

          return (
            <div
              key={column.name}
              className="relative flex items-center gap-2 bg-gray-50 px-3 py-2 hover:bg-gray-100 transition-colors"
            >
              {/* Left handle (source) */}
              <Handle
                type="source"
                position={Position.Right}
                id={`${column.name}-source`}
                className="!w-3 !h-3 !bg-indigo-500 !border-2 !border-white"
                style={{ right: -6 }}
              />

              {/* Right handle (target) */}
              <Handle
                type="target"
                position={Position.Left}
                id={`${column.name}-target`}
                className="!w-3 !h-3 !bg-indigo-500 !border-2 !border-white"
                style={{ left: -6 }}
              />

              {/* Role badge */}
              <span
                className={`flex h-5 w-5 shrink-0 items-center justify-center rounded text-xs font-bold ${roleColor}`}
                title={column.role}
              >
                {roleLabel}
              </span>

              {/* Column info */}
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {column.name}
                </p>
                <p className="text-xs text-gray-500 truncate">
                  {column.type}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
