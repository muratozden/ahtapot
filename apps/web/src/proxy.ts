import { getSessionCookie } from "better-auth/cookies";
import { type NextRequest, NextResponse } from "next/server";

const authPages = ["/giris", "/kayit"];

// Optimistic check on cookie presence only; pages still verify the session.
export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const hasSession = Boolean(getSessionCookie(request));
  const isAuthPage = authPages.includes(pathname);

  if (isAuthPage && hasSession) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  if (!isAuthPage && !hasSession) {
    const url = new URL("/giris", request.url);
    if (pathname !== "/") url.searchParams.set("next", pathname + search);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
