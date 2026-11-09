import { NextResponse, type NextRequest } from "next/server";

/** Primera barrera: sin cookie de sesión no se entra al panel. La validación real (sesión + capacidad) ocurre en el servidor. */
export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (pathname.startsWith("/admin") && pathname !== "/admin/ingresar" && !req.cookies.get("cj_session")) {
    const url = req.nextUrl.clone();
    url.pathname = "/admin/ingresar";
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = { matcher: ["/admin/:path*"] };
