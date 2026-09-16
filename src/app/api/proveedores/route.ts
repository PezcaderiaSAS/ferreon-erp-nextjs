import { NextResponse } from "next/server";
import { obtenerProveedoresAction } from "@/app/actions/proveedores";

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const res = await obtenerProveedoresAction();

    return NextResponse.json(
      {
        success: res.success,
        data: res.data || [],
        error: res.error
      },
      {
        status: res.success ? 200 : 400,
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          Pragma: 'no-cache',
          Expires: '0',
        },
      }
    );
  } catch (err: any) {
    console.error('[API Proveedores] Error no controlado:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Error al obtener proveedores', data: [] },
      { 
        status: 500,
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          Pragma: 'no-cache',
          Expires: '0',
        },
      }
    );
  }
}
