import { NextResponse } from "next/server";
import { z } from "zod";

const EditarClienteSchema = z.object({
  nitCedula: z.string().min(3),
  nombre: z.string().min(2),
  telefono: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  direccion: z.string().optional(),
  activo: z.boolean().optional(),
});

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const clienteId = params.id;

  const historialSimulado = {
    cliente: {
      id: clienteId,
      nitCedula: "900123456-1",
      nombre: "CONSTRUCCIONES & OBRAS EJEMPLO SAS",
      telefono: "3001234567",
      email: "contacto@obras.com",
      direccion: "Calle 100 # 15-20, Bogotá",
      activo: true,
      createdAt: new Date().toISOString(),
    },
    alquileres: [],
    pagos: [],
    cartera: {
      totalFacturado: 0,
      totalPagado: 0,
      saldoPendiente: 0,
    },
  };

  return NextResponse.json({
    success: true,
    data: historialSimulado,
  });
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const validatedData = EditarClienteSchema.parse(body);

    const clienteActualizado = {
      id: params.id,
      nitCedula: validatedData.nitCedula.trim().toUpperCase(),
      nombre: validatedData.nombre.trim().toUpperCase(),
      telefono: validatedData.telefono,
      email: validatedData.email ? validatedData.email.trim().toLowerCase() : undefined,
      direccion: validatedData.direccion,
      activo: validatedData.activo ?? true,
      updatedAt: new Date().toISOString(),
    };

    return NextResponse.json({
      success: true,
      data: clienteActualizado,
      message: "Datos del cliente actualizados correctamente",
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: error.errors[0].message },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { success: false, error: error.message || "Error al actualizar el cliente" },
      { status: 500 }
    );
  }
}
