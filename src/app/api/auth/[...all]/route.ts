import { NextResponse } from "next/server";
import { USUARIOS_DEMO, PERMISOS_POR_ROL } from "../../../../lib/auth/rbac-matrix";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const path = url.pathname;

  if (path.endsWith("/session")) {
    // Retornar sesión demo o usuario por defecto
    const defaultUser = USUARIOS_DEMO[0];
    return NextResponse.json({
      authenticated: true,
      user: defaultUser,
      permissions: PERMISOS_POR_ROL[defaultUser.rol],
    });
  }

  if (path.endsWith("/users")) {
    return NextResponse.json({ users: USUARIOS_DEMO });
  }

  return NextResponse.json({ status: "better-auth-active", timestamp: new Date().toISOString() });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email } = body;

    const userFound = USUARIOS_DEMO.find(
      (u) => u.email.toLowerCase() === (email || "").trim().toLowerCase()
    );

    if (!userFound) {
      return NextResponse.json(
        { error: "Usuario no encontrado en el sistema." },
        { status: 401 }
      );
    }

    return NextResponse.json({
      success: true,
      user: userFound,
      permissions: PERMISOS_POR_ROL[userFound.rol],
      token: `sess_${userFound.id}_${Date.now()}`,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Error al autenticar." }, { status: 500 });
  }
}
