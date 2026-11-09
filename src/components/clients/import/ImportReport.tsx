"use client";

interface ImportReportProps {
  importedCount: number;
  onFinish: () => void;
}

export default function ImportReport({
  importedCount,
  onFinish,
}: ImportReportProps) {
  return (
    <div className="flex flex-col items-center py-6 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#1CF637]/20 text-[#1CF637]">
        <svg
          className="h-8 w-8"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M5 13l4 4L19 7"
          />
        </svg>
      </div>

      <h3 className="mt-4 text-xl font-semibold text-white">
        Importação concluída!
      </h3>
      <p className="mt-2 text-sm text-[#96999F]">
        <strong className="text-white">{importedCount}</strong> clientes foram
        adicionados com sucesso ao banco de dados.
      </p>

      <button
        type="button"
        onClick={onFinish}
        className="mt-6 rounded-lg bg-[#1CF637] px-6 py-2.5 text-sm font-semibold text-[#0C0C0C] transition hover:bg-[#7CD420]"
      >
        Concluir e voltar à lista
      </button>
    </div>
  );
}