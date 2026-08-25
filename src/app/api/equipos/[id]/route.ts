import { NextResponse } from "next/server";
import { z } from "zod";
import { redis } from "@/lib/redis";
import { createServerSupabaseClient } from "@/infrastructure/persistence/supabase/server";

const EditarEquipoSchema = z.object({
  codigo: z.string().min(2).optional(),
  nombre: z.string().min(2).optional(),
  categoria: z.string().optional(),
  tarifaDiaria: z.number().min(0).optional(),
  stockTotal: z.number().int().min(0).optional(),
  estado: z.enum(["Activo", "Inactivo"]).optional(),
});

const CACHE_KEY = "cache:equipos";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createServerSupabaseClient();
    const { data: equipo, error } = await supabase
      .from("equipos")
      .select("*")
      .eq("id", params.id)
      .single();

    if (error) throw error;
    if (!equipo || equipo.deleted_at) {
      return NextResponse.json({ success: false, error: "Equipo no encontrado" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: equipo,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: "Error interno" }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const validatedData = EditarEquipoSchema.parse(body);

    const updateData: any = {
      updated_at: new Date().toISOString(),
    };

    if (validatedData.codigo) updateData.codigo = validatedData.codigo.trim().toUpperCase();
    if (validatedData.nombre) updateData.nombre = validatedData.nombre.trim().toUpperCase();
    if (validatedData.categoria) updateData.categoria = validatedData.categoria.trim().toUpperCase();
    if (validatedData.tarifaDiaria !== undefined) updateData.tarifa_diaria = validatedData.tarifaDiaria;
    if (validatedData.stockTotal !== undefined) {
      // Nota: Si se cambia el stock_total, la lógica de balanceo debería revisar si afecta disponible.
      // Por ahora se actualiza directo el stock_total, asumimos que stock_disponible se ajusta.
      updateData.stock_total = validatedData.stockTotal;
      // Una lógica más robusta recalcularía stock_disponible = stock_total - stock_en_obra - stock_mantenimiento
    }
    if (validatedData.estado) updateData.estado = validatedData.estado;

    const supabase = createServerSupabaseClient();
    const { data, error } = await supabase
      .from("equipos")
      .update(updateData)
      .eq("id", params.id)
      .is("deleted_at", null)
      .select()
      .single();

    if (error) {
      if (error.code === "23505") {
        throw new Error("Ya existe un equipo con este código");
      }
      throw error;
    }

    if (redis) await redis.del(CACHE_KEY);

    return NextResponse.json({
      success: true,
      data,
      message: "Equipo de bodega actualizado correctamente",
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ success: false, error: error.errors[0].message }, { status: 400 });
    }
    return NextResponse.json({ success: false, error: error.message || "Error al actualizar" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createServerSupabaseClient();
    
    // Verificar si el equipo tiene stock_en_obra antes de borrar
    const { data: equipo } = await supabase
      .from("equipos")
      .select("stock_en_obra")
      .eq("id", params.id)
      .single();

    if (equipo && equipo.stock_en_obra > 0) {
      return NextResponse.json({ 
        success: false, 
        error: `No se puede eliminar el equipo porque tiene ${equipo.stock_en_obra} unidades en obra.` 
      }, { status: 400 });
    }

    // Soft delete: setear deleted_at y estado
    const { error } = await supabase
      .from("equipos")
      .update({ 
        deleted_at: new Date().toISOString(),
        estado: 'Inactivo'
      })
      .eq("id", params.id);

    if (error) throw error;

    if (redis) await redis.del(CACHE_KEY);

    return NextResponse.json({
      success: true,
      message: "Equipo inactivado correctamente de la bodega",
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || "Error al eliminar" }, { status: 500 });
  }
}
