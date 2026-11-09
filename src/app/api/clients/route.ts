
import { NextResponse } from "next/server";
import connectMongoDB from "@/lib/mongodb";
import Client from "@/models/Client";

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

    const { name, phone, email, address } = body;

    if (!name || !phone || !email || !address) {
      return NextResponse.json(
        {
          success: false,
          message: "Todos os campos são obrigatórios.",
        },
        { status: 400 }
      );
    }

    const client = await Client.create({
      name,
      phone,
      email,
      address,
    });

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
