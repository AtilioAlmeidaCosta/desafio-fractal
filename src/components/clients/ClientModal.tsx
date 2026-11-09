
"use client";

import ClientForm from "./ClientForm";
import type { Client, ClientInput } from "@/types/client";

interface ClientModalProps {
  isOpen: boolean;
  client: Client | null;
  onClose: () => void;
  onSave: (data: ClientInput) => Promise<void>;
}

export default function ClientModal({
  isOpen,
  client,
  onClose,
  onSave,
}: ClientModalProps) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="client-modal-title"
        className="w-full max-w-lg rounded-xl border border-[#2A2A2A] bg-[#141414] p-6 shadow-2xl"
      >
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2
              id="client-modal-title"
              className="text-xl font-semibold text-white"
            >
              {client ? "Editar cliente" : "Novo cliente"}
            </h2>

            <p className="mt-1 text-sm text-[#96999F]">
              {client
                ? "Atualize as informações do cadastro."
                : "Preencha os dados para cadastrar um cliente."}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar janela"
            className="rounded-md px-3 py-2 text-xl text-[#96999F] transition hover:bg-[#242424] hover:text-white"
          >
            ×
          </button>
        </div>

        <ClientForm
          client={client}
          onSubmit={onSave}
          onCancel={onClose}
        />
      </section>
    </div>
  );
}
