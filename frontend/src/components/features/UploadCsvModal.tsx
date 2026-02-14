"use client";

import React, { useCallback, useState } from "react";
import { useDropzone, type FileRejection } from "react-dropzone";
import { Upload, X, FileText, CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

interface UploadCsvModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

interface FileEntry {
  file: File;
  name: string;
  status: "pending" | "uploading" | "success" | "error";
  error?: string;
}

export function UploadCsvModal({ onClose, onSuccess }: UploadCsvModalProps) {
  const [files, setFiles] = useState<FileEntry[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [globalError, setGlobalError] = useState<string | null>(null);

  const onDrop = useCallback((acceptedFiles: File[], rejectedFiles: FileRejection[]) => {
    setGlobalError(null);

    // Handle rejected files
    if (rejectedFiles.length > 0) {
      const reasons = rejectedFiles.map((r) => {
        const isSize = r.errors.some((e) => e.code === "file-too-large");
        const isType = r.errors.some((e) => e.code === "file-invalid-type");
        if (isSize) return `${r.file.name}: fichier trop volumineux (max 50 Mo)`;
        if (isType) return `${r.file.name}: format non supporte (CSV uniquement)`;
        return `${r.file.name}: fichier rejete`;
      });
      setGlobalError(reasons.join(". "));
    }

    if (acceptedFiles.length === 0) return;

    const newEntries: FileEntry[] = acceptedFiles.map((file) => ({
      file,
      name: file.name.replace(/\.[^/.]+$/, ""),
      status: "pending" as const,
    }));

    setFiles((prev) => [...prev, ...newEntries]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "text/csv": [".csv"] },
    maxSize: MAX_FILE_SIZE,
    multiple: true,
  });

  function handleRemoveFile(index: number) {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  }

  function handleNameChange(index: number, newName: string) {
    setFiles((prev) =>
      prev.map((f, i) => (i === index ? { ...f, name: newName } : f))
    );
  }

  async function handleUploadAll(e: React.FormEvent) {
    e.preventDefault();
    if (files.length === 0) {
      setGlobalError("Veuillez selectionner au moins un fichier CSV.");
      return;
    }

    const emptyName = files.find((f) => !f.name.trim());
    if (emptyName) {
      setGlobalError("Tous les fichiers doivent avoir un nom.");
      return;
    }

    setIsUploading(true);
    setGlobalError(null);
    let hasSuccess = false;

    for (let i = 0; i < files.length; i++) {
      const entry = files[i];
      if (entry.status === "success") continue;

      // Mark as uploading
      setFiles((prev) =>
        prev.map((f, idx) => (idx === i ? { ...f, status: "uploading", error: undefined } : f))
      );

      try {
        await api.dataSources.upload(entry.file, entry.name.trim());
        setFiles((prev) =>
          prev.map((f, idx) => (idx === i ? { ...f, status: "success" } : f))
        );
        hasSuccess = true;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Erreur lors de l'upload.";
        setFiles((prev) =>
          prev.map((f, idx) => (idx === i ? { ...f, status: "error", error: message } : f))
        );
      }
    }

    setIsUploading(false);

    if (hasSuccess) {
      onSuccess();
    }

    // Auto-close if all succeeded
    const finalFiles = files.map((f, i) => {
      if (f.status === "success") return f;
      return files[i];
    });
    const allDone = finalFiles.every((f) => f.status === "success");
    if (allDone && files.length > 0) {
      // Small delay so user sees the success state
      setTimeout(() => onClose(), 600);
    }
  }

  const pendingCount = files.filter((f) => f.status !== "success").length;
  const successCount = files.filter((f) => f.status === "success").length;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="upload-modal-title"
    >
      <div className="w-full max-w-lg rounded-xl bg-white shadow-xl max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4 shrink-0">
          <h2
            id="upload-modal-title"
            className="text-lg font-semibold text-gray-900"
          >
            Importer des fichiers CSV
          </h2>
          <button
            onClick={onClose}
            aria-label="Fermer"
            className="rounded-md p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleUploadAll} className="px-6 py-5 space-y-5 overflow-y-auto flex-1">
          {/* Dropzone */}
          <div>
            <div
              {...getRootProps()}
              className={cn(
                "flex flex-col items-center justify-center rounded-lg border-2 border-dashed px-6 py-8 text-center cursor-pointer transition-colors",
                isDragActive
                  ? "border-teal-400 bg-teal-50"
                  : "border-gray-300 bg-gray-50 hover:border-teal-400 hover:bg-teal-50"
              )}
            >
              <input {...getInputProps()} />
              <Upload
                className={cn(
                  "mb-3 h-8 w-8",
                  isDragActive ? "text-teal-500" : "text-gray-400"
                )}
                aria-hidden="true"
              />
              {isDragActive ? (
                <p className="text-sm font-medium text-teal-600">
                  Deposez les fichiers ici...
                </p>
              ) : (
                <>
                  <p className="text-sm font-medium text-gray-700">
                    Glissez-deposez vos fichiers CSV
                  </p>
                  <p className="mt-1 text-xs text-gray-500">
                    ou cliquez pour selectionner (max 50 Mo par fichier)
                  </p>
                </>
              )}
            </div>
          </div>

          {/* File list */}
          {files.length > 0 && (
            <div className="space-y-3">
              <p className="text-sm font-medium text-gray-700">
                {files.length} fichier{files.length > 1 ? "s" : ""} selectionne{files.length > 1 ? "s" : ""}
              </p>
              <div className="space-y-2 max-h-52 overflow-y-auto">
                {files.map((entry, index) => (
                  <div
                    key={index}
                    className={cn(
                      "flex items-center gap-3 rounded-lg border px-4 py-3",
                      entry.status === "success"
                        ? "border-green-200 bg-green-50"
                        : entry.status === "error"
                        ? "border-red-200 bg-red-50"
                        : entry.status === "uploading"
                        ? "border-teal-200 bg-teal-50"
                        : "border-gray-200 bg-gray-50"
                    )}
                  >
                    {/* Icon */}
                    {entry.status === "success" ? (
                      <CheckCircle2 className="h-5 w-5 shrink-0 text-green-600" aria-hidden="true" />
                    ) : entry.status === "error" ? (
                      <AlertCircle className="h-5 w-5 shrink-0 text-red-500" aria-hidden="true" />
                    ) : entry.status === "uploading" ? (
                      <div className="h-5 w-5 shrink-0 animate-spin rounded-full border-2 border-teal-600 border-t-transparent" aria-label="Upload en cours" />
                    ) : (
                      <FileText className="h-5 w-5 shrink-0 text-teal-600" aria-hidden="true" />
                    )}

                    {/* Name input or display */}
                    <div className="flex-1 min-w-0">
                      {entry.status === "pending" ? (
                        <input
                          type="text"
                          value={entry.name}
                          onChange={(e) => handleNameChange(index, e.target.value)}
                          className="w-full bg-transparent text-sm text-gray-900 border-none outline-none focus:ring-0 p-0"
                          placeholder="Nom de la source"
                          aria-label={`Nom pour ${entry.file.name}`}
                        />
                      ) : (
                        <span className="text-sm text-gray-900 truncate block">
                          {entry.name}
                        </span>
                      )}
                      <span className="text-xs text-gray-500 truncate block">
                        {entry.file.name} ({(entry.file.size / 1024).toFixed(0)} Ko)
                      </span>
                      {entry.error && (
                        <span className="text-xs text-red-600 block mt-0.5">
                          {entry.error}
                        </span>
                      )}
                    </div>

                    {/* Remove button */}
                    {(entry.status === "pending" || entry.status === "error") && (
                      <button
                        type="button"
                        onClick={() => handleRemoveFile(index)}
                        aria-label={`Supprimer ${entry.file.name}`}
                        className="text-gray-400 hover:text-red-500 transition-colors shrink-0"
                      >
                        <X className="h-4 w-4" aria-hidden="true" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Global error */}
          {globalError && (
            <Alert variant="destructive" className="text-sm">
              {globalError}
            </Alert>
          )}

          {/* Upload progress summary */}
          {isUploading && successCount > 0 && (
            <p className="text-sm text-teal-600">
              {successCount} / {files.length} fichier{files.length > 1 ? "s" : ""} importe{files.length > 1 ? "s" : ""}...
            </p>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-1">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isUploading}
            >
              Annuler
            </Button>
            <Button
              type="submit"
              disabled={isUploading || files.length === 0}
              aria-busy={isUploading}
            >
              {isUploading
                ? "Import en cours..."
                : pendingCount > 0
                ? `Importer ${pendingCount} fichier${pendingCount > 1 ? "s" : ""}`
                : `${successCount} importe${successCount > 1 ? "s" : ""}`}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
