import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    success: true,
    data: [],
    message: "Endpoint de alquileres_app operativo",
    meta: {
      timestamp: new Date().toISOString(),
      standards: {
        weightUnit: "peso_gramos (BIGINT)",
        currency: "COP NUMERIC(12,2)",
        timezone: "America/Bogota",
      },
    },
  });
}
