"use client";

import { memo } from 'react';
import { EdgeProps, getSmoothStepPath, EdgeLabelRenderer, BaseEdge } from '@xyflow/react';

export interface JoinEdgeData extends Record<string, unknown> {
  joinType: 'LEFT' | 'INNER' | 'RIGHT' | 'FULL';
  sourceColumn?: string;
  targetColumn?: string;
  onEdit?: () => void;
}

const JOIN_COLORS = {
  LEFT: { bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-300', edge: '#3b82f6' },
  INNER: { bg: 'bg-green-100', text: 'text-green-700', border: 'border-green-300', edge: '#22c55e' },
  RIGHT: { bg: 'bg-orange-100', text: 'text-orange-700', border: 'border-orange-300', edge: '#f97316' },
  FULL: { bg: 'bg-purple-100', text: 'text-purple-700', border: 'border-purple-300', edge: '#a855f7' },
};

export const JoinEdge = memo(({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
  selected,
}: EdgeProps) => {
  const edgeData = data as JoinEdgeData | undefined;
  const joinType = edgeData?.joinType || 'LEFT';
  const colors = JOIN_COLORS[joinType];

  const [edgePath, labelX, labelY] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        style={{
          stroke: colors.edge,
          strokeWidth: selected ? 3 : 2,
        }}
      />
      <EdgeLabelRenderer>
        <button
          onClick={edgeData?.onEdit}
          className={`absolute px-2.5 py-1 text-xs font-semibold rounded-full border ${colors.bg} ${colors.text} ${colors.border} shadow-sm hover:shadow-md transition-all cursor-pointer nodrag nopan`}
          style={{
            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
            pointerEvents: 'all',
          }}
          title={`${joinType} JOIN - Cliquer pour modifier`}
        >
          {joinType}
        </button>
      </EdgeLabelRenderer>
    </>
  );
});

JoinEdge.displayName = 'JoinEdge';
