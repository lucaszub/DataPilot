"use client";

import React, { useState, useRef, useEffect } from "react";
import { Send, Sparkles, Bot, User, Copy, Check, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  sql?: string;
  timestamp: Date;
}

const SUGGESTIONS = [
  "Quel est le chiffre d'affaires total par mois ?",
  "Quels sont les 10 meilleurs clients ?",
  "Quelle est la repartition des commandes par statut ?",
  "Quel produit a la meilleure marge ?",
  "Combien de commandes ce trimestre ?",
  "Quel est le panier moyen par segment client ?",
];

const MOCK_RESPONSES: Record<string, { text: string; sql: string }> = {
  default: {
    text: "Voici la requete SQL correspondante. Elle selectionne les donnees demandees a partir de vos tables commandes et clients.",
    sql: `SELECT
  DATE_TRUNC('month', o.order_date) AS mois,
  COUNT(*) AS nb_commandes,
  SUM(o.total_amount) AS ca_total,
  AVG(o.total_amount) AS panier_moyen
FROM orders o
JOIN customers c ON o.customer_id = c.id
GROUP BY DATE_TRUNC('month', o.order_date)
ORDER BY mois DESC
LIMIT 12;`,
  },
  clients: {
    text: "Voici les 10 clients avec le plus gros chiffre d'affaires, avec le nombre de commandes et le montant moyen.",
    sql: `SELECT
  c.name AS client,
  c.company AS entreprise,
  c.segment,
  COUNT(o.id) AS nb_commandes,
  SUM(o.total_amount) AS ca_total,
  AVG(o.total_amount) AS panier_moyen
FROM customers c
JOIN orders o ON c.id = o.customer_id
GROUP BY c.id, c.name, c.company, c.segment
ORDER BY ca_total DESC
LIMIT 10;`,
  },
  statut: {
    text: "Voici la repartition des commandes par statut avec les montants associes.",
    sql: `SELECT
  status AS statut,
  COUNT(*) AS nb_commandes,
  SUM(total_amount) AS montant_total,
  ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER(), 1) AS pourcentage
FROM orders
GROUP BY status
ORDER BY nb_commandes DESC;`,
  },
  marge: {
    text: "Voici l'analyse des marges par produit, triee par marge la plus elevee.",
    sql: `SELECT
  p.name AS produit,
  p.category AS categorie,
  p.unit_price AS prix_vente,
  p.cost_price AS prix_revient,
  (p.unit_price - p.cost_price) AS marge_unitaire,
  ROUND((p.unit_price - p.cost_price) / p.unit_price * 100, 1) AS marge_pct
FROM products p
WHERE p.unit_price > 0
ORDER BY marge_pct DESC
LIMIT 15;`,
  },
};

function getMockResponse(query: string): { text: string; sql: string } {
  const lower = query.toLowerCase();
  if (lower.includes("client") || lower.includes("meilleur")) return MOCK_RESPONSES.clients;
  if (lower.includes("statut") || lower.includes("repartition")) return MOCK_RESPONSES.statut;
  if (lower.includes("marge") || lower.includes("produit")) return MOCK_RESPONSES.marge;
  return MOCK_RESPONSES.default;
}

export default function ChatPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  function handleSend(text?: string) {
    const query = text || input.trim();
    if (!query || isTyping) return;

    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      role: "user",
      content: query,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsTyping(true);

    // Simulate AI response delay
    setTimeout(() => {
      const response = getMockResponse(query);
      const assistantMsg: ChatMessage = {
        id: `msg-${Date.now()}-ai`,
        role: "assistant",
        content: response.text,
        sql: response.sql,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, assistantMsg]);
      setIsTyping(false);
    }, 1200 + Math.random() * 800);
  }

  function handleCopy(sql: string, msgId: string) {
    navigator.clipboard.writeText(sql);
    setCopiedId(msgId);
    setTimeout(() => setCopiedId(null), 2000);
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
                  : "bg-muted text-muted-foreground"
              )}
            >
              {msg.role === "user" ? (
                <User className="h-4 w-4" />
              ) : (
                <Bot className="h-4 w-4" />
              )}
            </div>
            <div
              className={cn(
                "rounded-xl px-4 py-3 max-w-[85%]",
                msg.role === "user"
                  ? "bg-primary text-primary-foreground"
                  : "bg-card border border-border"
              )}
            >
              <p className="text-sm">{msg.content}</p>
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
