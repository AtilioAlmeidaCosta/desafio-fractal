"use client";

import { useState, useMemo, useEffect } from "react";
import type { Client } from "@/types/client";

interface ClientListProps {
  clients: Client[];
  onEdit: (client: Client) => void;
}

export default function ClientList({ clients, onEdit }: ClientListProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState<number>(10);

  // Se a lista de clientes mudar (ex: por filtro de busca), reseta para a primeira página
  useEffect(() => {
    setCurrentPage(1);
  }, [clients.length]);

  // Cálculos automáticos de paginação
  const totalItems = clients.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));

  // Garante que a página atual nunca exceda o total de páginas
  const safeCurrentPage = Math.min(currentPage, totalPages);

  const paginatedClients = useMemo(() => {
    const startIndex = (safeCurrentPage - 1) * pageSize;
    return clients.slice(startIndex, startIndex + pageSize);
  }, [clients, safeCurrentPage, pageSize]);

  const startRecord = totalItems === 0 ? 0 : (safeCurrentPage - 1) * pageSize + 1;
  const endRecord = Math.min(safeCurrentPage * pageSize, totalItems);

  if (totalItems === 0) {
    return (
      <div className="rounded-lg border border-[#2A2A2A] bg-[#141414] p-8 text-center text-[#96999F]">
        Nenhum cliente encontrado.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Tabela de Clientes */}
      <div className="overflow-x-auto rounded-lg border border-[#2A2A2A] bg-[#141414]">
        <table className="w-full text-left text-sm text-[#D2D3D5]">
          <thead className="border-b border-[#2A2A2A] bg-[#0C0C0C] text-xs uppercase tracking-wider text-[#96999F]">
            <tr>
              <th className="px-5 py-3 font-medium">Nome</th>
              <th className="px-5 py-3 font-medium">Telefone</th>
              <th className="px-5 py-3 font-medium">E-mail</th>
              <th className="px-5 py-3 font-medium">Endereço</th>
              <th className="px-5 py-3 text-right font-medium">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#2A2A2A]">
            {paginatedClients.map((client) => (
              <tr
                key={client._id}
                className="transition hover:bg-[#1A1A1A]"
              >
                <td className="px-5 py-4 font-medium text-white">
                  {client.name}
                </td>
                <td className="px-5 py-4 text-[#96999F]">{client.phone}</td>
                <td className="px-5 py-4 text-[#96999F]">{client.email}</td>
                <td className="max-w-xs truncate px-5 py-4 text-[#96999F]">
                  {client.address}
                </td>
                <td className="px-5 py-4 text-right">
                  <button
                    type="button"
                    onClick={() => onEdit(client)}
                    className="rounded border border-[#2A2A2A] px-3 py-1.5 text-xs font-medium text-[#D2D3D5] transition hover:border-[#1CF637] hover:text-[#1CF637]"
                  >
                    Editar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Barra de Controle de Paginação e Itens por Página */}
      <div className="flex flex-col items-center justify-between gap-4 rounded-lg border border-[#2A2A2A] bg-[#141414] p-4 text-xs text-[#96999F] sm:flex-row">
        {/* Lado Esquerdo: Contadores automáticos e Seletor manual */}
        <div className="flex flex-wrap items-center gap-4">
          <span>
            Mostrando <strong className="text-white">{startRecord}</strong> a{" "}
            <strong className="text-white">{endRecord}</strong> de{" "}
            <strong className="text-white">{totalItems}</strong> clientes
          </span>

          <div className="flex items-center gap-2">
            <label htmlFor="pageSizeSelect" className="text-[#96999F]">
              Itens por página:
            </label>
            <select
              id="pageSizeSelect"
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="rounded border border-[#2A2A2A] bg-[#0C0C0C] px-2 py-1 text-white focus:border-[#1CF637] focus:outline-none"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>
        </div>

        {/* Lado Direito: Navegação entre páginas */}
        <div className="flex items-center gap-2">
          <span>
            Página <strong className="text-white">{safeCurrentPage}</strong> de{" "}
            <strong className="text-white">{totalPages}</strong>
          </span>

          <div className="flex gap-1">
            <button
              type="button"
              disabled={safeCurrentPage === 1}
              onClick={() => setCurrentPage(1)}
              className="rounded border border-[#2A2A2A] bg-[#0C0C0C] px-2.5 py-1 text-xs text-[#D2D3D5] transition hover:border-[#1CF637] hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
              title="Primeira página"
            >
              ««
            </button>
            <button
              type="button"
              disabled={safeCurrentPage === 1}
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              className="rounded border border-[#2A2A2A] bg-[#0C0C0C] px-2.5 py-1 text-xs text-[#D2D3D5] transition hover:border-[#1CF637] hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
              title="Página anterior"
            >
              ‹
            </button>
            <button
              type="button"
              disabled={safeCurrentPage === totalPages}
              onClick={() =>
                setCurrentPage((prev) => Math.min(prev + 1, totalPages))
              }
              className="rounded border border-[#2A2A2A] bg-[#0C0C0C] px-2.5 py-1 text-xs text-[#D2D3D5] transition hover:border-[#1CF637] hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
              title="Próxima página"
            >
              ›
            </button>
            <button
              type="button"
              disabled={safeCurrentPage === totalPages}
              onClick={() => setCurrentPage(totalPages)}
              className="rounded border border-[#2A2A2A] bg-[#0C0C0C] px-2.5 py-1 text-xs text-[#D2D3D5] transition hover:border-[#1CF637] hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
              title="Última página"
            >
              »»
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}