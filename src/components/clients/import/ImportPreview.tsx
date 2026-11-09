"use client";

import { useState } from "react";
import Papa from "papaparse";
import type {
  ImportAnalysisResult,
  PendingClientRecord,
  ValidClientRecord,
} from "@/types/import";
import type { ClientInput } from "@/types/client";
import { clientSchema } from "@/validators/client";

interface ImportPreviewProps {
  analysis: ImportAnalysisResult;
  onCancel: () => void;
  onConfirm: (validClients: ClientInput[]) => Promise<void>;
  isSubmitting: boolean;
}

export default function ImportPreview({
  analysis,
  onCancel,
  onConfirm,
  isSubmitting,
}: ImportPreviewProps) {
  const [activeTab, setActiveTab] = useState<"valid" | "pending" | "duplicates">(
    analysis.pending.length > 0 ? "pending" : "valid"
  );

  const [validRecords, setValidRecords] = useState<ValidClientRecord[]>(
    analysis.valid
  );
  const [pendingRecords, setPendingRecords] = useState<PendingClientRecord[]>(
    analysis.pending
  );

  function handlePendingChange(
    index: number,
    field: keyof ClientInput,
    value: string
  ) {
    setPendingRecords((prev) => {
      const updated = [...prev];
      const target = { ...updated[index] };
      target.data = { ...target.data, [field]: value };

      const parseResult = clientSchema.safeParse(target.data);
      if (parseResult.success) {
        const newErrors = { ...target.errors };
        delete newErrors[field];
        target.errors = newErrors;
      } else {
        const fieldErrors = parseResult.error.flatten().fieldErrors;
        target.errors = {
          ...target.errors,
          [field]: fieldErrors[field] || [],
        };
      }

      updated[index] = target;
      return updated;
    });
  }

  function handlePromotePending(index: number) {
    const item = pendingRecords[index];
    const parseResult = clientSchema.safeParse(item.data);

    if (!parseResult.success) {
      alert("Corrija todos os campos destacados antes de aprovar este registro.");
      return;
    }

    setValidRecords((prev) => [
      ...prev,
      { rowIndex: item.rowIndex, data: parseResult.data },
    ]);
    setPendingRecords((prev) => prev.filter((_, i) => i !== index));
  }

  function handleDiscardPending(index: number) {
    setPendingRecords((prev) => prev.filter((_, i) => i !== index));
  }

  function handleExportErrorsCsv() {
    // Consolida registros pendentes e duplicados com a justificativa
    const errorRows = [
      ...pendingRecords.map((item) => {
        const motivos = Object.entries(item.errors || {})
          .map(([campo, errs]) => `${campo.toUpperCase()}: ${errs.join("; ")}`)
          .join(" | ") || "Dados incompletos ou formato inválido";

        return {
          Linha_Original: item.rowIndex,
          Nome: item.data.name || "",
          Telefone: item.data.phone || "",
          Email: item.data.email || "",
          Endereço: item.data.address || "",
          Motivo_Erro: motivos,
        };
      }),
      ...analysis.duplicates.map((item) => ({
        Linha_Original: item.rowIndex,
        Nome: item.data.name || "",
        Telefone: item.data.phone || "",
        Email: item.data.email || "",
        Endereço: item.data.address || "",
        Motivo_Erro:
          item.reason === "already_registered"
            ? "E-mail já cadastrado no banco de dados"
            : "E-mail duplicado dentro do próprio arquivo CSV",
      })),
    ];

    if (errorRows.length === 0) {
      alert("Não há registros com erro para exportar.");
      return;
    }

    const csvContent = "\uFEFF" + Papa.unparse(errorRows);
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `clientes_inconsistentes_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  async function handleFinalSubmit() {
    const clientsToImport = validRecords.map((r) => r.data);
    await onConfirm(clientsToImport);
  }

  const hasIssues = pendingRecords.length > 0 || analysis.duplicates.length > 0;

  return (
    <div className="flex flex-col gap-6">
      {/* Resumo e Botão de Exportação de Erros */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="grid w-full grid-cols-1 gap-3 sm:grid-cols-3">
          <button
            type="button"
            onClick={() => setActiveTab("valid")}
            className={`flex flex-col rounded-lg border p-4 text-left transition ${
              activeTab === "valid"
                ? "border-[#1CF637] bg-[#1CF637]/10"
                : "border-[#2A2A2A] bg-[#141414] hover:border-[#3A3A3A]"
            }`}
          >
            <span className="text-xs font-medium text-[#96999F]">Prontos para importar</span>
            <span className="mt-1 text-2xl font-bold text-white">
              {validRecords.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("pending")}
            className={`flex flex-col rounded-lg border p-4 text-left transition ${
              activeTab === "pending"
                ? "border-amber-500 bg-amber-500/10"
                : "border-[#2A2A2A] bg-[#141414] hover:border-[#3A3A3A]"
            }`}
          >
            <span className="text-xs font-medium text-[#96999F]">Pendentes de revisão</span>
            <span className="mt-1 text-2xl font-bold text-amber-400">
              {pendingRecords.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("duplicates")}
            className={`flex flex-col rounded-lg border p-4 text-left transition ${
              activeTab === "duplicates"
                ? "border-[#E36650] bg-[#E36650]/10"
                : "border-[#2A2A2A] bg-[#141414] hover:border-[#3A3A3A]"
            }`}
          >
            <span className="text-xs font-medium text-[#96999F]">Duplicados / Ignorados</span>
            <span className="mt-1 text-2xl font-bold text-[#E36650]">
              {analysis.duplicates.length}
            </span>
          </button>
        </div>
      </div>

      {hasIssues && (
        <div className="flex items-center justify-between rounded-lg border border-[#2A2A2A] bg-[#0C0C0C] p-3 text-xs text-[#96999F]">
          <span>
            Prefere que a equipe comercial corrija externamente?
          </span>
          <button
            type="button"
            onClick={handleExportErrorsCsv}
            className="flex items-center gap-1.5 rounded border border-[#2A2A2A] bg-[#141414] px-3 py-1.5 font-medium text-white transition hover:border-amber-400 hover:text-amber-400"
          >
            ↓ Baixar planilha de erros (.csv)
          </button>
        </div>
      )}

      {/* Conteúdo das Abas */}
      <div className="max-h-[380px] overflow-y-auto rounded-lg border border-[#2A2A2A] bg-[#141414] p-4">
        {/* Aba Válidos */}
        {activeTab === "valid" && (
          <div className="space-y-3">
            {validRecords.length === 0 ? (
              <p className="py-8 text-center text-sm text-[#96999F]">
                Nenhum registro validado no momento.
              </p>
            ) : (
              validRecords.map((item, idx) => (
                <div
                  key={idx}
                  className="flex flex-col justify-between gap-2 rounded border border-[#2A2A2A] bg-[#0C0C0C] p-3 text-sm sm:flex-row sm:items-center"
                >
                  <div>
                    <span className="font-semibold text-white">{item.data.name}</span>
                    <span className="ml-2 text-xs text-[#96999F]">
                      (Linha {item.rowIndex})
                    </span>
                    <div className="text-xs text-[#96999F]">
                      {item.data.email} • {item.data.phone}
                    </div>
                    <div className="text-xs text-[#96999F]">{item.data.address}</div>
                  </div>
                  <span className="w-fit rounded bg-[#1CF637]/20 px-2 py-1 text-xs font-medium text-[#1CF637]">
                    Válido
                  </span>
                </div>
              ))
            )}
          </div>
        )}

        {/* Aba Pendentes */}
        {activeTab === "pending" && (
          <div className="space-y-4">
            {pendingRecords.length === 0 ? (
              <p className="py-8 text-center text-sm text-[#96999F]">
                Nenhum registro pendente de revisão. Todos foram corrigidos ou descartados.
              </p>
            ) : (
              pendingRecords.map((item, idx) => {
                const isItemValid = clientSchema.safeParse(item.data).success;
                return (
                  <div
                    key={idx}
                    className="flex flex-col gap-3 rounded border border-amber-500/30 bg-[#0C0C0C] p-3 text-sm"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
                        Linha {item.rowIndex} — Incompleto ou Inválido
                      </span>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => handlePromotePending(idx)}
                          className={`rounded px-2.5 py-1 text-xs font-semibold transition ${
                            isItemValid
                              ? "bg-[#1CF637] text-[#0C0C0C] hover:bg-[#7CD420]"
                              : "cursor-not-allowed bg-[#2A2A2A] text-[#96999F]"
                          }`}
                        >
                          Validar e Incluir
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDiscardPending(idx)}
                          className="rounded border border-[#2A2A2A] px-2.5 py-1 text-xs text-[#96999F] hover:bg-[#141414] hover:text-white"
                        >
                          Descartar
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                      <div>
                        <label className="text-xs text-[#96999F]">Nome</label>
                        <input
                          type="text"
                          value={item.data.name || ""}
                          onChange={(e) =>
                            handlePendingChange(idx, "name", e.target.value)
                          }
                          className={`w-full rounded border bg-[#141414] px-2.5 py-1.5 text-xs text-white focus:outline-none ${
                            item.errors?.name
                              ? "border-[#E36650]"
                              : "border-[#2A2A2A] focus:border-[#1CF637]"
                          }`}
                        />
                        {item.errors?.name && (
                          <p className="mt-0.5 text-[11px] text-[#E36650]">
                            {item.errors.name[0]}
                          </p>
                        )}
                      </div>

                      <div>
                        <label className="text-xs text-[#96999F]">Telefone</label>
                        <input
                          type="text"
                          value={item.data.phone || ""}
                          onChange={(e) =>
                            handlePendingChange(idx, "phone", e.target.value)
                          }
                          className={`w-full rounded border bg-[#141414] px-2.5 py-1.5 text-xs text-white focus:outline-none ${
                            item.errors?.phone
                              ? "border-[#E36650]"
                              : "border-[#2A2A2A] focus:border-[#1CF637]"
                          }`}
                        />
                        {item.errors?.phone && (
                          <p className="mt-0.5 text-[11px] text-[#E36650]">
                            {item.errors.phone[0]}
                          </p>
                        )}
                      </div>

                      <div>
                        <label className="text-xs text-[#96999F]">E-mail</label>
                        <input
                          type="email"
                          value={item.data.email || ""}
                          onChange={(e) =>
                            handlePendingChange(idx, "email", e.target.value)
                          }
                          className={`w-full rounded border bg-[#141414] px-2.5 py-1.5 text-xs text-white focus:outline-none ${
                            item.errors?.email
                              ? "border-[#E36650]"
                              : "border-[#2A2A2A] focus:border-[#1CF637]"
                          }`}
                        />
                        {item.errors?.email && (
                          <p className="mt-0.5 text-[11px] text-[#E36650]">
                            {item.errors.email[0]}
                          </p>
                        )}
                      </div>

                      <div>
                        <label className="text-xs text-[#96999F]">Endereço</label>
                        <input
                          type="text"
                          value={item.data.address || ""}
                          onChange={(e) =>
                            handlePendingChange(idx, "address", e.target.value)
                          }
                          className={`w-full rounded border bg-[#141414] px-2.5 py-1.5 text-xs text-white focus:outline-none ${
                            item.errors?.address
                              ? "border-[#E36650]"
                              : "border-[#2A2A2A] focus:border-[#1CF637]"
                          }`}
                        />
                        {item.errors?.address && (
                          <p className="mt-0.5 text-[11px] text-[#E36650]">
                            {item.errors.address[0]}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* Aba Duplicados */}
        {activeTab === "duplicates" && (
          <div className="space-y-3">
            {analysis.duplicates.length === 0 ? (
              <p className="py-8 text-center text-sm text-[#96999F]">
                Nenhum cliente duplicado encontrado.
              </p>
            ) : (
              analysis.duplicates.map((item, idx) => (
                <div
                  key={idx}
                  className="flex flex-col justify-between gap-2 rounded border border-[#2A2A2A] bg-[#0C0C0C] p-3 text-sm sm:flex-row sm:items-center"
                >
                  <div>
                    <span className="font-semibold text-white">{item.data.name || "Sem nome"}</span>
                    <span className="ml-2 text-xs text-[#96999F]">
                      (Linha {item.rowIndex})
                    </span>
                    <div className="text-xs text-[#96999F]">{item.data.email}</div>
                  </div>
                  <span className="w-fit rounded bg-[#E36650]/20 px-2 py-1 text-xs font-medium text-[#E36650]">
                    {item.reason === "already_registered"
                      ? "Já cadastrado no banco"
                      : "Duplicado no arquivo CSV"}
                  </span>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Ações Inferiores */}
      <div className="flex flex-col-reverse justify-end gap-3 sm:flex-row">
        <button
          type="button"
          onClick={onCancel}
          disabled={isSubmitting}
          className="rounded-lg border border-[#2A2A2A] px-4 py-2.5 text-sm font-medium text-[#96999F] transition hover:bg-[#141414] hover:text-white"
        >
          Cancelar
        </button>
        <button
          type="button"
          onClick={handleFinalSubmit}
          disabled={validRecords.length === 0 || isSubmitting}
          className="rounded-lg bg-[#1CF637] px-5 py-2.5 text-sm font-semibold text-[#0C0C0C] transition hover:bg-[#7CD420] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSubmitting
            ? "Importando..."
            : `Importar ${validRecords.length} clientes válidos`}
        </button>
      </div>
    </div>
  );
}