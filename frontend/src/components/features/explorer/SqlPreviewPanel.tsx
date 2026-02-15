"use client";

import React, { useState, useEffect } from 'react';
import { Copy, Check, ChevronDown, ChevronUp, Pencil, Eye, Terminal } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useExplorer } from './ExplorerContext';

// Simple SQL keyword highlighter
function highlightSql(sql: string): React.ReactNode[] {
  const keywords = /\b(SELECT|FROM|WHERE|JOIN|LEFT|RIGHT|INNER|OUTER|ON|GROUP BY|ORDER BY|LIMIT|AS|AND|OR|NOT|IN|BETWEEN|LIKE|IS|NULL|SUM|COUNT|AVG|MIN|MAX|COUNT_DISTINCT|DATE_TRUNC|OVER|PARTITION BY|ROWS|UNBOUNDED|PRECEDING|CURRENT|ROW|LAG|RANK|NULLIF|ROUND|DESC|ASC|HAVING|DISTINCT)\b/gi;
  const strings = /'[^']*'/g;
  const numbers = /\b\d+\.?\d*\b/g;
  const comments = /--.*$/gm;

  // Split by lines first
  return sql.split('\n').map((line, lineIdx) => {
    const parts: React.ReactNode[] = [];
    let lastIndex = 0;
    const lineKey = `line-${lineIdx}`;

    // Match keywords, strings, numbers, comments in order
    const allPatterns = [
      { pattern: comments, className: 'text-gray-400 italic' },
      { pattern: strings, className: 'text-amber-600' },
      { pattern: keywords, className: 'text-blue-600 font-semibold' },
      { pattern: numbers, className: 'text-emerald-600' },
    ];

    // Collect all matches with positions
    interface MatchEntry {
      start: number;
      end: number;
      text: string;
      className: string;
    }
    const matches: MatchEntry[] = [];

    for (const { pattern, className } of allPatterns) {
      const regex = new RegExp(pattern.source, pattern.flags);
      let match;
      while ((match = regex.exec(line)) !== null) {
        const overlaps = matches.some(
          m => (match!.index >= m.start && match!.index < m.end) ||
               (match!.index + match![0].length > m.start && match!.index + match![0].length <= m.end)
        );
        if (!overlaps) {
          matches.push({
            start: match.index,
            end: match.index + match[0].length,
            text: match[0],
            className,
          });
        }
      }
    }

    matches.sort((a, b) => a.start - b.start);

    for (const m of matches) {
      if (m.start > lastIndex) {
        parts.push(<span key={`${lineKey}-${lastIndex}`}>{line.slice(lastIndex, m.start)}</span>);
      }
      parts.push(
        <span key={`${lineKey}-${m.start}`} className={m.className}>
          {m.text}
        </span>
      );
      lastIndex = m.end;
    }

    if (lastIndex < line.length) {
      parts.push(<span key={`${lineKey}-${lastIndex}`}>{line.slice(lastIndex)}</span>);
    }

    return (
      <React.Fragment key={lineKey}>
        {parts}
        {lineIdx < sql.split('\n').length - 1 && '\n'}
      </React.Fragment>
    );
  });
}

export function SqlPreviewPanel() {
  const { state, dispatch } = useExplorer();
  const [isEditing, setIsEditing] = useState(false);
  const [editedSql, setEditedSql] = useState('');
  const [copied, setCopied] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  const sql = state.generatedSql;
  const lineCount = sql.split('\n').length;

  useEffect(() => {
    if (!isEditing) {
      setEditedSql(sql);
    }
  }, [sql, isEditing]);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(isEditing ? editedSql : sql);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleEdit = () => {
    setEditedSql(sql);
    setIsEditing(true);
  };

  const handleApplyEdit = () => {
    dispatch({ type: 'SET_CUSTOM_SQL', sql: editedSql });
    dispatch({ type: 'SET_SQL_MODE', mode: 'sql' });
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setEditedSql(sql);
    setIsEditing(false);
  };

  if (!state.showSqlPreview) return null;

  return (
    <div className="border-b border-border bg-gray-50">
      {/* Header bar */}
      <div className="flex items-center justify-between px-4 py-2 bg-gray-100/80 border-b border-border">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="flex items-center gap-2 text-sm font-medium text-foreground hover:text-primary transition-colors"
        >
          <Terminal className="h-3.5 w-3.5 text-blue-600" />
          <span>SQL généré</span>
          <span className="text-xs text-muted-foreground">({lineCount} lignes)</span>
          {collapsed ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronUp className="h-3.5 w-3.5" />}
        </button>

        <div className="flex items-center gap-1">
          {/* Edit toggle */}
          {!isEditing ? (
            <button
              onClick={handleEdit}
              className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted rounded transition-colors"
              title="Modifier le SQL"
            >
              <Pencil className="h-3 w-3" />
              Modifier
            </button>
          ) : (
            <>
              <button
                onClick={handleApplyEdit}
                className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-white bg-primary hover:bg-primary/90 rounded transition-colors"
              >
                Appliquer
              </button>
              <button
                onClick={handleCancelEdit}
                className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted rounded transition-colors"
              >
                Annuler
              </button>
            </>
          )}

          {/* Copy */}
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted rounded transition-colors"
          >
            {copied ? (
              <>
                <Check className="h-3 w-3 text-green-600" />
                <span className="text-green-600">Copié</span>
              </>
            ) : (
              <>
                <Copy className="h-3 w-3" />
                Copier
              </>
            )}
          </button>
        </div>
      </div>

      {/* SQL content */}
      {!collapsed && (
        <div className="relative max-h-64 overflow-auto">
          {isEditing ? (
            <textarea
              value={editedSql}
              onChange={(e) => setEditedSql(e.target.value)}
              className="w-full min-h-[120px] p-4 text-sm font-mono bg-white text-foreground border-none outline-none resize-y"
              spellCheck={false}
            />
          ) : (
            <div className="p-4 flex">
              {/* Line numbers */}
              <div className="select-none pr-4 text-right border-r border-border mr-4">
                {sql.split('\n').map((_, i) => (
                  <div key={i} className="text-xs text-gray-400 leading-5 font-mono">
                    {i + 1}
                  </div>
                ))}
              </div>
              {/* SQL with highlighting */}
              <pre className="flex-1 text-sm font-mono leading-5 whitespace-pre-wrap break-words text-gray-800">
                {highlightSql(sql)}
              </pre>
            </div>
          )}
        </div>
      )}

      {/* Stats bar */}
      {state.result && !collapsed && (
        <div className="flex items-center gap-4 px-4 py-1.5 bg-gray-100/50 border-t border-border text-xs text-muted-foreground">
          <span>{state.result.row_count} lignes retournées</span>
          <span>|</span>
          <span>{state.result.execution_time_ms}ms</span>
          <span>|</span>
          <span>{state.result.columns.length} colonnes</span>
        </div>
      )}
    </div>
  );
}
