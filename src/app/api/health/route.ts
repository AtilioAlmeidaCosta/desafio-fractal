
import { NextResponse } from "next/server";
import connectMongoDB from "@/lib/mongodb";
import mongoose from "mongoose";

export async function GET() {
  try {
    await connectMongoDB();

    return NextResponse.json({
      success: true,
      message: "Conexão com MongoDB estabelecida!",
      database: mongoose.connection.name,
      status: mongoose.connection.readyState,
    });
  } catch (error) {
    console.error("Erro na conexão com MongoDB:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Falha ao conectar com MongoDB.",
      },
      { status: 500 }
    );
  }
}
