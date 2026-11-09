import Papa from "papaparse";
import { normalizeHeaderKey, sanitizeEncoding } from "./normalizer";
import type { RawCsvRow } from "@/types/import";

export interface ParsedCsvData {
  rows: { rowIndex: number; data: RawCsvRow }[];
  ignoredEmptyRows: number;
}

export function parseClientsCsv(csvContent: string): ParsedCsvData {
  const parsed = Papa.parse<Record<string, string>>(csvContent, {
    header: true,
    skipEmptyLines: "greedy",
    transformHeader: (header: string) => normalizeHeaderKey(header),
    transform: (value: string) => sanitizeEncoding(value),
  });

  if (parsed.errors.length > 0 && parsed.data.length === 0) {
    throw new Error("Não foi possível ler o arquivo CSV. Verifique a formatação.");
  }

  const rows: { rowIndex: number; data: RawCsvRow }[] = [];
  let ignoredEmptyRows = 0;

  parsed.data.forEach((item, index) => {
    // Linha real no arquivo (considerando que a linha 1 é o cabeçalho)
    const rowIndex = index + 2;

    const name = item.name?.trim() || "";
    const phone = item.phone?.trim() || "";
    const email = item.email?.trim() || "";
    const address = item.address?.trim() || "";

    // Se a linha não tiver nenhum campo com texto, contabiliza como vazia
    if (!name && !phone && !email && !address) {
      ignoredEmptyRows++;
      return;
    }

    rows.push({
      rowIndex,
      data: {
        name,
        phone,
        email,
        address,
      },
    });
  });

  return { rows, ignoredEmptyRows };
}