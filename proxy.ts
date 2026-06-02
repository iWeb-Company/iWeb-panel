import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function proxy(request: NextRequest) {
  const session = request.cookies.get("iweb_session")?.value;
  const { pathname } = request.nextUrl;

  // Proteger rutas del dashboard si no hay sesión activa
  if (pathname.startsWith("/dashboard")) {
    if (!session) {
      const url = new URL("/login", request.url);
      return NextResponse.redirect(url);
    }
  }

  // Redirigir al dashboard si ya está logueado e intenta ir a login o raíz
  if (pathname === "/login" || pathname === "/") {
    if (session) {
      const url = new URL("/dashboard/analiticas", request.url);
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

// Configurar rutas donde correrá el proxy
export const config = {
  matcher: [
    "/",
    "/login",
    "/dashboard/:path*",
  ],
};
