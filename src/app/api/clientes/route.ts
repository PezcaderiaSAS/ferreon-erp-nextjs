import { NextResponse } from "next/server";
import { z } from "zod";
import { redis } from "@/lib/redis";
import { createServerSupabaseClient } from "@/infrastructure/persistence/supabase/server";
import { ClienteSchema } from "@/infrastructure/dtos/cliente.dto";

const CrearClienteSchema = z.object({
  nitCedula: z.string().min(3, "La identificación debe contener al menos 3 caracteres"),
  nombre: z.string().min(2, "El nombre o razón social debe contener al menos 2 caracteres"),
  telefono: z.string().optional(),
  email: z.string().email("Formato de correo electrónico inválido").optional().or(z.literal("")),
  direccion: z.string().optional(),
});

const CACHE_KEY = "cache:clientes";

export async function GET() {
  try {
    if (redis) {
      try {
        const cached = await redis.get(CACHE_KEY);
        if (cached) {
          return NextResponse.json({
            success: true,
            data: typeof cached === "string" ? JSON.parse(cached) : cached,
            message: "Directorio de clientes obtenido desde caché (Hit)",
          });
        }
      } catch (redisError) {
        console.warn("[API Clientes] Error leyendo de Redis:", redisError);
      }
    }

    const supabase = await createServerSupabaseClient();
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

    if (redis && validatedData.length > 0) {
      try {
        await redis.set(CACHE_KEY, JSON.stringify(validatedData), { ex: 3600 });
      } catch (redisError) {
        console.warn("[API Clientes] Error guardando en Redis:", redisError);
      }
    }

    return NextResponse.json({
      success: true,
      data: validatedData,
      message: "Directorio de clientes obtenido desde DB (Miss)",
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Error al obtener clientes" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validatedData = CrearClienteSchema.parse(body);

    const supabase = await createServerSupabaseClient();
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

    if (redis) {
      await redis.del("cache:clientes");
      await redis.del("cache:alquileres");
    }

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
      { success: false, error: error.message || "Error al procesar la solicitud" },
      { status: 500 }
    );
  }
}
