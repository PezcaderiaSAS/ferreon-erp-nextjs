import { NextResponse } from "next/server";
import { z } from "zod";

const CrearFacturaSchema = z.object({
  alquilerId: z.string().min(1),
  clienteId: z.string().min(1),
  clienteNombre: z.string().min(1),
  subtotal: z.number().min(0),
  costosDano: z.number().min(0).default(0),
  depositoAplicado: z.number().min(0).default(0),
  totalPagar: z.number().min(0),
  observaciones: z.string().optional(),
});

export async function GET() {
  return NextResponse.json({
    success: true,
    data: [],
    message: "Listado de facturas y cuentas de cobro emitidas",
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validatedData = CrearFacturaSchema.parse(body);

    const nuevaFactura = {
      id: "FAC-" + Date.now(),
      numeroConsecutivo: Math.floor(Math.random() * 9000) + 1000,
      tipoDocumento: "CUENTA_COBRO",
      alquilerId: validatedData.alquilerId,
      clienteId: validatedData.clienteId,
      clienteNombre: validatedData.clienteNombre,
      subtotal: validatedData.subtotal,
      costosDano: validatedData.costosDano,
      depositoAplicado: validatedData.depositoAplicado,
      totalPagar: validatedData.totalPagar,
      estadoPago: "EMITIDA",
      observaciones: validatedData.observaciones,
      createdAt: new Date().toISOString(),
    };

    return NextResponse.json(
      {
        success: true,
        data: nuevaFactura,
        message: "Cuenta de Cobro / Factura generada exitosamente",
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
      { success: false, error: error.message || "Error al generar la factura" },
      { status: 500 }
    );
  }
}
