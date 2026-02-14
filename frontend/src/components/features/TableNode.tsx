"use client";

import { memo } from 'react';
import { Handle, Position, type Node, type NodeProps, useReactFlow } from '@xyflow/react';
import { Table, Hash, Type, Calendar, ToggleLeft } from 'lucide-react';

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

// Helper to get icon for column type
function getColumnTypeIcon(type: string) {
  const lowerType = type.toLowerCase();
  if (lowerType.includes('int') || lowerType.includes('float') || lowerType.includes('double') || lowerType.includes('decimal') || lowerType.includes('numeric')) {
    return Hash;
  }
  if (lowerType.includes('date') || lowerType.includes('time')) {
    return Calendar;
  }
  if (lowerType.includes('bool')) {
    return ToggleLeft;
  }
  return Type; // text/string
}

export const TableNode = memo(({ data, id }: NodeProps<TableNodeData>) => {
  const { setNodes } = useReactFlow();

  const handleRoleClick = (columnName: string, currentRole: 'dimension' | 'measure' | 'ignore') => {
    // Cycle through roles: dimension → measure → ignore → dimension
    const nextRole: Record<string, 'dimension' | 'measure' | 'ignore'> = {
      dimension: 'measure',
      measure: 'ignore',
      ignore: 'dimension',
    };

    setNodes((nodes) =>
      nodes.map((node) => {
        if (node.id === id && node.type === 'tableNode') {
          const nodeData = node.data as TableNodeData['data'];
          return {
            ...node,
            data: {
              ...nodeData,
              columns: nodeData.columns.map((col: ColumnData) =>
                col.name === columnName ? { ...col, role: nextRole[currentRole] } : col
              ),
            },
          };
        }
        return node;
      })
    );
  };

  return (
    <div className="rounded-lg border border-gray-300 bg-white shadow-lg hover:shadow-xl transition-shadow min-w-[280px] group">
      {/* Header with gradient */}
      <div className="rounded-t-lg bg-gradient-to-r from-indigo-600 to-indigo-700 px-4 py-3 flex items-center gap-2">
        <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded bg-white/20">
          <Table className="h-4 w-4 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-white truncate">
            {data.label}
          </h3>
          <p className="text-xs text-indigo-100">
            {data.columns.length} colonnes
          </p>
        </div>
      </div>

      {/* Columns */}
      <div className="divide-y divide-gray-100">
        {data.columns.map((column: ColumnData) => {
          const TypeIcon = getColumnTypeIcon(column.type);

          const roleConfig = {
            dimension: {
              color: 'bg-blue-100 text-blue-700 border-blue-200 hover:bg-blue-200',
              label: 'D',
              title: 'Dimension (cliquer pour changer)',
            },
            measure: {
              color: 'bg-green-100 text-green-700 border-green-200 hover:bg-green-200',
              label: 'M',
              title: 'Mesure (cliquer pour changer)',
            },
            ignore: {
              color: 'bg-gray-100 text-gray-500 border-gray-200 hover:bg-gray-200',
              label: '—',
              title: 'Ignore (cliquer pour changer)',
            },
          };

          const config = roleConfig[column.role];

          return (
            <div
              key={column.name}
              className="relative flex items-center gap-2 bg-white px-3 py-2.5 hover:bg-gray-50 transition-colors group/row"
            >
              {/* Source handle (right) */}
              <Handle
                type="source"
                position={Position.Right}
                id={`${column.name}-source`}
                className="!w-2.5 !h-2.5 !bg-indigo-500 !border-2 !border-white opacity-0 group-hover/row:opacity-100 hover:!scale-150 transition-all"
                style={{ right: -5 }}
              />

              {/* Target handle (left) */}
              <Handle
                type="target"
                position={Position.Left}
                id={`${column.name}-target`}
                className="!w-2.5 !h-2.5 !bg-indigo-500 !border-2 !border-white opacity-0 group-hover/row:opacity-100 hover:!scale-150 transition-all"
                style={{ left: -5 }}
              />

              {/* Type icon */}
              <TypeIcon className="h-4 w-4 text-gray-400 shrink-0" />

              {/* Column info */}
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {column.name}
                </p>
                <p className="text-xs text-gray-500 truncate">
                  {column.type}
                </p>
              </div>

              {/* Role badge (interactive) */}
              <button
                onClick={() => handleRoleClick(column.name, column.role)}
                className={`flex h-6 w-6 shrink-0 items-center justify-center rounded border text-xs font-bold transition-all ${config.color} cursor-pointer`}
                title={config.title}
                aria-label={`Changer le role de ${column.name}`}
              >
                {config.label}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
});

TableNode.displayName = 'TableNode';
