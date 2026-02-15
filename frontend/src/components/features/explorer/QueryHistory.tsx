"use client";

import React, { useState, useEffect } from 'react';
import { Search, Clock, Database, X } from 'lucide-react';
import { useExplorer } from './ExplorerContext';
import { api, SavedQueryResponse } from '@/lib/api';
import type { ChartType } from './ExplorerContext';

export function QueryHistory() {
  const { state, dispatch, workspaceId } = useExplorer();
  const [searchQuery, setSearchQuery] = useState('');
  const [savedQueries, setSavedQueries] = useState<SavedQueryResponse[]>([]);
  const [isLoadingQueries, setIsLoadingQueries] = useState(false);

  useEffect(() => {
    if (!workspaceId || !state.showHistory) return;
    setIsLoadingQueries(true);
    api.queries.listSaved(workspaceId)
      .then(setSavedQueries)
      .catch(() => {})
      .finally(() => setIsLoadingQueries(false));
  }, [workspaceId, state.showHistory]);

  const loadQuery = (sql: string, chartType: string | null) => {
    dispatch({
      type: 'LOAD_SAVED_SQL',
      sql,
      chartType: (chartType as ChartType) || 'table'
    });
  };

  const filteredQueries = savedQueries.filter(query => {
    if (!searchQuery) return true;
    return (
      query.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      query.sql_text.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(date);
  };

  const groupedQueries = {
    today: filteredQueries.filter(q => {
      const qDate = new Date(q.created_at);
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      return qDate >= today;
    }),
    yesterday: filteredQueries.filter(q => {
      const qDate = new Date(q.created_at);
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
      return qDate >= yesterday && qDate < today;
    }),
    thisWeek: filteredQueries.filter(q => {
      const qDate = new Date(q.created_at);
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
      return qDate < yesterday;
    }),
  };

  if (!state.showHistory) return null;

  return (
    <div className="fixed right-0 top-0 bottom-0 w-96 bg-card border-l border-border shadow-xl z-50 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div className="flex items-center gap-2">
          <Clock className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold text-foreground">Requêtes sauvegardées</h2>
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
            placeholder="Rechercher dans les requêtes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>
      </div>

      {/* Entries */}
      <div className="flex-1 overflow-y-auto">
        {isLoadingQueries ? (
          <div className="flex items-center justify-center h-64 text-center px-4">
            <p className="text-sm text-muted-foreground">Chargement...</p>
          </div>
        ) : (
          <>
            {/* Today */}
            {groupedQueries.today.length > 0 && (
              <div className="mb-4">
                <div className="px-4 py-2 bg-muted/30">
                  <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Aujourd&apos;hui
                  </h3>
                </div>
                <div className="divide-y divide-border">
                  {groupedQueries.today.map(query => (
                    <button
                      key={query.id}
                      onClick={() => loadQuery(query.sql_text, query.chart_type)}
                      className="w-full px-4 py-3 hover:bg-muted/30 transition-colors text-left"
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs text-muted-foreground">
                          {formatTime(query.created_at)}
                        </span>
                        {query.chart_type && (
                          <span className="px-1.5 py-0.5 text-xs bg-primary/10 text-primary rounded">
                            {query.chart_type}
                          </span>
                        )}
                      </div>
                      <p className="text-sm font-medium text-foreground mb-1">
                        {query.name}
                      </p>
                      <p className="text-xs text-muted-foreground font-mono truncate">
                        {query.sql_text.substring(0, 60)}
                        {query.sql_text.length > 60 ? '...' : ''}
                      </p>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Yesterday */}
            {groupedQueries.yesterday.length > 0 && (
              <div className="mb-4">
                <div className="px-4 py-2 bg-muted/30">
                  <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Hier
                  </h3>
                </div>
                <div className="divide-y divide-border">
                  {groupedQueries.yesterday.map(query => (
                    <button
                      key={query.id}
                      onClick={() => loadQuery(query.sql_text, query.chart_type)}
                      className="w-full px-4 py-3 hover:bg-muted/30 transition-colors text-left"
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs text-muted-foreground">
                          {formatTime(query.created_at)}
                        </span>
                        {query.chart_type && (
                          <span className="px-1.5 py-0.5 text-xs bg-primary/10 text-primary rounded">
                            {query.chart_type}
                          </span>
                        )}
                      </div>
                      <p className="text-sm font-medium text-foreground mb-1">
                        {query.name}
                      </p>
                      <p className="text-xs text-muted-foreground font-mono truncate">
                        {query.sql_text.substring(0, 60)}
                        {query.sql_text.length > 60 ? '...' : ''}
                      </p>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* This week */}
            {groupedQueries.thisWeek.length > 0 && (
              <div className="mb-4">
                <div className="px-4 py-2 bg-muted/30">
                  <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Cette semaine
                  </h3>
                </div>
                <div className="divide-y divide-border">
                  {groupedQueries.thisWeek.map(query => (
                    <button
                      key={query.id}
                      onClick={() => loadQuery(query.sql_text, query.chart_type)}
                      className="w-full px-4 py-3 hover:bg-muted/30 transition-colors text-left"
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs text-muted-foreground">
                          {formatDate(query.created_at)} {formatTime(query.created_at)}
                        </span>
                        {query.chart_type && (
                          <span className="px-1.5 py-0.5 text-xs bg-primary/10 text-primary rounded">
                            {query.chart_type}
                          </span>
                        )}
                      </div>
                      <p className="text-sm font-medium text-foreground mb-1">
                        {query.name}
                      </p>
                      <p className="text-xs text-muted-foreground font-mono truncate">
                        {query.sql_text.substring(0, 60)}
                        {query.sql_text.length > 60 ? '...' : ''}
                      </p>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Empty state */}
            {filteredQueries.length === 0 && !isLoadingQueries && (
              <div className="flex flex-col items-center justify-center h-64 text-center px-4">
                <Database className="h-12 w-12 text-muted-foreground mb-3" />
                <p className="text-sm text-muted-foreground">
                  {searchQuery
                    ? 'Aucune requête trouvée'
                    : 'Aucune requête sauvegardée'}
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
