import { NextResponse } from "next/server";
import { z } from "zod";
import { redis } from "@/lib/redis";
import { createServerSupabaseClient } from "@/infrastructure/persistence/supabase/server";

const CACHE_KEY = "cache:alquileres";

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
    if (redis) {
      const cached = await redis.get(CACHE_KEY);
      if (cached) {
        return NextResponse.json({
          success: true,
          data: typeof cached === "string" ? JSON.parse(cached) : cached,
          message: "Listado de alquileres obtenido desde caché",
        });
      }
    }

    const supabase = await createServerSupabaseClient();
    
    // Para el catálogo, traemos alquileres y sus detalles (y los clientes para el nombre)
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

    if (redis && data) {
      await redis.set(CACHE_KEY, JSON.stringify(data), { ex: 3600 });
    }

    return NextResponse.json({
      success: true,
      data: data || [],
      message: "Listado de alquileres obtenido desde DB",
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

    const subtotalEquipos = validatedData.items.reduce(
      (acc, item) => acc + item.cantidad * item.tarifaAplicada * item.diasContratados,
      0
    );
    const totalFletes = validatedData.fleteEntrega + validatedData.fleteRecogida;
    const subtotalGeneral = subtotalEquipos + totalFletes;
    const total = Math.max(0, subtotalGeneral - validatedData.deposito);

    const supabase = await createServerSupabaseClient();

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
      }])
      .select()
      .single();

    if (errorCabecera) throw errorCabecera;

    // 2. Insertar Detalles
    const detallesToInsert = validatedData.items.map(item => ({
      alquiler_id: cabecera.id,
      equipo_id: item.itemId,
      cantidad: item.cantidad,
      tarifa_aplicada: item.tarifaAplicada,
      dias_contratados: item.diasContratados,
      subtotal_linea: item.cantidad * item.tarifaAplicada * item.diasContratados,
      fecha_inicio: item.fechaInicio || new Date().toISOString(),
      fecha_fin: item.fechaFin || null,
      costo_dano: 0,
      devuelto: false,
      cantidad_devuelta: 0,
    }));

    const { error: errorDetalles } = await supabase
      .from("alquiler_detalles")
      .insert(detallesToInsert);

    if (errorDetalles) {
      // Intento de compensación (Rollback manual) si fallan los detalles
      await supabase.from("alquileres").delete().eq("id", cabecera.id);
      throw errorDetalles;
    }

    // 3. Actualizar stock en obra para cada equipo
    for (const item of validatedData.items) {
      // Como no tenemos RPC para transacciones atómicas desde JS puro, hacemos un update por equipo.
      // Leemos el equipo primero o si confiamos en SQL, usamos un RPC.
      // Usaremos una aproximación leyendo y actualizando (puede haber race conditions sin RLS/RPC estricto)
      const { data: eq } = await supabase.from("equipos").select("stock_disponible, stock_en_obra").eq("id", item.itemId).single();
      if (eq) {
        await supabase.from("equipos")
          .update({
            stock_disponible: eq.stock_disponible - item.cantidad,
            stock_en_obra: eq.stock_en_obra + item.cantidad,
          })
          .eq("id", item.itemId);
      }
    }

    if (redis) {
      await redis.del(CACHE_KEY);
      await redis.del("cache:equipos"); // El stock cambió
    }

    return NextResponse.json(
      {
        success: true,
        data: cabecera,
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
