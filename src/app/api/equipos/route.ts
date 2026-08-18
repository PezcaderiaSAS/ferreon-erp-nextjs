import { NextResponse } from "next/server";
import { z } from "zod";

const CrearEquipoSchema = z.object({
  codigo: z.string().min(2, "El código debe tener al menos 2 caracteres"),
  nombre: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  categoria: z.string().default("GENERAL"),
  tarifaDiaria: z.number().min(0, "La tarifa debe ser mayor o igual a 0"),
  pesoKilos: z.number().min(0, "El peso debe ser mayor o igual a 0"),
  stockTotal: z.number().int().min(1, "El stock total debe ser al menos 1"),
});

const CargaMasivaSchema = z.object({
  equipos: z.array(CrearEquipoSchema).min(1, "Debe incluir al menos un equipo"),
});

export async function GET() {
  return NextResponse.json({
    success: true,
    data: [],
    message: "Catálogo de bodega e inventario obtenido correctamente",
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Comprobar si es carga masiva o individual
    if (body.equipos && Array.isArray(body.equipos)) {
      const validatedData = CargaMasivaSchema.parse(body);
      const procesados = validatedData.equipos.map((item, idx) => ({
        id: "EQ-BULK-" + (Date.now() + idx),
        codigo: item.codigo.trim().toUpperCase(),
        nombre: item.nombre.trim().toUpperCase(),
        categoria: item.categoria.trim().toUpperCase(),
        tarifaDiaria: item.tarifaDiaria,
        pesoKilos: item.pesoKilos,
        stockTotal: item.stockTotal,
        stockDisponible: item.stockTotal,
        stockEnObra: 0,
        activo: true,
        createdAt: new Date().toISOString(),
      }));

      return NextResponse.json(
        {
          success: true,
          data: procesados,
          message: `${procesados.length} equipos importados masivamente a bodega`,
        },
        { status: 201 }
      );
    } else {
      // Registro individual
      const validatedData = CrearEquipoSchema.parse(body);
      const nuevoEquipo = {
        id: "EQ-" + Date.now(),
        codigo: validatedData.codigo.trim().toUpperCase(),
        nombre: validatedData.nombre.trim().toUpperCase(),
        categoria: validatedData.categoria.trim().toUpperCase(),
        tarifaDiaria: validatedData.tarifaDiaria,
        pesoKilos: validatedData.pesoKilos,
        stockTotal: validatedData.stockTotal,
        stockDisponible: validatedData.stockTotal,
        stockEnObra: 0,
        activo: true,
        createdAt: new Date().toISOString(),
      };

      return NextResponse.json(
        {
          success: true,
          data: nuevoEquipo,
          message: "Equipo registrado en bodega exitosamente",
        },
        { status: 201 }
      );
    }
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: error.errors[0].message },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { success: false, error: error.message || "Error al procesar el registro de equipos" },
      { status: 500 }
    );
  }
}
