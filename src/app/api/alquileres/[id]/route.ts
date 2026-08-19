import { NextResponse } from "next/server";
import { z } from "zod";

const ActualizarAlquilerSchema = z.object({
  estado: z.enum(["COTIZACION", "ACTIVO", "FINALIZADO", "CANCELADO"]).optional(),
  garantiaEstado: z.string().optional(),
  observaciones: z.string().optional(),
});

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  return NextResponse.json({
    success: true,
    data: {
      id: params.id,
      consecutivo: 101,
      clienteId: "CLI-001",
      clienteNombre: "CONSTRUCCIONES & OBRAS ARQUITECTÓNICAS SAS",
      estado: "ACTIVO",
      subtotal: 270000,
      total: 170000,
      deposito: 100000,
      garantiaMonto: 500000,
      garantiaTipo: "Efectivo",
      garantiaEstado: "Activa",
      detalles: [],
      createdAt: new Date().toISOString(),
    },
  });
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const validatedData = ActualizarAlquilerSchema.parse(body);

    return NextResponse.json({
      success: true,
      data: {
        id: params.id,
        ...validatedData,
        updatedAt: new Date().toISOString(),
      },
      message: `Contrato ${params.id} actualizado correctamente`,
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: error.errors[0].message },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { success: false, error: error.message || "Error al actualizar el contrato" },
      { status: 500 }
    );
  }
}
