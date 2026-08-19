import { NextResponse } from "next/server";
import { USUARIOS_DEMO } from "../../../lib/auth/rbac-matrix";

export async function GET() {
  return NextResponse.json({ usuarios: USUARIOS_DEMO });
}
