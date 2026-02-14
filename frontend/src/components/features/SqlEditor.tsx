"use client";

import React, { useCallback, useEffect, useRef } from "react";
import { EditorView, keymap, placeholder as placeholderExt } from "@codemirror/view";
import { EditorState } from "@codemirror/state";
import { sql } from "@codemirror/lang-sql";
import { defaultKeymap, history, historyKeymap } from "@codemirror/commands";
import {
  autocompletion,
  completionKeymap,
  type CompletionContext,
  type CompletionResult,
} from "@codemirror/autocomplete";
import { syntaxHighlighting, defaultHighlightStyle } from "@codemirror/language";

interface SqlEditorProps {
  value: string;
  onChange: (value: string) => void;
  onExecute: () => void;
  tables?: Record<string, string[]>;
  readOnly?: boolean;
  placeholder?: string;
}

const lightTheme = EditorView.theme({
  "&": {
    backgroundColor: "white",
    fontSize: "14px",
    fontFamily: "ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Consolas, monospace",
    height: "100%",
    flex: "1",
  },
  ".cm-scroller": {
    overflow: "auto",
  },
  ".cm-content": {
    caretColor: "#4f46e5",
    padding: "12px 16px",
    minHeight: "120px",
  },
  ".cm-focused": {
    outline: "none",
  },
  ".cm-gutters": {
    backgroundColor: "#f9fafb",
    color: "#9ca3af",
    borderRight: "1px solid #e5e7eb",
  },
  ".cm-activeLine": {
    backgroundColor: "#eef2ff",
  },
  ".cm-selectionMatch": {
    backgroundColor: "#c7d2fe",
  },
  "&.cm-focused .cm-cursor": {
    borderLeftColor: "#4f46e5",
  },
  ".cm-tooltip-autocomplete": {
    backgroundColor: "white",
    border: "1px solid #e5e7eb",
    borderRadius: "8px",
    boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
  },
});

function buildCompletions(tables: Record<string, string[]>) {
  return function completionSource(context: CompletionContext): CompletionResult | null {
    const word = context.matchBefore(/\w*/);
    if (!word || (word.from === word.to && !context.explicit)) return null;

    const options: Array<{ label: string; type: string; detail?: string }> = [];

    for (const [tableName, cols] of Object.entries(tables)) {
      options.push({ label: tableName, type: "class", detail: "table" });
      for (const col of cols) {
        options.push({ label: col, type: "property", detail: tableName });
      }
    }

    // SQL keywords
    const keywords = [
      "SELECT", "FROM", "WHERE", "JOIN", "LEFT", "RIGHT", "INNER", "OUTER",
      "ON", "AND", "OR", "NOT", "IN", "LIKE", "IS", "NULL", "AS", "ORDER",
      "BY", "GROUP", "HAVING", "LIMIT", "OFFSET", "DISTINCT", "COUNT",
      "SUM", "AVG", "MIN", "MAX", "UNION", "INSERT", "UPDATE", "DELETE",
      "CREATE", "DROP", "ALTER", "TABLE", "INDEX", "VIEW", "CASE", "WHEN",
      "THEN", "ELSE", "END", "BETWEEN", "EXISTS", "ASC", "DESC",
    ];
    for (const kw of keywords) {
      options.push({ label: kw, type: "keyword" });
    }

    return {
      from: word.from,
      options,
      validFor: /^\w*$/,
    };
  };
}

export function SqlEditor({
  value,
  onChange,
  onExecute,
  tables = {},
  readOnly = false,
  placeholder = "SELECT * FROM ...",
}: SqlEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);
  const onChangeRef = useRef(onChange);
  const onExecuteRef = useRef(onExecute);

  onChangeRef.current = onChange;
  onExecuteRef.current = onExecute;

  const executeKeymap = useCallback(() => {
    return keymap.of([
      {
        key: "Ctrl-Enter",
        mac: "Cmd-Enter",
        run: () => {
          onExecuteRef.current();
          return true;
        },
      },
    ]);
  }, []);

  useEffect(() => {
    if (!editorRef.current) return;

    const state = EditorState.create({
      doc: value,
      extensions: [
        lightTheme,
        sql(),
        history(),
        syntaxHighlighting(defaultHighlightStyle),
        autocompletion({
          override: [buildCompletions(tables)],
        }),
        placeholderExt(placeholder),
        keymap.of([...defaultKeymap, ...historyKeymap, ...completionKeymap]),
        executeKeymap(),
        EditorView.updateListener.of((update) => {
          if (update.docChanged) {
            onChangeRef.current(update.state.doc.toString());
          }
        }),
        EditorState.readOnly.of(readOnly),
        EditorView.lineWrapping,
      ],
    });

    const view = new EditorView({
      state,
      parent: editorRef.current,
    });

    viewRef.current = view;

    return () => {
      view.destroy();
    };
    // Only re-create the editor when tables or readOnly change
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tables, readOnly, placeholder, executeKeymap]);

  // Sync external value changes (e.g., loading a saved query)
  useEffect(() => {
    const view = viewRef.current;
    if (!view) return;
    const currentValue = view.state.doc.toString();
    if (currentValue !== value) {
      view.dispatch({
        changes: { from: 0, to: currentValue.length, insert: value },
      });
    }
  }, [value]);

  return (
    <div
      ref={editorRef}
      className="overflow-hidden rounded-lg border border-gray-200 bg-white focus-within:ring-2 focus-within:ring-teal-500 focus-within:border-teal-500 transition-shadow h-full"
      aria-label="SQL editor"
    />
  );
}
