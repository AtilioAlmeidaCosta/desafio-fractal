"use client";

import { useState } from "react";
import type { Client, ClientInput } from "@/types/client";

interface ClientFormProps {
  client: Client | null;
  onSubmit: (data: ClientInput) => Promise<void>;
  onCancel: () => void;
}
interface ApiValidationError {
  success: false;
  message: string;
  errors?: {
    name?: string[];
    phone?: string[];
    email?: string[];
    address?: string[];
  };
}

export default function ClientForm({
  client,
  onSubmit,
  onCancel,
}: ClientFormProps) {
  const [formData, setFormData] = useState<ClientInput>(() => ({
    name: client?.name ?? "",
    phone: client?.phone ?? "",
    email: client?.email ?? "",
    address: client?.address ?? "",
  }));

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function handleChange(event: React.ChangeEvent<HTMLInputElement>) {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      await onSubmit(formData);
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Não foi possível salvar o cliente.",
      );
    } finally {
      setLoading(false);
    }
  }

  const inputClass =
    "w-full rounded-lg border border-[#2A2A2A] bg-[#0C0C0C] px-4 py-3 text-sm text-white outline-none transition placeholder:text-[#777] focus:border-[#1CF637]";

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label htmlFor="name" className="mb-2 block text-sm text-[#D2D3D5]">
          Nome completo
        </label>
        <input
          id="name"
          name="name"
          value={formData.name}
          onChange={handleChange}
          placeholder="Digite o nome do cliente"
          className={inputClass}
          required
        />
      </div>

      <div>
        <label htmlFor="phone" className="mb-2 block text-sm text-[#D2D3D5]">
          Telefone
        </label>
        <input
          id="phone"
          name="phone"
          type="tel"
          value={formData.phone}
          onChange={handleChange}
          placeholder="(13) 99999-9999"
          className={inputClass}
          required
        />
      </div>

      <div>
        <label htmlFor="email" className="mb-2 block text-sm text-[#D2D3D5]">
          E-mail
        </label>
        <input
          id="email"
          name="email"
          type="email"
          value={formData.email}
          onChange={handleChange}
          placeholder="cliente@email.com"
          className={inputClass}
          required
        />
      </div>

      <div>
        <label htmlFor="address" className="mb-2 block text-sm text-[#D2D3D5]">
          Endereço
        </label>
        <input
          id="address"
          name="address"
          value={formData.address}
          onChange={handleChange}
          placeholder="Rua, número, cidade e estado"
          className={inputClass}
          required
        />
      </div>

      {error && (
        <div
          role="alert"
          className="rounded-lg border border-[#E36650]/40 bg-[#E36650]/10 p-3"
        >
          <p className="mb-2 text-sm font-semibold text-[#E36650]">
            Verifique os seguintes campos:
          </p>

          <ul className="list-inside list-disc space-y-1 text-sm text-[#D2D3D5]">
            {error.split("\n").map((message, index) => (
              <li key={index}>{message}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="flex justify-end gap-3 pt-2">
        <button
          type="button"
          onClick={onCancel}
          disabled={loading}
          className="rounded-lg border border-[#2A2A2A] px-5 py-3 text-sm text-[#D2D3D5] transition hover:bg-[#242424] disabled:opacity-50"
        >
          Cancelar
        </button>

        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-[#1CF637] px-5 py-3 text-sm font-semibold text-[#0C0C0C] transition hover:bg-[#7CD420] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading
            ? "Salvando..."
            : client
              ? "Salvar alterações"
              : "Cadastrar cliente"}
        </button>
      </div>
    </form>
  );
}
