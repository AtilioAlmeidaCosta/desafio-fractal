import type { ClientInput } from "./client";

export interface RawCsvRow {
  name?: string;
  phone?: string;
  email?: string;
  address?: string;
  [key: string]: string | undefined;
}

export interface PendingClientRecord {
  rowIndex: number;
  data: Partial<ClientInput>;
  errors: Record<string, string[]>;
}

export interface DuplicateClientRecord {
  rowIndex: number;
  data: ClientInput;
  reason: "already_registered" | "csv_duplicate";
}

export interface ValidClientRecord {
  rowIndex: number;
  data: ClientInput;
}

export interface ImportAnalysisResult {
  totalRows: number;
  valid: ValidClientRecord[];
  pending: PendingClientRecord[];
  duplicates: DuplicateClientRecord[];
  ignoredEmptyRows: number;
}