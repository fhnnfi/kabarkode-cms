import { NextResponse, type NextRequest } from "next/server";

/**
 * Route protection lapis pertama (requirement §57–58).
 * Ini HANYA UX guard berbasis keberadaan cookie token — bukan lapisan
 * keamanan. Otoritas final tetap backend (Bearer JWT + authorize role).
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hasToken = Boolean(request.cookies.get("kk_cms_token")?.value);

  if (!hasToken && !pathname.startsWith("/login")) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  if (hasToken && pathname === "/login") {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)"],
};
