import { NextResponse } from "next/server";
import { redis } from "@/lib/redis";
import { createServerSupabaseClient } from "@/infrastructure/persistence/supabase/server";
import { EquipoSchema } from "@/infrastructure/dtos/equipo.dto";
import { z } from "zod";

const CACHE_KEY = "cache:equipos";

export async function GET() {
  try {
    // 1. Intento de Lectura en Caché (Read-Through)
    if (redis) {
      try {
        const cached = await redis.get(CACHE_KEY);
        if (cached) {
          const parsedCache = typeof cached === "string" ? JSON.parse(cached) : cached;
          return NextResponse.json({
            success: true,
            data: parsedCache,
            message: "Equipos obtenidos desde caché (Hit)",
          });
        }
      } catch (redisError) {
        // Graceful Degradation: si Redis falla al leer, ignoramos y caemos a DB
        console.warn("[API Equipos] Error leyendo de Redis:", redisError);
      }
    }

    // 2. Consulta a Base de Datos (Miss)
    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase
      .from("equipos")
      .select("*")
      .order("id", { ascending: false });

    if (error) {
      console.error("[API Equipos] Error desde Supabase:", error);
      throw new Error("Error al consultar equipos en la base de datos.");
    }

    // 3. Validación y Transformación DTO
    let validatedData: any[] = [];
    if (data && data.length > 0) {
      const parsed = EquipoSchema.array().safeParse(data);
      if (!parsed.success) {
        console.error("[API Equipos] Zod Parsing Error:", parsed.error);
        // Si falla la validación estricta (no debería por los fallbacks), retornamos data cruda pero segura
        validatedData = data; 
      } else {
        validatedData = parsed.data;
      }
    }

    // 4. Escritura en Caché
    if (redis && validatedData.length > 0) {
      try {
        // Expira en 1 hora (3600 segundos)
        await redis.set(CACHE_KEY, JSON.stringify(validatedData), { ex: 3600 });
      } catch (redisError) {
        // Graceful Degradation: si falla la escritura, solo logueamos
        console.warn("[API Equipos] Error guardando en Redis:", redisError);
      }
    }

    // 5. Retorno al Cliente
    return NextResponse.json({
      success: true,
      data: validatedData,
      message: "Equipos obtenidos desde DB (Miss)",
    });

  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Error interno del servidor" },
      { status: 500 }
    );
  }
}
