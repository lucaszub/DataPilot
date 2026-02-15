"use client";

import React from "react";
import { ExplorerProvider, useExplorer } from "@/components/features/explorer/ExplorerContext";
import { EnhancedFieldPicker } from "@/components/features/explorer/EnhancedFieldPicker";
import { FieldDropZones } from "@/components/features/explorer/FieldDropZones";
import { EnhancedFilterPanel } from "@/components/features/explorer/EnhancedFilterPanel";
import { EnhancedResultTable } from "@/components/features/explorer/EnhancedResultTable";
import { SpreadsheetView } from "@/components/features/explorer/SpreadsheetView";
import { ExplorerChart } from "@/components/features/explorer/ExplorerChart";
import { ExplorerToolbar } from "@/components/features/explorer/ExplorerToolbar";
import { SqlPreviewPanel } from "@/components/features/explorer/SqlPreviewPanel";
import { QueryHistory } from "@/components/features/explorer/QueryHistory";
import { AskAiPanel } from "@/components/features/explorer/AskAiPanel";

function ExplorerContent() {
  const { state } = useExplorer();

  return (
    <div className="flex h-[calc(100vh-3rem)] md:h-screen overflow-hidden">
      {/* Left sidebar — Field Picker */}
      <div className="w-72 flex-shrink-0 border-r border-border bg-card overflow-y-auto">
        <EnhancedFieldPicker />
      </div>

      {/* Main content area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Drop zones */}
        <div className="border-b border-border bg-card px-4 py-3">
          <FieldDropZones />
        </div>

        {/* Toolbar */}
        <div className="border-b border-border bg-card">
          <ExplorerToolbar />
        </div>

        {/* Filters (collapsible) */}
        {state.showFilters && (
          <div className="border-b border-border bg-card">
            <EnhancedFilterPanel />
          </div>
        )}

        {/* SQL Preview */}
        <SqlPreviewPanel />

        {/* Results area */}
        <div className="flex-1 overflow-auto bg-background">
          {!state.result && state.selectedFields.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center p-8">
              <div className="p-4 rounded-2xl bg-primary/10 mb-4">
                <svg
                  className="h-10 w-10 text-primary"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3m0 0l.5 1.5m-.5-1.5h-9.5m0 0l-.5 1.5"
                  />
                </svg>
              </div>
              <h2 className="text-lg font-semibold text-foreground">
                Selectionnez des champs
              </h2>
              <p className="text-sm text-muted-foreground mt-1 max-w-md">
                Choisissez des dimensions et mesures dans le panneau de gauche
                pour commencer votre analyse.
              </p>
            </div>
          )}

          {state.selectedFields.length > 0 && !state.result && (
            <div className="flex flex-col items-center justify-center h-full text-center p-8">
              <p className="text-sm text-muted-foreground">
                Cliquez sur <strong>Executer</strong> pour lancer la requete.
              </p>
            </div>
          )}

          {state.error && (
            <div className="p-4">
              <div className="bg-destructive/10 text-destructive rounded-lg p-4 text-sm">
                {state.error}
              </div>
            </div>
          )}

          {state.result && (
            <div className="h-full">
              {state.viewMode === "table" && <EnhancedResultTable />}
              {state.viewMode === "spreadsheet" && <SpreadsheetView />}
              {state.viewMode === "chart" && <ExplorerChart />}
            </div>
          )}
        </div>
      </div>

      {/* Right side panels */}
      {state.showHistory && (
        <div className="w-80 flex-shrink-0 border-l border-border bg-card overflow-y-auto">
          <QueryHistory />
        </div>
      )}

      {state.showAiPanel && (
        <div className="w-80 flex-shrink-0 border-l border-border bg-card overflow-y-auto">
          <AskAiPanel />
        </div>
      )}
    </div>
  );
}

export default function ExplorerPage() {
  return (
    <ExplorerProvider>
      <ExplorerContent />
    </ExplorerProvider>
  );
}
