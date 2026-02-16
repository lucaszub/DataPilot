"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  Send,
  Sparkles,
  Bot,
  User,
  Copy,
  Check,
  BarChart3,
  AlertCircle,
  LayoutDashboard,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api";
import { getAccessToken } from "@/lib/auth";

// --- AI types (defined locally until api.ts exposes them) ---

interface AIQueryRequest {
  question: string;
  workspace_id: string;
}

interface AIQueryResponse {
  sql: string;
  explanation: string;
  results: {
    columns: Array<{ name: string; type: string }>;
    rows: Record<string, unknown>[];
    row_count: number;
    execution_time_ms: number;
  };
  suggested_chart: string | null;
}

// --- Chat types ---

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  sql?: string;
  results?: {
    columns: Array<{ name: string; type: string }>;
    rows: Record<string, unknown>[];
    row_count: number;
    execution_time_ms: number;
  };
  suggestedChart?: string;
  error?: boolean;
  timestamp: Date;
}

// --- Suggestions de demarrage ---

const SUGGESTIONS = [
  "Quel est le chiffre d'affaires total par mois ?",
  "Quels sont les 10 meilleurs clients ?",
  "Quelle est la repartition des commandes par statut ?",
  "Quel produit a la meilleure marge ?",
  "Combien de commandes ce trimestre ?",
  "Quel est le panier moyen par segment client ?",
];

// --- Chart type labels ---

const CHART_LABELS: Record<string, string> = {
  bar: "Barres",
  line: "Ligne",
  pie: "Camembert",
  kpi: "KPI",
  table: "Tableau",
};

// --- API call helper (uses auth token, not in api.ts yet) ---

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

