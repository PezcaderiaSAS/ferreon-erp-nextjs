import { NextResponse } from "next/server";
import { getTenantCache, setTenantCache, invalidateTenantCache } from "@/lib/redis";
import { createServerSupabaseClient } from "@/infrastructure/persistence/supabase/server";
import { EquipoSchema, EditarEquipoSchema } from "@/infrastructure/dtos/equipo.dto";
import { z } from "zod";

export const dynamic = 'force-dynamic';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    const tenantId = user?.id || 'default';

    // 1. Lectura en Caché Multi-Tenant
    const cachedData = await getTenantCache<any>(tenantId, 'equipos', params.id);
    if (cachedData) {
      return NextResponse.json({
        success: true,
        data: cachedData,
        message: "Equipo obtenido desde caché (Hit)",
      });
    }

    // 2. Consulta DB
    const { data, error } = await supabase
      .from("equipos")
      .select("*")
      .eq("id", params.id)
      .is("deleted_at", null)
      .single();

    if (error || !data) {
      return NextResponse.json(
        { success: false, error: "Equipo no encontrado" },
        { status: 404 }
      );
    }

    const parsed = EquipoSchema.safeParse(data);
    const validatedData = parsed.success ? parsed.data : data;

    // 3. Guardar en Caché Multi-Tenant
    await setTenantCache(tenantId, 'equipos', validatedData, 3600, params.id);

    return NextResponse.json({
      success: true,
      data: validatedData,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Error interno del servidor" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    const tenantId = user?.id || 'default';

    const body = await request.json();
    const parsed = EditarEquipoSchema.parse(body);

    const updateData: any = {
      ...parsed,
      updated_at: new Date().toISOString(),
    };

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

    // Invalidar caché del catálogo completo y del ítem individual
    await invalidateTenantCache(tenantId, ['equipos'], params.id);

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
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    const tenantId = user?.id || 'default';
    
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

    // Invalidar caché
    await invalidateTenantCache(tenantId, ['equipos'], params.id);

    return NextResponse.json({
      success: true,
      message: "Equipo inactivado correctamente de la bodega",
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || "Error al eliminar" }, { status: 500 });
  }
}
