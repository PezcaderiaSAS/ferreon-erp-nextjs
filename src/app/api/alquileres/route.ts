import { NextResponse } from "next/server";
import { z } from "zod";

const ItemAlquilerSchema = z.object({
  itemId: z.string().min(1, "El ID del equipo es obligatorio"),
  nombreItem: z.string().optional(),
  cantidad: z.number().int().min(1, "La cantidad debe ser mayor a cero"),
  tarifaAplicada: z.number().min(0, "La tarifa debe ser mayor o igual a cero"),
  pesoKilos: z.number().min(0).optional(),
  diasContratados: z.number().int().min(1, "Los días contratados deben ser al menos 1"),
  fechaInicio: z.string().optional(),
  fechaFin: z.string().optional(),
});

const CrearAlquilerSchema = z.object({
  clienteId: z.string().min(1, "El cliente es obligatorio"),
  clienteNombre: z.string().optional(),
  estado: z.enum(["COTIZACION", "ACTIVO", "FINALIZADO", "CANCELADO"]).default("ACTIVO"),
  fleteEntrega: z.number().min(0).default(0),
  fleteRecogida: z.number().min(0).default(0),
  deposito: z.number().min(0).default(0),
  garantiaMonto: z.number().min(0).default(0),
  garantiaTipo: z.string().default("Efectivo"),
  observaciones: z.string().optional(),
  detallesLogistica: z.string().optional(),
  items: z.array(ItemAlquilerSchema).min(1, "Debe incluir al menos un equipo en el contrato"),
});

export async function GET() {
  return NextResponse.json({
    success: true,
    data: [],
    message: "Listado de alquileres obtenido correctamente",
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validatedData = CrearAlquilerSchema.parse(body);

    const subtotalEquipos = validatedData.items.reduce(
      (acc, item) => acc + item.cantidad * item.tarifaAplicada * item.diasContratados,
      0
    );
    const totalFletes = validatedData.fleteEntrega + validatedData.fleteRecogida;
    const subtotalGeneral = subtotalEquipos + totalFletes;
    const total = Math.max(0, subtotalGeneral - validatedData.deposito);
    const totalPesoKilos = validatedData.items.reduce(
      (acc, item) => acc + item.cantidad * (item.pesoKilos || 0),
      0
    );

    const nuevoAlquiler = {
      id: "ALQ-" + Date.now(),
      consecutivo: Math.floor(Math.random() * 900) + 100,
      clienteId: validatedData.clienteId,
      clienteNombre: validatedData.clienteNombre,
      estado: validatedData.estado,
      subtotalEquipos,
      fleteEntrega: validatedData.fleteEntrega,
      fleteRecogida: validatedData.fleteRecogida,
      subtotalGeneral,
      total,
      deposito: validatedData.deposito,
      garantiaMonto: validatedData.garantiaMonto,
      garantiaTipo: validatedData.garantiaTipo,
      garantiaEstado: "Activa",
      totalPesoKilos,
      observaciones: validatedData.observaciones,
      detallesLogistica: validatedData.detallesLogistica,
      detalles: validatedData.items.map((item, idx) => ({
        id: "DET-" + (Date.now() + idx),
        itemId: item.itemId,
        nombreItem: item.nombreItem,
        cantidad: item.cantidad,
        tarifaAplicada: item.tarifaAplicada,
        pesoKilos: item.pesoKilos,
        diasContratados: item.diasContratados,
        subtotalLinea: item.cantidad * item.tarifaAplicada * item.diasContratados,
        costoDano: 0,
        devuelto: false,
        fechaInicio: item.fechaInicio || new Date().toISOString(),
      })),
      createdAt: new Date().toISOString(),
    };

    return NextResponse.json(
      {
        success: true,
        data: nuevoAlquiler,
        message: "Contrato de alquiler registrado exitosamente",
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
      { success: false, error: error.message || "Error al registrar el contrato de alquiler" },
      { status: 500 }
    );
  }
}