async function queryAI(payload: AIQueryRequest): Promise<AIQueryResponse> {
  const token = getAccessToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}/api/v1/ai/query`, {
    method: "POST",
    headers,
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    if (response.status === 503) {
      throw new Error(
        "Le service IA n'est pas disponible pour le moment. Verifiez que la cle API Anthropic est configuree."
      );
    }
    let errorMessage = `Erreur ${response.status}`;
    try {
      const errorData = (await response.json()) as { detail?: string };
      if (errorData.detail) {
        errorMessage =
          typeof errorData.detail === "string"
            ? errorData.detail
            : JSON.stringify(errorData.detail);
      }
    } catch {
      // ignore JSON parse errors
    }
    throw new Error(errorMessage);
  }

  return response.json() as Promise<AIQueryResponse>;
}

export default function ChatPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [workspaceId, setWorkspaceId] = useState<string | null>(null);
  const [workspaceError, setWorkspaceError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Load first workspace on mount
  useEffect(() => {
    async function loadWorkspace() {
      try {
        const workspaces = await api.workspaces.list();
        if (workspaces.length > 0) {
          setWorkspaceId(workspaces[0].id);
        } else {
          setWorkspaceError(
            "Aucun workspace trouve. Creez un workspace pour utiliser le chat IA."
          );
        }
      } catch {
        setWorkspaceError(
          "Impossible de charger les workspaces. Verifiez votre connexion."
        );
      }
    }
    loadWorkspace();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = useCallback(
    async function handleSend(text?: string) {
      const query = text || input.trim();
      if (!query || isTyping) return;

      if (!workspaceId) {
        const errorMsg: ChatMessage = {
          id: `msg-${Date.now()}-err`,
          role: "assistant",
          content:
            workspaceError ||
            "Aucun workspace disponible. Creez un workspace pour continuer.",
          error: true,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, errorMsg]);
        return;
      }

      const userMsg: ChatMessage = {
        id: `msg-${Date.now()}`,
        role: "user",
        content: query,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, userMsg]);
      setInput("");
      setIsTyping(true);

      try {
        const response = await queryAI({
          question: query,
          workspace_id: workspaceId,
        });

        const assistantMsg: ChatMessage = {
          id: `msg-${Date.now()}-ai`,
          role: "assistant",
          content: response.explanation,
          sql: response.sql,
          results: response.results,
          suggestedChart: response.suggested_chart ?? undefined,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, assistantMsg]);
      } catch (err) {
        const errorMessage =
          err instanceof Error
            ? err.message
            : "Une erreur inattendue est survenue.";

        const errorMsg: ChatMessage = {
          id: `msg-${Date.now()}-err`,
          role: "assistant",
          content: errorMessage,
          error: true,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, errorMsg]);
      } finally {
        setIsTyping(false);
      }
    },
    [input, isTyping, workspaceId, workspaceError]
  );

  function handleCopy(sql: string, msgId: string) {
    navigator.clipboard.writeText(sql);
    setCopiedId(msgId);
    setTimeout(() => setCopiedId(null), 2000);
  }

  function handleCopyToDashboard(sql: string, msgId: string) {
    navigator.clipboard.writeText(sql);
    setCopiedId(`dash-${msgId}`);
    setTimeout(() => setCopiedId(null), 2500);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  return (
    <div className="flex flex-col h-[calc(100vh-3rem)] md:h-screen">
      {/* Header */}
      <div className="border-b border-border bg-card px-6 py-4">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-primary/10">
            <Sparkles className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-foreground">Chat IA</h1>
            <p className="text-xs text-muted-foreground">
              Posez une question sur vos donnees en langage naturel
            </p>
          </div>
        </div>
      </div>

      {/* Workspace error banner */}
      {workspaceError && (
        <div className="px-6 py-3 bg-destructive/10 border-b border-destructive/20 flex items-center gap-2 text-sm text-destructive">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          {workspaceError}
        </div>
      )}

      {/* Messages Area */}
      <div className="flex-1 overflow-auto px-6 py-4 space-y-4">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full space-y-6 text-center">
            <div className="p-4 rounded-2xl bg-primary/10">
              <BarChart3 className="h-10 w-10 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-foreground">
                Interrogez vos donnees
              </h2>
              <p className="text-muted-foreground mt-1 max-w-md">
                Decrivez ce que vous souhaitez analyser et je genererai la
                requete SQL correspondante.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-w-2xl w-full">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => handleSend(s)}
                  className="text-left px-4 py-3 rounded-xl border border-border bg-card hover:border-primary hover:bg-primary/5 transition-colors text-sm text-foreground"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg) => (
          <div
            key={msg.id}
            className={cn(
              "flex gap-3 max-w-3xl",
              msg.role === "user" ? "ml-auto flex-row-reverse" : ""
            )}
          >
            <div
              className={cn(
                "flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center",
                msg.role === "user"
                  ? "bg-primary text-primary-foreground"
                  : msg.error
                    ? "bg-destructive/10 text-destructive"
                    : "bg-muted text-muted-foreground"
              )}
            >
              {msg.role === "user" ? (
                <User className="h-4 w-4" />
              ) : msg.error ? (
                <AlertCircle className="h-4 w-4" />
              ) : (
                <Bot className="h-4 w-4" />
              )}
            </div>
            <div
              className={cn(
                "rounded-xl px-4 py-3 max-w-[85%]",
                msg.role === "user"
                  ? "bg-primary text-primary-foreground"
                  : msg.error
                    ? "bg-destructive/10 border border-destructive/20"
                    : "bg-card border border-border"
              )}
            >
              <p className={cn("text-sm", msg.error && "text-destructive")}>
                {msg.content}
              </p>

              {/* SQL block */}
              {msg.sql && (
                <div className="mt-3 rounded-lg bg-gray-950 dark:bg-gray-900 p-3 relative group">
                  <button
                    onClick={() => handleCopy(msg.sql!, msg.id)}
                    className="absolute top-2 right-2 p-1.5 rounded-md bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white transition-colors opacity-0 group-hover:opacity-100"
                  >
                    {copiedId === msg.id ? (
                      <Check className="h-3.5 w-3.5" />
                    ) : (
                      <Copy className="h-3.5 w-3.5" />
                    )}
                  </button>
                  <pre className="text-xs text-gray-300 overflow-x-auto whitespace-pre font-mono">
                    {msg.sql}
                  </pre>
                </div>
              )}

              {/* Results table */}
              {msg.results && msg.results.rows.length > 0 && (
                <div className="mt-3 rounded-lg border overflow-hidden">
                  <table className="w-full text-xs">
                    <thead className="bg-muted">
                      <tr>
                        {msg.results.columns.map((col) => (
                          <th
                            key={col.name}
                            className="px-3 py-2 text-left font-medium"
                          >
                            {col.name}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {msg.results.rows.slice(0, 5).map((row, i) => (
                        <tr key={i} className="border-t">
                          {msg.results!.columns.map((col) => (
                            <td key={col.name} className="px-3 py-1.5">
                              {String(row[col.name] ?? "")}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {msg.results.row_count > 5 && (
                    <div className="px-3 py-2 text-xs text-muted-foreground bg-muted/50">
                      + {msg.results.row_count - 5} lignes supplementaires
                    </div>
                  )}
                  <div className="px-3 py-1.5 text-xs text-muted-foreground bg-muted/30 border-t">
                    {msg.results.row_count} resultats en{" "}
                    {msg.results.execution_time_ms}ms
                  </div>
                </div>
              )}

              {/* Suggested chart badge + Add to dashboard button */}
              {(msg.suggestedChart || (msg.results && msg.sql)) && (
                <div className="mt-3 flex items-center gap-2 flex-wrap">
                  {msg.suggestedChart && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary">
                      <BarChart3 className="h-3 w-3" />
                      {CHART_LABELS[msg.suggestedChart] ||
                        msg.suggestedChart}
                    </span>
                  )}
                  {msg.sql && msg.results && (
                    <button
                      onClick={() =>
                        handleCopyToDashboard(msg.sql!, msg.id)
                      }
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {copiedId === `dash-${msg.id}` ? (
                        <>
                          <Check className="h-3 w-3" />
                          SQL copie — creez un widget dans le dashboard
                        </>
                      ) : (
                        <>
                          <LayoutDashboard className="h-3 w-3" />
                          Ajouter au dashboard
                        </>
                      )}
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}

        {isTyping && (
          <div className="flex gap-3 max-w-3xl">
            <div className="flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center bg-muted text-muted-foreground">
              <Bot className="h-4 w-4" />
            </div>
            <div className="rounded-xl px-4 py-3 bg-card border border-border">
              <div className="flex items-center gap-1">
                <div className="h-2 w-2 rounded-full bg-primary animate-bounce" />
                <div className="h-2 w-2 rounded-full bg-primary animate-bounce [animation-delay:150ms]" />
                <div className="h-2 w-2 rounded-full bg-primary animate-bounce [animation-delay:300ms]" />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="border-t border-border bg-card px-6 py-4">
        <div className="max-w-3xl mx-auto flex gap-2">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Posez une question sur vos donnees..."
            rows={1}
            className="flex-1 resize-none rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          />
          <Button
            onClick={() => handleSend()}
            disabled={!input.trim() || isTyping}
            className="rounded-xl px-4"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
