import { NextResponse, type NextRequest } from "next/server";

// ---------------------------------------------------------------------------
// Proxy (Next 16, ex-middleware): protección de rutas a nivel edge.
//  - Sin sesión → /login.
//  - Secciones sólo-admin: el EMPLEADO es redirigido a /pos.
//
// El rol viaja en la sesión de Better Auth. Se consulta el endpoint de sesión
// (corre en Node) porque el adapter de Prisma no puede correr en el edge.
// Es defensa adicional: los layouts server (requireAuth/requireAccess) también
// validan.
// ---------------------------------------------------------------------------

const ADMIN_ONLY = ["/productos", "/categorias", "/marcas", "/caja", "/reportes", "/dashboard"];

type SessionResponse = { user?: { role?: string } } | null;

export async function proxy(request: NextRequest) {
  const res = await fetch(`${request.nextUrl.origin}/api/auth/get-session`, {
    headers: { cookie: request.headers.get("cookie") ?? "" },
    cache: "no-store",
  });

  const session = (res.ok ? await res.json() : null) as SessionResponse;

  if (!session?.user) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const path = request.nextUrl.pathname;
  const isAdminOnly = ADMIN_ONLY.some((p) => path === p || path.startsWith(p + "/"));
  if (isAdminOnly && session.user.role !== "ADMIN") {
    return NextResponse.redirect(new URL("/pos", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/pos/:path*",
    "/ventas/:path*",
    "/productos/:path*",
    "/categorias/:path*",
    "/marcas/:path*",
    "/caja/:path*",
    "/reportes/:path*",
    "/dashboard/:path*",
  ],
};
