import { NextResponse } from "next/server";
import { z } from "zod";

const CrearClienteSchema = z.object({
  nitCedula: z.string().min(3, "La identificación debe contener al menos 3 caracteres"),
  nombre: z.string().min(2, "El nombre o razón social debe contener al menos 2 caracteres"),
  telefono: z.string().optional(),
  email: z.string().email("Formato de correo electrónico inválido").optional().or(z.literal("")),
  direccion: z.string().optional(),
});

export async function GET() {
  return NextResponse.json({
    success: true,
    data: [],
    message: "Directorio de clientes obtenido correctamente",
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validatedData = CrearClienteSchema.parse(body);

    const clienteSimulado = {
      id: "CLI-" + Date.now(),
      nitCedula: validatedData.nitCedula.trim().toUpperCase(),
      nombre: validatedData.nombre.trim().toUpperCase(),
      telefono: validatedData.telefono,
      email: validatedData.email ? validatedData.email.trim().toLowerCase() : undefined,
      direccion: validatedData.direccion,
      activo: true,
      createdAt: new Date().toISOString(),
    };

    return NextResponse.json(
      {
        success: true,
        data: clienteSimulado,
        message: "Cliente registrado exitosamente",
      },
      { status: 201 }
    );
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: error.errors[0].message },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { success: false, error: error.message || "Error al procesar la solicitud" },
      { status: 500 }
    );
  }
}
