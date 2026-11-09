"use client";

import { useState, useRef } from "react";
import type { ImportAnalysisResult } from "@/types/import";
import type { ClientInput } from "@/types/client";
import ImportPreview from "./ImportPreview";
import ImportReport from "./ImportReport";

interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportSuccess: () => void;
}

export default function ImportModal({
  isOpen,
  onClose,
  onImportSuccess,
}: ImportModalProps) {
  const [step, setStep] = useState<"upload" | "preview" | "report">("upload");
  const [analysis, setAnalysis] = useState<ImportAnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [importedCount, setImportedCount] = useState(0);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  function resetState() {
    setStep("upload");
    setAnalysis(null);
    setLoading(false);
    setSubmitting(false);
    setError("");
    setImportedCount(0);
  }

  function handleClose() {
    resetState();
    onClose();
  }

  async function handleFileSelected(file: File) {
    if (!file.name.toLowerCase().endsWith(".csv")) {
      setError("Por favor, selecione um arquivo válido com extensão .csv.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/clients/import", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Erro ao analisar o arquivo.");
      }

      setAnalysis(result.data);
      setStep("preview");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao processar o CSV.");
    } finally {
      setLoading(false);
    }
  }

  async function handleConfirmImport(validClients: ClientInput[]) {
    setSubmitting(true);
    setError("");

    try {
      const response = await fetch("/api/clients/import/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clients: validClients }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Erro ao importar clientes.");
      }

      setImportedCount(result.count || validClients.length);
      setStep("report");
      onImportSuccess();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Falha ao persistir clientes."
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
      <div className="w-full max-w-3xl rounded-xl border border-[#2A2A2A] bg-[#141414] p-6 shadow-2xl">
        {/* Cabeçalho do Modal */}
        <div className="mb-6 flex items-center justify-between border-b border-[#2A2A2A] pb-4">
          <div>
            <h2 className="text-xl font-semibold text-white">
              Importar clientes via CSV
            </h2>
            <p className="mt-1 text-xs text-[#96999F]">
              Envie a planilha de contatos para validação e cadastro em lote.
            </p>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="text-lg text-[#96999F] transition hover:text-white"
          >
            ✕
          </button>
        </div>

        {error && (
          <div className="mb-4 rounded-lg border border-[#E36650]/40 bg-[#E36650]/10 p-3 text-xs text-[#E36650]">
            {error}
          </div>
        )}

        {/* Passo 1: Upload */}
        {step === "upload" && (
          <div className="flex flex-col items-center">
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                const droppedFile = e.dataTransfer.files[0];
                if (droppedFile) void handleFileSelected(droppedFile);
              }}
              onClick={() => fileInputRef.current?.click()}
              className="flex w-full cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-[#2A2A2A] bg-[#0C0C0C] p-10 transition hover:border-[#1CF637]/50"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                className="hidden"
                onChange={(e) => {
                  const selected = e.target.files?.[0];
                  if (selected) void handleFileSelected(selected);
                }}
              />

              <svg
                className="h-10 w-10 text-[#96999F]"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                />
              </svg>

              <p className="mt-3 text-sm font-medium text-white">
                Clique para selecionar ou arraste o arquivo CSV aqui
              </p>
              <p className="mt-1 text-xs text-[#96999F]">
                Arquivo CSV padrão UTF-8 até 5MB
              </p>
            </div>

            {loading && (
              <p className="mt-4 text-sm text-[#1CF637] animate-pulse">
                Analisando e validando dados do CSV...
              </p>
            )}
          </div>
        )}

        {/* Passo 2: Pré-visualização & Revisão */}
        {step === "preview" && analysis && (
          <ImportPreview
            analysis={analysis}
            onCancel={handleClose}
            onConfirm={handleConfirmImport}
            isSubmitting={submitting}
          />
        )}

        {/* Passo 3: Relatório de Conclusão */}
        {step === "report" && (
          <ImportReport
            importedCount={importedCount}
            onFinish={handleClose}
          />
        )}
      </div>
    </div>
  );
}