"use client";

import React, { useState } from 'react';
import { Sparkles, Send, X, Lightbulb, ChevronDown, ChevronRight, Copy, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useExplorer } from './ExplorerContext';

interface AiSuggestion {
  id: string;
  text: string;
  sql: string;
  explanation: string;
}

const mockSuggestions: AiSuggestion[] = [
  {
    id: 'sug-1',
    text: 'Chiffre d\'affaires par mois',
    sql: `SELECT
  DATE_TRUNC('month', order_date) as month,
  SUM(total_amount) as revenue
FROM orders
WHERE status = 'completed'
GROUP BY month
ORDER BY month DESC`,
    explanation: 'Cette requête calcule le chiffre d\'affaires total par mois en agrégeant le montant des commandes complétées, groupées par mois.',
  },
  {
    id: 'sug-2',
    text: 'Top 10 clients par CA',
    sql: `SELECT
  c.customer_name,
  SUM(o.total_amount) as total_revenue,
  COUNT(o.id) as order_count
FROM customers c
JOIN orders o ON c.id = o.customer_id
WHERE o.status = 'completed'
GROUP BY c.customer_name
ORDER BY total_revenue DESC
LIMIT 10`,
    explanation: 'Identifie les 10 meilleurs clients basés sur leur chiffre d\'affaires total, avec le nombre de commandes passées.',
  },
  {
    id: 'sug-3',
    text: 'Répartition des commandes par statut',
    sql: `SELECT
  status,
  COUNT(*) as order_count,
  ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 2) as percentage
FROM orders
GROUP BY status
ORDER BY order_count DESC`,
    explanation: 'Analyse la distribution des commandes par statut avec le pourcentage de chaque catégorie par rapport au total.',
  },
  {
    id: 'sug-4',
    text: 'Évolution du panier moyen',
    sql: `SELECT
  DATE_TRUNC('month', order_date) as month,
  AVG(total_amount) as avg_basket,
  COUNT(*) as order_count
FROM orders
WHERE status = 'completed'
  AND order_date >= DATE_SUB(CURRENT_DATE, INTERVAL 12 MONTH)
GROUP BY month
ORDER BY month ASC`,
    explanation: 'Suit l\'évolution du panier moyen (montant moyen par commande) sur les 12 derniers mois pour identifier les tendances.',
  },
];

