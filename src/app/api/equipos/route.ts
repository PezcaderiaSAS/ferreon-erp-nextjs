import { NextResponse } from "next/server";
import { z } from "zod";
import { redis } from "@/lib/redis";
import { createServerSupabaseClient } from "@/infrastructure/persistence/supabase/server";

const CrearEquipoSchema = z.object({
  codigo: z.string().min(2, "El código debe tener al menos 2 caracteres"),
  nombre: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  categoria: z.string().default("GENERAL"),
  tarifaDiaria: z.number().min(0, "La tarifa debe ser mayor o igual a 0"),
  stockTotal: z.number().int().min(1, "El stock total debe ser al menos 1"),
});

const CargaMasivaSchema = z.object({
  equipos: z.array(CrearEquipoSchema).min(1, "Debe incluir al menos un equipo"),
});

const CACHE_KEY = "cache:equipos";

export async function GET() {
  try {
    if (redis) {
      const cached = await redis.get(CACHE_KEY);
      if (cached) {
        return NextResponse.json({
          success: true,
          data: typeof cached === "string" ? JSON.parse(cached) : cached,
          message: "Catálogo de bodega obtenido desde caché",
        });
      }
    }

    const supabase = createServerSupabaseClient();
    const { data, error } = await supabase
      .from("equipos")
      .select("*")
      .is("deleted_at", null)
      .order("nombre", { ascending: true });

    if (error) throw error;

    if (redis && data) {
      await redis.set(CACHE_KEY, JSON.stringify(data), { ex: 3600 });
    }

    return NextResponse.json({
      success: true,
      data: data || [],
      message: "Catálogo de bodega obtenido desde DB",
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Error al obtener equipos" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const supabase = createServerSupabaseClient();

    if (body.equipos && Array.isArray(body.equipos)) {
      const validatedData = CargaMasivaSchema.parse(body);
      
      const insertData = validatedData.equipos.map(item => ({
        codigo: item.codigo.trim().toUpperCase(),
        nombre: item.nombre.trim().toUpperCase(),
        categoria: item.categoria.trim().toUpperCase(),
        tarifa_diaria: item.tarifaDiaria,
        stock_total: item.stockTotal,
        stock_disponible: item.stockTotal,
        stock_en_obra: 0,
        stock_mantenimiento: 0,
        estado: 'Activo'
      }));

      const { data, error } = await supabase
        .from("equipos")
        .insert(insertData)
        .select();

      if (error) throw error;

      if (redis) await redis.del(CACHE_KEY);

      return NextResponse.json(
        {
          success: true,
          data,
          message: `${data.length} equipos importados masivamente a bodega`,
        },
        { status: 201 }
      );
    } else {
      const validatedData = CrearEquipoSchema.parse(body);
      
      const { data, error } = await supabase
        .from("equipos")
        .insert([{
          codigo: validatedData.codigo.trim().toUpperCase(),
          nombre: validatedData.nombre.trim().toUpperCase(),
          categoria: validatedData.categoria.trim().toUpperCase(),
          tarifa_diaria: validatedData.tarifaDiaria,
          stock_total: validatedData.stockTotal,
          stock_disponible: validatedData.stockTotal,
          stock_en_obra: 0,
          stock_mantenimiento: 0,
          estado: 'Activo'
        }])
        .select()
        .single();

      if (error) {
        if (error.code === "23505") {
          throw new Error("Ya existe un equipo con este código");
        }
        throw error;
      }

      if (redis) await redis.del(CACHE_KEY);

      return NextResponse.json(
        {
          success: true,
          data,
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
