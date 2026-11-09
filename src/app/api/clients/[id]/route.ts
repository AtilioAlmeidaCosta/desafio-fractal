
import { NextResponse } from "next/server";
import mongoose from "mongoose";

import connectMongoDB from "@/lib/mongodb";
import Client from "@/models/Client";
import { clientSchema } from "@/validators/client";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function PUT(
  request: Request,
  { params }: RouteParams
) {
  try {
    await connectMongoDB();

    const { id } = await params;

    // Verifica se o identificador possui formato válido.
    if (!mongoose.isValidObjectId(id)) {
      return NextResponse.json(
        {
          success: false,
          message: "Identificador de cliente inválido.",
        },
        { status: 400 }
      );
    }

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

    // Atualiza somente com os dados aprovados pela validação.
    const updatedClient = await Client.findByIdAndUpdate(
      id,
      validation.data,
      {
        new: true,
        runValidators: true,
      }
    );

    if (!updatedClient) {
      return NextResponse.json(
        {
          success: false,
          message: "Cliente não encontrado.",
        },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "Cliente atualizado com sucesso.",
        data: updatedClient,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Erro ao atualizar cliente:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Erro ao atualizar cliente.",
      },
      { status: 500 }
    );
  }
}
