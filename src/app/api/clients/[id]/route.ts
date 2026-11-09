
import { NextResponse } from "next/server";
import mongoose from "mongoose";
import connectMongoDB from "@/lib/mongodb";
import Client from "@/models/Client";

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

    const { name, phone, email, address } = body;

    if (
      typeof name !== "string" ||
      typeof phone !== "string" ||
      typeof email !== "string" ||
      typeof address !== "string" ||
      !name.trim() ||
      !phone.trim() ||
      !email.trim() ||
      !address.trim()
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Todos os campos são obrigatórios.",
        },
        { status: 400 }
      );
    }

    const updatedClient = await Client.findByIdAndUpdate(
      id,
      {
        name: name.trim(),
        phone: phone.trim(),
        email: email.trim().toLowerCase(),
        address: address.trim(),
      },
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
