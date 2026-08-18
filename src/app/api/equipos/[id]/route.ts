import { NextResponse } from "next/server";
import { z } from "zod";

const EditarEquipoSchema = z.object({
  codigo: z.string().min(2),
  nombre: z.string().min(2),
  categoria: z.string(),
  tarifaDiaria: z.number().min(0),
  pesoKilos: z.number().min(0),
  stockTotal: z.number().int().min(0),
  activo: z.boolean().optional(),
});

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const validatedData = EditarEquipoSchema.parse(body);

    const equipoActualizado = {
      id: params.id,
      codigo: validatedData.codigo.trim().toUpperCase(),
      nombre: validatedData.nombre.trim().toUpperCase(),
      categoria: validatedData.categoria.trim().toUpperCase(),
      tarifaDiaria: validatedData.tarifaDiaria,
      pesoKilos: validatedData.pesoKilos,
      stockTotal: validatedData.stockTotal,
      activo: validatedData.activo ?? true,
      updatedAt: new Date().toISOString(),
    };

    return NextResponse.json({
      success: true,
      data: equipoActualizado,
      message: "Equipo de bodega actualizado correctamente",
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: error.errors[0].message },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { success: false, error: error.message || "Error al actualizar el equipo" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  return NextResponse.json({
    success: true,
    message: `Equipo ${params.id} inactivado correctamente de la bodega`,
  });
}
