import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import connectToDatabase from "@/lib/mongodb";
import Client from "@/models/Client";
import { clientSchema } from "@/validators/client";

const confirmPayloadSchema = z.object({
  clients: z.array(clientSchema).min(1, "Nenhum cliente para importar."),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parseResult = confirmPayloadSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        {
          success: false,
          message: "Dados inválidos fornecidos para cadastro.",
          errors: parseResult.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const { clients } = parseResult.data;

    await connectToDatabase();

    // Verificação de segurança contra concorrência/duplicidade de e-mails
    const emails = clients.map((c) => c.email);
    const existing = await Client.find(
      { email: { $in: emails } },
      { email: 1 }
    ).lean();

    const existingSet = new Set(existing.map((c) => c.email.toLowerCase()));
    const finalToInsert = clients.filter(
      (c) => !existingSet.has(c.email.toLowerCase())
    );

    if (finalToInsert.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Todos os clientes enviados já se encontram cadastrados.",
        },
        { status: 409 }
      );
    }

    // Inserção em lote usando insertMany
    const result = await Client.insertMany(finalToInsert, { ordered: false });

    return NextResponse.json({
      success: true,
      message: `${result.length} clientes importados com sucesso.`,
      count: result.length,
      skippedExisting: clients.length - finalToInsert.length,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Erro inesperado ao salvar os clientes.",
      },
      { status: 500 }
    );
  }
}