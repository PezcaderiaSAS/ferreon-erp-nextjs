import { NextResponse } from "next/server";
import { z } from "zod";
import { getTenantCache, setTenantCache, invalidateTenantCache } from "@/lib/redis";
import { createServerSupabaseClient } from "@/infrastructure/persistence/supabase/server";

export const dynamic = 'force-dynamic';

const ItemAlquilerSchema = z.object({
  itemId: z.number().int().or(z.string()).transform(val => Number(val)),
  cantidad: z.number().int().min(1, "La cantidad debe ser mayor a cero"),
  tarifaAplicada: z.number().min(0, "La tarifa debe ser mayor o igual a cero"),
  diasContratados: z.number().int().min(1, "Los días contratados deben ser al menos 1"),
  fechaInicio: z.string().optional(),
  fechaFin: z.string().optional(),
});

const CrearAlquilerSchema = z.object({
  clienteId: z.number().int().or(z.string()).transform(val => Number(val)),
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
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    const tenantId = user?.id || 'default';

    // 1. Lectura en Caché Multi-Tenant (Read-Through)
    const cachedData = await getTenantCache<any[]>(tenantId, 'alquileres');
    if (cachedData) {
      return NextResponse.json({
        success: true,
        data: cachedData,
        message: "Listado de alquileres obtenido desde caché Multi-Tenant (Hit)",
      });
    }
    
    // 2. Consulta Base de Datos protegida por RLS (Miss)
    const { data, error } = await supabase
      .from("alquileres")
      .select(`
        *,
        clientes ( nombre, nit_cedula ),
        alquiler_detalles ( * )
      `)
      .is("deleted_at", null)
      .order("created_at", { ascending: false });

    if (error) throw error;

    // 3. Guardar en Caché Multi-Tenant (TTL 10 Minutos = 600s para datos dinámicos)
    if (data) {
      await setTenantCache(tenantId, 'alquileres', data, 600);
    }

    return NextResponse.json({
      success: true,
      data: data || [],
      message: "Listado de alquileres obtenido desde DB (Miss)",
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Error al obtener alquileres" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validatedData = CrearAlquilerSchema.parse(body);

    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    const tenantId = user?.id || 'default';

    const subtotalEquipos = validatedData.items.reduce(
      (acc, item) => acc + item.cantidad * item.tarifaAplicada * item.diasContratados,
      0
    );
    const totalFletes = validatedData.fleteEntrega + validatedData.fleteRecogida;
    const subtotalGeneral = subtotalEquipos + totalFletes;
    const total = Math.max(0, subtotalGeneral - validatedData.deposito);

    // 1. Insertar Cabecera
    const { data: cabecera, error: errorCabecera } = await supabase
      .from("alquileres")
      .insert([{
        cliente_id: validatedData.clienteId,
        estado: validatedData.estado,
        subtotal_equipos: subtotalEquipos,
        flete_entrega: validatedData.fleteEntrega,
        flete_recogida: validatedData.fleteRecogida,
        subtotal_general: subtotalGeneral,
        total: total,
        deposito: validatedData.deposito,
        garantia_monto: validatedData.garantiaMonto,
        garantia_tipo: validatedData.garantiaTipo,
        garantia_estado: "Activa",
        observaciones: validatedData.observaciones || null,
        detalles_logistica: validatedData.detallesLogistica || null,
        creado_por: user?.email || "SISTEMA",
      }])
      .select()
      .single();

    if (errorCabecera) throw errorCabecera;

    // 2. Insertar Detalles
    const detallesPayload = validatedData.items.map(item => ({
      alquiler_id: cabecera.id,
      equipo_id: item.itemId,
      cantidad: item.cantidad,
      tarifa_aplicada: item.tarifaAplicada,
      dias_contratados: item.diasContratados,
      subtotal_linea: item.cantidad * item.tarifaAplicada * item.diasContratados,
      fecha_inicio: item.fechaInicio || new Date().toISOString(),
      fecha_fin: item.fechaFin || null,
      devuelto: false,
      cantidad_devuelta: 0,
      costo_dano: 0,
    }));

    const { error: errorDetalles } = await supabase
      .from("alquiler_detalles")
      .insert(detallesPayload);

    if (errorDetalles) throw errorDetalles;

    // 3. Ajustar Stock de Equipos
    for (const item of validatedData.items) {
      const { data: equipoActual } = await supabase
        .from("equipos")
        .select("stock_disponible, stock_en_obra")
        .eq("id", item.itemId)
        .single();

      if (equipoActual) {
        await supabase
          .from("equipos")
          .update({
            stock_disponible: Math.max(0, equipoActual.stock_disponible - item.cantidad),
            stock_en_obra: equipoActual.stock_en_obra + item.cantidad,
            updated_at: new Date().toISOString(),
          })
          .eq("id", item.itemId);
      }
    }

    // 4. Invalidar Caché Multi-Tenant
    await invalidateTenantCache(tenantId, ['alquileres', 'equipos']);

    return NextResponse.json({
      success: true,
      data: cabecera,
      message: "Alquiler creado exitosamente",
    }, { status: 201 });

  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ success: false, error: error.errors[0].message }, { status: 400 });
    }
    return NextResponse.json({ success: false, error: error.message || "Error al crear alquiler" }, { status: 500 });
  }
}
