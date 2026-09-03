import { NextResponse } from "next/server";
import { z } from "zod";
import { getTenantCache, setTenantCache, invalidateTenantCache } from "@/lib/redis";
import { createServerSupabaseClient } from "@/infrastructure/persistence/supabase/server";
import { ClienteSchema } from "@/infrastructure/dtos/cliente.dto";

export const dynamic = 'force-dynamic';

const CrearClienteSchema = z.object({
  nitCedula: z.string().min(3, "La identificación debe contener al menos 3 caracteres"),
  nombre: z.string().min(2, "El nombre o razón social debe contener al menos 2 caracteres"),
  telefono: z.string().optional(),
  email: z.string().email("Formato de correo electrónico inválido").optional().or(z.literal("")),
  direccion: z.string().optional(),
});

export async function GET() {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    const tenantId = user?.id || 'default';

    // 1. Intento de Lectura en Caché Multi-Tenant (Read-Through)
    const cachedData = await getTenantCache<any[]>(tenantId, 'clientes');
    if (cachedData) {
      return NextResponse.json(
        {
          success: true,
          data: cachedData,
          message: "Directorio de clientes obtenido desde caché Multi-Tenant (Hit)",
        },
        {
          headers: {
            'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
            Pragma: 'no-cache',
            Expires: '0',
          },
        }
      );
    }

    // 2. Consulta Base de Datos protegida por RLS (Miss)
    const { data, error } = await supabase
      .from("clientes")
      .select("*")
      .is("deleted_at", null)
      .order("nombre", { ascending: true });

    if (error) throw error;

    let validatedData: any[] = [];
    if (data && data.length > 0) {
      const parsed = ClienteSchema.array().safeParse(data);
      if (!parsed.success) {
        console.error("[API Clientes] Zod Parsing Error:", parsed.error);
        validatedData = data;
      } else {
        validatedData = parsed.data;
      }
    }

    // 3. Guardar en Caché Multi-Tenant (TTL 1 Hora)
    if (validatedData.length > 0) {
      await setTenantCache(tenantId, 'clientes', validatedData, 3600);
    }

    return NextResponse.json(
      {
        success: true,
        data: validatedData,
        message: "Directorio de clientes obtenido desde DB (Miss)",
      },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          Pragma: 'no-cache',
          Expires: '0',
        },
      }
    );
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Error al obtener clientes" },
      {
        status: 500,
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate',
        },
      }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validatedData = CrearClienteSchema.parse(body);

    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    const tenantId = user?.id || 'default';

    const { data, error } = await supabase
      .from("clientes")
      .insert([
        {
          nit_cedula: validatedData.nitCedula.trim().toUpperCase(),
          nombre: validatedData.nombre.trim().toUpperCase(),
          telefono: validatedData.telefono || null,
          email: validatedData.email ? validatedData.email.trim().toLowerCase() : null,
          direccion: validatedData.direccion || null,
          estado: 'Activo',
        }
      ])
      .select()
      .single();

    if (error) {
      if (error.code === "23505") {
        throw new Error("Ya existe un cliente con esta identificación");
      }
      throw error;
    }

    // Invalidar caché del tenant
    await invalidateTenantCache(tenantId, ['clientes', 'alquileres']);

    return NextResponse.json(
      {
        success: true,
        data,
        message: "Cliente registrado exitosamente",
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
      { success: false, error: error.message || "Error al registrar cliente" },
      { status: 500 }
    );
  }
}
