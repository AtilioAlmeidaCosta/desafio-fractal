
import { NextResponse } from "next/server";
import connectMongoDB from "@/lib/mongodb";
import Client from "@/models/Client";
import { clientSchema } from "@/validators/client";

export async function GET() {
  try {
    await connectMongoDB();

    const clients = await Client.find().sort({ createdAt: -1 });

    return NextResponse.json(
      {
        success: true,
        data: clients,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Erro ao listar clientes:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Erro ao buscar clientes.",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    await connectMongoDB();

    const body = await request.json();

    // Valida os dados recebidos utilizando o schema do Zod.
    const validation = clientSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          message: "Dados inválidos. Verifique os campos informados.",
          errors: validation.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    // Salva somente os dados aprovados pela validação.
    const client = await Client.create(validation.data);

    return NextResponse.json(
      {
        success: true,
        message: "Cliente cadastrado com sucesso.",
        data: client,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Erro ao cadastrar cliente:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Erro ao cadastrar cliente.",
      },
      { status: 500 }
    );
  }
}
