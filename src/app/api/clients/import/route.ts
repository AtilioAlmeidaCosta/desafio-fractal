import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import Client from "@/models/Client";
import { clientSchema } from "@/validators/client";
import { parseClientsCsv } from "@/lib/csv/parser";
import type {
  ImportAnalysisResult,
  ValidClientRecord,
  PendingClientRecord,
  DuplicateClientRecord,
} from "@/types/import";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { success: false, message: "Nenhum arquivo foi enviado." },
        { status: 400 }
      );
    }

    if (!file.name.toLowerCase().endsWith(".csv")) {
      return NextResponse.json(
        { success: false, message: "O arquivo enviado deve ter extensão .csv." },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { success: false, message: "O arquivo excede o limite máximo permitido de 5MB." },
        { status: 400 }
      );
    }

    // Leitura direta do buffer como texto UTF-8
    const arrayBuffer = await file.arrayBuffer();
    const decoder = new TextDecoder("utf-8");
    const csvContent = decoder.decode(arrayBuffer);

    const { rows, ignoredEmptyRows } = parseClientsCsv(csvContent);

    if (rows.length === 0) {
      return NextResponse.json(
        { success: false, message: "O arquivo CSV não possui registros válidos." },
        { status: 400 }
      );
    }

    await connectToDatabase();

    // 1. Coleta de e-mails para verificação em lote no MongoDB
    const candidateEmails = rows
      .map((r) => r.data.email?.trim().toLowerCase())
      .filter((email): email is string => Boolean(email && email.includes("@")));

    const existingClients = await Client.find(
      { email: { $in: candidateEmails } },
      { email: 1 }
    ).lean();

    const registeredEmailSet = new Set(
      existingClients.map((client) => client.email.toLowerCase())
    );

    // 2. Classificação dos registros
    const valid: ValidClientRecord[] = [];
    const pending: PendingClientRecord[] = [];
    const duplicates: DuplicateClientRecord[] = [];

    const seenEmailsInCsv = new Set<string>();

    for (const row of rows) {
      const emailLower = (row.data.email || "").trim().toLowerCase();

      // Checagem de duplicação com registros já existentes no MongoDB
      if (emailLower && registeredEmailSet.has(emailLower)) {
        duplicates.push({
          rowIndex: row.rowIndex,
          data: {
            name: row.data.name || "",
            phone: row.data.phone || "",
            email: emailLower,
            address: row.data.address || "",
          },
          reason: "already_registered",
        });
        continue;
      }

      // Checagem de duplicação interna dentro do próprio CSV
      if (emailLower && seenEmailsInCsv.has(emailLower)) {
        duplicates.push({
          rowIndex: row.rowIndex,
          data: {
            name: row.data.name || "",
            phone: row.data.phone || "",
            email: emailLower,
            address: row.data.address || "",
          },
          reason: "csv_duplicate",
        });
        continue;
      }

      // Validação completa dos campos usando o Zod
      const parseResult = clientSchema.safeParse({
        name: row.data.name,
        phone: row.data.phone,
        email: emailLower,
        address: row.data.address,
      });

      if (parseResult.success) {
        if (emailLower) {
          seenEmailsInCsv.add(emailLower);
        }
        valid.push({
          rowIndex: row.rowIndex,
          data: parseResult.data,
        });
      } else {
        // Mapeia erros do Zod no formato { campo: ["mensagem 1", ...] }
        const fieldErrors = parseResult.error.flatten().fieldErrors;
        pending.push({
          rowIndex: row.rowIndex,
          data: {
            name: row.data.name || "",
            phone: row.data.phone || "",
            email: row.data.email || "",
            address: row.data.address || "",
          },
          errors: fieldErrors,
        });
      }
    }

    const responseData: ImportAnalysisResult = {
      totalRows: rows.length,
      valid,
      pending,
      duplicates,
      ignoredEmptyRows,
    };

    return NextResponse.json({
      success: true,
      data: responseData,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Erro inesperado ao analisar o arquivo CSV.",
      },
      { status: 500 }
    );
  }
}