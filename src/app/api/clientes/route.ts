import { NextResponse } from "next/server";
import { z } from "zod";
import { redis } from "@/lib/redis";
import { createServerSupabaseClient } from "@/infrastructure/persistence/supabase/server";

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
      const cached = await redis.get(CACHE_KEY);
      if (cached) {
        return NextResponse.json({
          success: true,
          data: typeof cached === "string" ? JSON.parse(cached) : cached,
          message: "Directorio de clientes obtenido desde caché",
        });
      }
    }

    const supabase = createServerSupabaseClient();
    const { data, error } = await supabase
      .from("clientes")
      .select("*")
      .is("deleted_at", null)
      .order("nombre", { ascending: true });

    if (error) throw error;

    if (redis && data) {
      await redis.set(CACHE_KEY, JSON.stringify(data), { ex: 3600 });
    }

    return NextResponse.json({
      success: true,
      data: data || [],
      message: "Directorio de clientes obtenido desde DB",
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

    const supabase = createServerSupabaseClient();
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
