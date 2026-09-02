import { NextResponse } from "next/server";
import { z } from "zod";
import { getTenantCache, setTenantCache, invalidateTenantCache } from "@/lib/redis";
import { createServerSupabaseClient } from "@/infrastructure/persistence/supabase/server";

export const dynamic = 'force-dynamic';

const EditarClienteSchema = z.object({
  nitCedula: z.string().min(3).optional(),
  nombre: z.string().min(2).optional(),
  telefono: z.string().optional().nullable(),
  email: z.string().email().optional().or(z.literal("")).nullable(),
  direccion: z.string().optional().nullable(),
  estado: z.enum(["Activo", "Inactivo"]).optional(),
});

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    const tenantId = user?.id || 'default';

    // 1. Lectura en Caché Multi-Tenant
    const cachedData = await getTenantCache<any>(tenantId, 'clientes', params.id);
    if (cachedData) {
      return NextResponse.json({
        success: true,
        data: cachedData,
      });
    }

    const { data: cliente, error } = await supabase
      .from("clientes")
      .select("*")
      .eq("id", params.id)
      .single();

    if (error) throw error;
    if (!cliente || cliente.deleted_at) {
      return NextResponse.json({ success: false, error: "Cliente no encontrado" }, { status: 404 });
    }

    const result = {
      cliente,
      alquileres: [],
      pagos: [],
      cartera: { totalFacturado: 0, totalPagado: 0, saldoPendiente: 0 },
    };

    // Guardar en Caché Multi-Tenant
    await setTenantCache(tenantId, 'clientes', result, 3600, params.id);

    return NextResponse.json({
      success: true,
      data: result,
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
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    const tenantId = user?.id || 'default';

    const body = await request.json();
    const validatedData = EditarClienteSchema.parse(body);

    const updateData: any = {
      updated_at: new Date().toISOString(),
    };

    if (validatedData.nitCedula) updateData.nit_cedula = validatedData.nitCedula.trim().toUpperCase();
    if (validatedData.nombre) updateData.nombre = validatedData.nombre.trim().toUpperCase();
    if (validatedData.telefono !== undefined) updateData.telefono = validatedData.telefono || null;
    if (validatedData.email !== undefined) updateData.email = validatedData.email ? validatedData.email.trim().toLowerCase() : null;
    if (validatedData.direccion !== undefined) updateData.direccion = validatedData.direccion || null;
    if (validatedData.estado) updateData.estado = validatedData.estado;

    const { data, error } = await supabase
      .from("clientes")
      .update(updateData)
      .eq("id", params.id)
      .is("deleted_at", null)
      .select()
      .single();

    if (error) {
      if (error.code === "23505") {
        throw new Error("Ya existe un cliente con esta identificación");
      }
      throw error;
    }

    // Invalidar caché del tenant
    await invalidateTenantCache(tenantId, ['clientes', 'alquileres'], params.id);

    return NextResponse.json({
      success: true,
      data,
      message: "Datos del cliente actualizados correctamente",
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
    
    // Soft delete: setear deleted_at
    const { error } = await supabase
      .from("clientes")
      .update({ 
        deleted_at: new Date().toISOString(),
        estado: 'Inactivo'
      })
      .eq("id", params.id);

    if (error) throw error;

    // Invalidar caché del tenant
    await invalidateTenantCache(tenantId, ['clientes', 'alquileres'], params.id);

    return NextResponse.json({
      success: true,
      message: "Cliente eliminado (Soft Delete) correctamente",
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || "Error al eliminar" }, { status: 500 });
  }
}
