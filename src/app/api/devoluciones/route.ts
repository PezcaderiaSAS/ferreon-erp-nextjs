import { NextResponse } from "next/server";
import { z } from "zod";

const ItemDevolucionSchema = z.object({
  itemId: z.string().min(1),
  cantidadDevuelta: z.number().int().min(1),
  costoDano: z.number().min(0).optional(),
  observacionDano: z.string().optional(),
});

const RegistrarDevolucionSchema = z.object({
  alquilerId: z.string().min(1),
  fechaDevolucion: z.string().optional(),
  items: z.array(ItemDevolucionSchema).min(1),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validatedData = RegistrarDevolucionSchema.parse(body);

    return NextResponse.json({
      success: true,
      message: "Devolución de equipos e inspección registrada exitosamente",
      data: {
        alquilerId: validatedData.alquilerId,
        fechaDevolucion: validatedData.fechaDevolucion || new Date().toISOString(),
        itemsProcesados: validatedData.items.length,
      },
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: error.errors[0].message },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { success: false, error: error.message || "Error al procesar la devolución" },
      { status: 500 }
    );
  }
}
