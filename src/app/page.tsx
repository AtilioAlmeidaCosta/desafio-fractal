"use client";

import { useEffect, useMemo, useState } from "react";

import ClientList from "@/components/clients/ClientList";
import ClientSearch from "@/components/clients/ClientSearch";
import ClientModal from "@/components/clients/ClientModal";
import Image from "next/image";
import type { Client, ClientInput } from "@/types/client";

interface ApiResponse {
  success: boolean;
  message?: string;
  data?: Client | Client[];
}

async function fetchClientsFromApi(): Promise<Client[]> {
  const response = await fetch("/api/clients");
  const result: ApiResponse = await response.json();

  if (!response.ok || !Array.isArray(result.data)) {
    throw new Error(result.message || "Erro ao carregar clientes.");
  }

  return result.data;
}

export default function Home() {
  const [clients, setClients] = useState<Client[]>([]);
  const [search, setSearch] = useState("");
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [modalKey, setModalKey] = useState(0);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function initialLoad() {
      try {
        const data = await fetchClientsFromApi();
        if (!cancelled) {
          setClients(data);
        }
      } catch (error) {
        if (!cancelled) {
          setError(
            error instanceof Error
              ? error.message
              : "Não foi possível carregar os clientes.",
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void initialLoad();

    return () => {
      cancelled = true;
    };
  }, []);

  const filteredClients = useMemo(() => {
    const normalizedSearch = search.trim().toLocaleLowerCase("pt-BR");

    return clients.filter((client) =>
      client.name.toLocaleLowerCase("pt-BR").includes(normalizedSearch),
    );
  }, [clients, search]);

  async function loadClients() {
    setLoading(true);
    setError("");

    try {
      const data = await fetchClientsFromApi();
      setClients(data);
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Não foi possível carregar os clientes.",
      );
    } finally {
      setLoading(false);
    }
  }

  function openNewClientModal() {
    setSelectedClient(null);
    setModalKey((previous) => previous + 1);
    setModalOpen(true);
  }

  function openEditClientModal(client: Client) {
    setSelectedClient(client);
    setModalKey((previous) => previous + 1);
    setModalOpen(true);
  }

  async function handleSave(data: ClientInput) {
    const isEditing = selectedClient !== null;

    const url = isEditing
      ? `/api/clients/${selectedClient._id}`
      : "/api/clients";

    const response = await fetch(url, {
      method: isEditing ? "PUT" : "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    const result: ApiResponse = await response.json();

    if (!response.ok || !result.success || !result.data) {
      throw new Error(result.message || "Não foi possível salvar o cliente.");
    }

    const savedClient = result.data as Client;

    if (isEditing) {
      setClients((previous) =>
        previous.map((client) =>
          client._id === savedClient._id ? savedClient : client,
        ),
      );
    } else {
      setClients((previous) => [savedClient, ...previous]);
    }

    setModalOpen(false);
    setSelectedClient(null);
  }

  return (
    <main className="min-h-screen bg-[#0C0C0C] px-4 py-8 text-[#D2D3D5] sm:px-8 lg:px-12">
      <div className="mx-auto max-w-7xl">
        <header className="mb-10 flex flex-col gap-4 border-b border-[#2A2A2A] pb-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
              <Image
                src="/logo-250.png"
                alt="Fractal Security"
                width={250}
                height={80}
                className="h-auto w-48 object-contain"
              />
            <h1 className="text-3xl font-semibold text-white">
              Gestão de clientes
            </h1>

            <p className="mt-2 text-sm text-[#96999F]">
              Consulte e gerencie os cadastros de clientes.
            </p>
          </div>

          <button
            type="button"
            onClick={openNewClientModal}
            className="rounded-lg bg-[#1CF637] px-5 py-3 text-sm font-semibold text-[#0C0C0C] transition hover:bg-[#7CD420]"
          >
            + Novo cliente
          </button>
        </header>

        <section className="mb-8 grid gap-4 sm:grid-cols-2">
          <div className="rounded-lg border border-[#2A2A2A] bg-[#141414] p-5">
            <p className="text-sm text-[#96999F]">Total de clientes</p>

            <p className="mt-2 text-3xl font-semibold text-white">
              {clients.length}
            </p>
          </div>

          <div className="rounded-lg border border-[#2A2A2A] bg-[#141414] p-5">
            <p className="text-sm text-[#96999F]">Resultados da pesquisa</p>

            <p className="mt-2 text-3xl font-semibold text-white">
              {filteredClients.length}
            </p>
          </div>
        </section>

        <section>
          <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-white">
                Clientes cadastrados
              </h2>

              <p className="mt-1 text-sm text-[#96999F]">
                Consulte os registros e edite suas informações.
              </p>
            </div>

            <div className="w-full sm:max-w-sm">
              <ClientSearch value={search} onChange={setSearch} />
            </div>
          </div>

          {loading ? (
            <div className="rounded-lg border border-[#2A2A2A] bg-[#141414] px-6 py-12 text-center text-[#96999F]">
              Carregando clientes...
            </div>
          ) : error ? (
            <div className="rounded-lg border border-[#E36650]/40 bg-[#E36650]/10 p-6 text-center">
              <p className="text-sm text-[#E36650]">{error}</p>

              <button
                type="button"
                onClick={loadClients}
                className="mt-4 rounded-lg border border-[#E36650]/50 px-4 py-2 text-sm text-white transition hover:bg-[#E36650]/10"
              >
                Tentar novamente
              </button>
            </div>
          ) : (
            <ClientList
              clients={filteredClients}
              onEdit={openEditClientModal}
            />
          )}
        </section>
      </div>

      <ClientModal
        key={modalKey}
        isOpen={modalOpen}
        client={selectedClient}
        onClose={() => setModalOpen(false)}
        onSave={handleSave}
      />
    </main>
  );
}