export function AskAiPanel() {
  const { state, dispatch } = useExplorer();
  const [inputValue, setInputValue] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedSql, setGeneratedSql] = useState<string | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [currentExplanation, setCurrentExplanation] = useState<string>('');
  const [copiedSql, setCopiedSql] = useState(false);

  const handleSuggestionClick = (suggestion: AiSuggestion) => {
    setIsGenerating(true);
    setGeneratedSql(null);
    setShowExplanation(false);

    // Simulate AI generation with delay
    setTimeout(() => {
      setGeneratedSql(suggestion.sql);
      setCurrentExplanation(suggestion.explanation);
      setIsGenerating(false);
    }, 1500);
  };

  const handleCustomQuery = () => {
    if (!inputValue.trim()) return;

    setIsGenerating(true);
    setGeneratedSql(null);
    setShowExplanation(false);

    // Simulate AI generation with custom query
    setTimeout(() => {
      const customSql = `SELECT
  -- Requête générée pour: "${inputValue}"
  customer_name,
  COUNT(*) as count
FROM orders
GROUP BY customer_name
ORDER BY count DESC
LIMIT 10`;
      setGeneratedSql(customSql);
      setCurrentExplanation(`Cette requête a été générée en réponse à votre demande: "${inputValue}". Elle groupe les données par client et compte le nombre d'occurrences.`);
      setIsGenerating(false);
    }, 1500);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleCustomQuery();
    }
  };

  const insertIntoEditor = () => {
    if (generatedSql) {
      dispatch({ type: 'SET_CUSTOM_SQL', sql: generatedSql });
      dispatch({ type: 'SET_SQL_MODE', mode: 'sql' });
    }
  };

  const copySql = async () => {
    if (generatedSql) {
      await navigator.clipboard.writeText(generatedSql);
      setCopiedSql(true);
      setTimeout(() => setCopiedSql(false), 2000);
    }
  };

  if (!state.showAiPanel) return null;

  return (
    <div className="fixed right-0 top-0 bottom-0 w-96 bg-card border-l border-border shadow-xl z-50 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold text-foreground">Assistant IA</h2>
        </div>
        <button
          onClick={() => dispatch({ type: 'TOGGLE_AI_PANEL' })}
          className="p-1.5 hover:bg-muted rounded-lg transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Input */}
      <div className="p-4 border-b border-border">
        <div className="relative">
          <textarea
            placeholder="Décrivez ce que vous voulez analyser..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            className="w-full px-3 py-2 pr-10 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
            rows={3}
          />
          <button
            onClick={handleCustomQuery}
            disabled={!inputValue.trim() || isGenerating}
            className={cn(
              "absolute bottom-2 right-2 p-1.5 rounded-lg transition-colors",
              inputValue.trim() && !isGenerating
                ? "bg-primary text-white hover:bg-primary/90"
                : "bg-muted text-muted-foreground cursor-not-allowed"
            )}
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Suggestions */}
      <div className="flex-1 overflow-y-auto">
        {!generatedSql && !isGenerating && (
          <div className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <Lightbulb className="h-4 w-4 text-primary" />
              <h3 className="text-sm font-medium text-foreground">Suggestions</h3>
            </div>

            <div className="space-y-2">
              {mockSuggestions.map(suggestion => (
                <button
                  key={suggestion.id}
                  onClick={() => handleSuggestionClick(suggestion)}
                  className="w-full px-3 py-2.5 text-left text-sm bg-muted hover:bg-muted/80 text-foreground rounded-lg transition-colors"
                >
                  {suggestion.text}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Generating state */}
        {isGenerating && (
          <div className="flex flex-col items-center justify-center h-64">
            <div className="relative">
              <div className="h-16 w-16 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
              <Sparkles className="h-6 w-6 text-primary absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
            </div>
            <p className="mt-4 text-sm text-muted-foreground">
              Génération de la requête
              <span className="inline-block animate-pulse">.</span>
              <span className="inline-block animate-pulse animation-delay-200">.</span>
              <span className="inline-block animate-pulse animation-delay-400">.</span>
            </p>
          </div>
        )}

        {/* Generated SQL */}
        {generatedSql && !isGenerating && (
          <div className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-foreground">Requête générée</h3>
              <button
                onClick={copySql}
                className="flex items-center gap-1 px-2 py-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                {copiedSql ? (
                  <>
                    <Check className="h-3.5 w-3.5" />
                    <span>Copié</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5" />
                    <span>Copier</span>
                  </>
                )}
              </button>
            </div>

            {/* SQL code block */}
            <div className="bg-muted/50 border border-border rounded-lg p-3 font-mono text-xs text-foreground overflow-x-auto">
              <pre className="whitespace-pre-wrap">{generatedSql}</pre>
            </div>

            {/* Actions */}
            <div className="space-y-2">
              <button
                onClick={insertIntoEditor}
                className="w-full px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors font-medium"
              >
                Insérer dans l&apos;éditeur
              </button>

              {/* Explanation toggle */}
              <button
                onClick={() => setShowExplanation(!showExplanation)}
                className="w-full flex items-center justify-between px-4 py-2 bg-muted hover:bg-muted/80 text-foreground rounded-lg transition-colors"
              >
                <span className="text-sm font-medium">Explication</span>
                {showExplanation ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </button>

              {/* Explanation content */}
              {showExplanation && (
                <div className="px-4 py-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                  <p className="text-sm text-foreground leading-relaxed">
                    {currentExplanation}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Footer tip */}
      <div className="px-4 py-3 border-t border-border bg-muted/30">
        <div className="flex items-start gap-2">
          <Sparkles className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
          <p className="text-xs text-muted-foreground">
            <strong className="text-foreground">Astuce:</strong> Soyez précis dans vos demandes pour obtenir de meilleures requêtes SQL.
          </p>
        </div>
      </div>
    </div>
  );
}
