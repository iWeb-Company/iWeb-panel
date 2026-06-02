import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { username, password, remember } = body;

    const allowedUsersRaw = process.env.ALLOWED_USERS || "[]";
    let allowedUsers = [];
    try {
      allowedUsers = JSON.parse(allowedUsersRaw);
    } catch (error) {
      console.error("Error parsing ALLOWED_USERS environment variable:", error);
    }

    const isValid = allowedUsers.some(
      (u: any) => u.user === username && u.pass === password
    );

    if (!isValid) {
      return NextResponse.json(
        { error: "Usuario o contraseña incorrectos." },
        { status: 401 }
      );
    }

    const cookieStore = await cookies();

    // Configurar cookie de sesión segura
    const maxAge = remember ? 60 * 60 * 24 * 7 : undefined; // 7 días si "recordar", o duración de sesión

    cookieStore.set("iweb_session", "true", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error en login route:", error);
    return NextResponse.json(
      { error: "Error interno del servidor." },
      { status: 500 }
    );
  }
}
