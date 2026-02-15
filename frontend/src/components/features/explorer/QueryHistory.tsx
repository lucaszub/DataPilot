"use client";

import React, { useState, useMemo } from 'react';
import { Search, Star, Clock, Database, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useExplorer } from './ExplorerContext';

interface HistoryEntry {
  id: string;
  timestamp: Date;
  sql: string;
  duration: number;
  rowCount: number;
  starred: boolean;
}

// Generate mock history entries
const generateMockHistory = (): HistoryEntry[] => {
  const now = new Date();
  const entries: HistoryEntry[] = [];

  const sqlSnippets = [
    'SELECT customer_name, SUM(total_amount) FROM orders GROUP BY customer_name ORDER BY SUM(total_amount) DESC LIMIT 10',
    'SELECT product_name, COUNT(*) as order_count FROM order_items JOIN products ON order_items.product_id = products.id GROUP BY product_name',
    'SELECT DATE_TRUNC(\'month\', order_date) as month, SUM(total_amount) FROM orders WHERE order_date >= \'2024-01-01\' GROUP BY month',
    'SELECT status, COUNT(*) FROM orders GROUP BY status',
    'SELECT c.customer_name, SUM(o.total_amount) as total_spent FROM customers c JOIN orders o ON c.id = o.customer_id GROUP BY c.customer_name',
    'SELECT product_category, AVG(price) as avg_price FROM products GROUP BY product_category ORDER BY avg_price DESC',
    'SELECT customer_name, email, total_spent FROM customers WHERE total_spent > 1000 ORDER BY total_spent DESC',
    'SELECT p.product_name, SUM(oi.quantity) as total_sold FROM order_items oi JOIN products p ON oi.product_id = p.id GROUP BY p.product_name',
    'SELECT order_date, COUNT(*) as order_count FROM orders WHERE status = \'completed\' GROUP BY order_date ORDER BY order_date DESC',
    'SELECT customer_name, COUNT(DISTINCT order_id) as order_count FROM orders JOIN customers ON orders.customer_id = customers.id GROUP BY customer_name',
  ];

  for (let i = 0; i < 20; i++) {
    const hoursAgo = Math.floor(Math.random() * 72);
    const timestamp = new Date(now.getTime() - hoursAgo * 60 * 60 * 1000);

    entries.push({
      id: `history-${i}`,
      timestamp,
      sql: sqlSnippets[i % sqlSnippets.length],
      duration: Math.floor(Math.random() * 450) + 50,
      rowCount: Math.floor(Math.random() * 490) + 10,
      starred: Math.random() > 0.8,
    });
  }

  return entries.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
};

