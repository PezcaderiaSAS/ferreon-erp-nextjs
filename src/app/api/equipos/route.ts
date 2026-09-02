import { NextResponse } from "next/server";
import { getTenantCache, setTenantCache } from "@/lib/redis";
import { createServerSupabaseClient } from "@/infrastructure/persistence/supabase/server";
import { EquipoSchema } from "@/infrastructure/dtos/equipo.dto";

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    const tenantId = user?.id || 'default';

    // 1. Intento de Lectura en Caché Aislado por Tenant (Read-Through)
    const cachedData = await getTenantCache<any[]>(tenantId, 'equipos');
    if (cachedData) {
      return NextResponse.json({
        success: true,
        data: cachedData,
        message: "Equipos obtenidos desde caché Multi-Tenant (Hit)",
      });
    }

    // 2. Consulta a Base de Datos protegida por RLS (Miss)
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
        validatedData = data; 
      } else {
        validatedData = parsed.data;
      }
    }

    // 4. Escritura en Caché Multi-Tenant (TTL 1 Hora)
    if (validatedData.length > 0) {
      await setTenantCache(tenantId, 'equipos', validatedData, 3600);
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
