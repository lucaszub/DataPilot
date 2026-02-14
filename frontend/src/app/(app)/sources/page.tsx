"use client";

import React, { useState } from "react";
import { Plus, Database } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useDataSources } from "@/hooks/useDataSources";
import { DataSourceCard } from "@/components/features/DataSourceCard";
import { UploadCsvModal } from "@/components/features/UploadCsvModal";

export default function SourcesPage() {
  const { sources, isLoading, mutate } = useDataSources();
  const [showUploadModal, setShowUploadModal] = useState(false);

  function handleUploadSuccess() {
    mutate();
  }

  return (
    <div className="mx-auto max-w-6xl px-6 py-8">
      {/* Page header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Sources de donnees
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Importez et gerez vos fichiers CSV
          </p>
        </div>
        <Button
          onClick={() => setShowUploadModal(true)}
          aria-label="Ajouter une nouvelle source de donnees"
        >
          <Plus className="mr-2 h-4 w-4" aria-hidden="true" />
          Nouvelle source
        </Button>
      </div>

      {/* Content */}
      {isLoading ? (
        /* Loading skeletons */
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((n) => (
            <div
              key={n}
              className="h-44 rounded-xl border border-gray-200 bg-white animate-pulse"
              aria-hidden="true"
            />
          ))}
        </div>
      ) : sources.length === 0 ? (
        /* Empty state */
        <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-200 bg-white py-20 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-indigo-50">
            <Database
              className="h-8 w-8 text-indigo-400"
              aria-hidden="true"
            />
          </div>
          <h2 className="mb-2 text-lg font-semibold text-gray-900">
            Aucune source de donnees
          </h2>
          <p className="mb-6 max-w-sm text-sm text-gray-500">
            Importez votre premier fichier CSV pour commencer a explorer vos
            donnees.
          </p>
          <Button
            onClick={() => setShowUploadModal(true)}
            aria-label="Importer un premier fichier CSV"
          >
            <Plus className="mr-2 h-4 w-4" aria-hidden="true" />
            Importer un CSV
          </Button>
        </div>
      ) : (
        /* Sources grid */
        <div
          className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
          role="list"
          aria-label="Liste des sources de donnees"
        >
          {sources.map((source) => (
            <div key={source.id} role="listitem">
              <DataSourceCard
                source={source}
                onDeleted={() => mutate()}
              />
            </div>
          ))}
        </div>
      )}

      {/* Upload modal */}
      {showUploadModal && (
        <UploadCsvModal
          onClose={() => setShowUploadModal(false)}
          onSuccess={handleUploadSuccess}
        />
      )}
    </div>
  );
}
