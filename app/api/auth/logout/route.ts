import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function POST() {
  try {
    const cookieStore = await cookies();
    cookieStore.delete("iweb_session");
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error en logout route:", error);
    return NextResponse.json(
      { error: "Error al cerrar sesión." },
      { status: 500 }
    );
  }
}
