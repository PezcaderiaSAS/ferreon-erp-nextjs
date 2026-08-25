import { NextResponse } from "next/server";
import { z } from "zod";
import { redis } from "@/lib/redis";
import { createServerSupabaseClient } from "@/infrastructure/persistence/supabase/server";

const ActualizarAlquilerSchema = z.object({
  estado: z.enum(["COTIZACION", "ACTIVO", "FINALIZADO", "CANCELADO"]).optional(),
  garantiaEstado: z.string().optional(),
  observaciones: z.string().optional(),
});

const CACHE_KEY = "cache:alquileres";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createServerSupabaseClient();
    const { data: alquiler, error } = await supabase
      .from("alquileres")
      .select(`
        *,
        clientes ( nombre, nit_cedula ),
        alquiler_detalles ( * )
      `)
      .eq("id", params.id)
      .single();

    if (error) throw error;
    if (!alquiler || alquiler.deleted_at) {
      return NextResponse.json({ success: false, error: "Alquiler no encontrado" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: alquiler,
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
    const validatedData = ActualizarAlquilerSchema.parse(body);

    const updateData: any = {
      updated_at: new Date().toISOString(),
    };

    if (validatedData.estado) updateData.estado = validatedData.estado;
    if (validatedData.garantiaEstado) updateData.garantia_estado = validatedData.garantiaEstado;
    if (validatedData.observaciones !== undefined) updateData.observaciones = validatedData.observaciones || null;

    const supabase = createServerSupabaseClient();
    const { data, error } = await supabase
      .from("alquileres")
      .update(updateData)
      .eq("id", params.id)
      .is("deleted_at", null)
      .select()
      .single();

    if (error) throw error;

    // TODO: Si el estado cambia a FINALIZADO o CANCELADO, habría que devolver el stock.
    // Esta lógica compleja se puede manejar aquí o en un endpoint específico de devolución.

    if (redis) await redis.del(CACHE_KEY);

    return NextResponse.json({
      success: true,
      data,
      message: `Contrato actualizado correctamente`,
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
    
    // Obtener detalles para devolver el stock
    const { data: detalles } = await supabase
      .from("alquiler_detalles")
      .select("equipo_id, cantidad")
      .eq("alquiler_id", params.id);

    // Soft delete: setear deleted_at y estado = CANCELADO
    const { error } = await supabase
      .from("alquileres")
      .update({ 
        deleted_at: new Date().toISOString(),
        estado: 'CANCELADO'
      })
      .eq("id", params.id);

    if (error) throw error;

    // Restaurar stock de los equipos (si aplica)
    if (detalles && detalles.length > 0) {
      for (const det of detalles) {
        const { data: eq } = await supabase
          .from("equipos")
          .select("stock_disponible, stock_en_obra")
          .eq("id", det.equipo_id)
          .single();

        if (eq && eq.stock_en_obra >= det.cantidad) {
          await supabase.from("equipos")
            .update({
              stock_disponible: eq.stock_disponible + det.cantidad,
              stock_en_obra: eq.stock_en_obra - det.cantidad,
            })
            .eq("id", det.equipo_id);
        }
      }
      if (redis) await redis.del("cache:equipos");
    }

    if (redis) await redis.del(CACHE_KEY);

    return NextResponse.json({
      success: true,
      message: "Contrato de alquiler inactivado (cancelado) correctamente",
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || "Error al eliminar" }, { status: 500 });
  }
}
