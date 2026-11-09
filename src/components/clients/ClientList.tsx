
import type { Client } from "@/types/client";

interface ClientListProps {
  clients: Client[];
  onEdit: (client: Client) => void;
}

export default function ClientList({
  clients,
  onEdit,
}: ClientListProps) {
  if (clients.length === 0) {
    return (
      <div className="rounded-lg border border-[#2A2A2A] bg-[#141414] px-6 py-12 text-center">
        <h3 className="text-lg font-semibold text-white">
          Nenhum cliente encontrado
        </h3>
        <p className="mt-2 text-sm text-[#96999F]">
          Tente pesquisar por outro nome ou cadastre um novo cliente.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border border-[#2A2A2A] bg-[#141414]">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[650px] text-left text-sm">
          <thead className="border-b border-[#2A2A2A] bg-[#101010] text-[#96999F]">
            <tr>
              <th className="px-5 py-4 font-medium">Nome</th>
              <th className="px-5 py-4 font-medium">Telefone</th>
              <th className="px-5 py-4 font-medium">E-mail</th>
              <th className="px-5 py-4 font-medium">Endereço</th>
              <th className="px-5 py-4 text-right font-medium">Ações</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-[#2A2A2A]">
            {clients.map((client) => (
              <tr
                key={client._id}
                className="transition hover:bg-[#1C1C1C]"
              >
                <td className="px-5 py-4 font-medium text-white">
                  {client.name}
                </td>

                <td className="px-5 py-4 text-[#D2D3D5]">
                  {client.phone}
                </td>

                <td className="px-5 py-4 text-[#D2D3D5]">
                  {client.email}
                </td>

                <td className="px-5 py-4 text-[#96999F]">
                  {client.address}
                </td>

                <td className="px-5 py-4 text-right">
                  <button
                    type="button"
                    onClick={() => onEdit(client)}
                    className="rounded-md px-3 py-2 font-medium text-[#1CF637] transition hover:bg-[#1CF637]/10"
                  >
                    Editar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