export function QueryHistory() {
  const { state, dispatch } = useExplorer();
  const [searchQuery, setSearchQuery] = useState('');
  const [starredEntries, setStarredEntries] = useState<Set<string>>(
    new Set(generateMockHistory().filter(e => e.starred).map(e => e.id))
  );

  const historyEntries = useMemo(() => generateMockHistory(), []);

  const toggleStar = (id: string) => {
    setStarredEntries(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const loadQuery = (sql: string) => {
    dispatch({ type: 'SET_CUSTOM_SQL', sql });
    dispatch({ type: 'SET_SQL_MODE', mode: 'sql' });
  };

  const filteredEntries = historyEntries.filter(entry => {
    if (!searchQuery) return true;
    return entry.sql.toLowerCase().includes(searchQuery.toLowerCase());
  });

  // Group by time period
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);

  const groupedEntries = {
    today: filteredEntries.filter(e => e.timestamp >= today),
    yesterday: filteredEntries.filter(e => e.timestamp >= yesterday && e.timestamp < today),
    thisWeek: filteredEntries.filter(e => e.timestamp < yesterday),
  };

  const formatTime = (date: Date) => {
    return new Intl.DateTimeFormat('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(date);
  };

  if (!state.showHistory) return null;

  return (
    <div className="fixed right-0 top-0 bottom-0 w-96 bg-card border-l border-border shadow-xl z-50 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div className="flex items-center gap-2">
          <Clock className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold text-foreground">Historique</h2>
        </div>
        <button
          onClick={() => dispatch({ type: 'TOGGLE_HISTORY' })}
          className="p-1.5 hover:bg-muted rounded-lg transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Search */}
      <div className="p-3 border-b border-border">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Rechercher dans l'historique..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>
      </div>

      {/* Entries */}
      <div className="flex-1 overflow-y-auto">
        {/* Today */}
        {groupedEntries.today.length > 0 && (
          <div className="mb-4">
            <div className="px-4 py-2 bg-muted/30">
              <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Aujourd&apos;hui
              </h3>
            </div>
            <div className="divide-y divide-border">
              {groupedEntries.today.map(entry => (
                <div
                  key={entry.id}
                  className="px-4 py-3 hover:bg-muted/30 transition-colors group"
                >
                  <div className="flex items-start gap-2">
                    <button
                      onClick={() => toggleStar(entry.id)}
                      className="mt-0.5 text-muted-foreground hover:text-primary transition-colors"
                    >
                      <Star
                        className={cn(
                          "h-4 w-4",
                          starredEntries.has(entry.id) && "fill-primary text-primary"
                        )}
                      />
                    </button>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs text-muted-foreground">
                          {formatTime(entry.timestamp)}
                        </span>
                        <span className="px-1.5 py-0.5 text-xs bg-primary/10 text-primary rounded">
                          {entry.duration}ms
                        </span>
                        <span className="px-1.5 py-0.5 text-xs bg-muted text-muted-foreground rounded">
                          {entry.rowCount} lignes
                        </span>
                      </div>

                      <button
                        onClick={() => loadQuery(entry.sql)}
                        className="w-full text-left group-hover:text-primary transition-colors"
                      >
                        <p className="text-sm text-foreground font-mono truncate">
                          {entry.sql.substring(0, 60)}
                          {entry.sql.length > 60 ? '...' : ''}
                        </p>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Yesterday */}
        {groupedEntries.yesterday.length > 0 && (
          <div className="mb-4">
            <div className="px-4 py-2 bg-muted/30">
              <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Hier
              </h3>
            </div>
            <div className="divide-y divide-border">
              {groupedEntries.yesterday.map(entry => (
                <div
                  key={entry.id}
                  className="px-4 py-3 hover:bg-muted/30 transition-colors group"
                >
                  <div className="flex items-start gap-2">
                    <button
                      onClick={() => toggleStar(entry.id)}
                      className="mt-0.5 text-muted-foreground hover:text-primary transition-colors"
                    >
                      <Star
                        className={cn(
                          "h-4 w-4",
                          starredEntries.has(entry.id) && "fill-primary text-primary"
                        )}
                      />
                    </button>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs text-muted-foreground">
                          {formatTime(entry.timestamp)}
                        </span>
                        <span className="px-1.5 py-0.5 text-xs bg-primary/10 text-primary rounded">
                          {entry.duration}ms
                        </span>
                        <span className="px-1.5 py-0.5 text-xs bg-muted text-muted-foreground rounded">
                          {entry.rowCount} lignes
                        </span>
                      </div>

                      <button
                        onClick={() => loadQuery(entry.sql)}
                        className="w-full text-left group-hover:text-primary transition-colors"
                      >
                        <p className="text-sm text-foreground font-mono truncate">
                          {entry.sql.substring(0, 60)}
                          {entry.sql.length > 60 ? '...' : ''}
                        </p>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* This week */}
        {groupedEntries.thisWeek.length > 0 && (
          <div className="mb-4">
            <div className="px-4 py-2 bg-muted/30">
              <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Cette semaine
              </h3>
            </div>
            <div className="divide-y divide-border">
              {groupedEntries.thisWeek.map(entry => (
                <div
                  key={entry.id}
                  className="px-4 py-3 hover:bg-muted/30 transition-colors group"
                >
                  <div className="flex items-start gap-2">
                    <button
                      onClick={() => toggleStar(entry.id)}
                      className="mt-0.5 text-muted-foreground hover:text-primary transition-colors"
                    >
                      <Star
                        className={cn(
                          "h-4 w-4",
                          starredEntries.has(entry.id) && "fill-primary text-primary"
                        )}
                      />
                    </button>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs text-muted-foreground">
                          {formatDate(entry.timestamp)} {formatTime(entry.timestamp)}
                        </span>
                        <span className="px-1.5 py-0.5 text-xs bg-primary/10 text-primary rounded">
                          {entry.duration}ms
                        </span>
                        <span className="px-1.5 py-0.5 text-xs bg-muted text-muted-foreground rounded">
                          {entry.rowCount} lignes
                        </span>
                      </div>

                      <button
                        onClick={() => loadQuery(entry.sql)}
                        className="w-full text-left group-hover:text-primary transition-colors"
                      >
                        <p className="text-sm text-foreground font-mono truncate">
                          {entry.sql.substring(0, 60)}
                          {entry.sql.length > 60 ? '...' : ''}
                        </p>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty state */}
        {filteredEntries.length === 0 && (
          <div className="flex flex-col items-center justify-center h-64 text-center px-4">
            <Database className="h-12 w-12 text-muted-foreground mb-3" />
            <p className="text-sm text-muted-foreground">
              {searchQuery
                ? 'Aucune requête trouvée'
                : 'Votre historique de requêtes apparaîtra ici'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
