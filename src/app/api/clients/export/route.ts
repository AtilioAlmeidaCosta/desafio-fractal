import { NextResponse } from "next/server";
import Papa from "papaparse";
import connectToDatabase from "@/lib/mongodb";
import Client from "@/models/Client";

export async function GET() {
  try {
    await connectToDatabase();

    const clients = await Client.find({}, { name: 1, phone: 1, email: 1, address: 1, _id: 0 })
      .sort({ createdAt: -1 })
      .lean();

    const formattedData = clients.map((c) => ({
      Nome: c.name,
      Telefone: c.phone,
      Email: c.email,
      Endereço: c.address,
    }));

    // Converte os objetos para texto CSV RFC 4180
    const csvString = Papa.unparse(formattedData);

    // O caractere \uFEFF (Byte Order Mark) força o Excel a interpretar nativamente como UTF-8
    const csvWithBom = "\uFEFF" + csvString;

    const fileName = `clientes_cadastrados_${new Date().toISOString().slice(0, 10)}.csv`;

    return new NextResponse(csvWithBom, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${fileName}"`,
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : "Erro ao exportar clientes.",
      },
      { status: 500 }
    );
  }
}