import { NextResponse, type NextRequest } from "next/server";

import { auth } from "@/lib/auth/server";

const neonAuth = auth.middleware({ loginUrl: "/auth/sign-in" });

export default function proxy(request: NextRequest) {
  if (request.headers.has("next-action")) {
    return NextResponse.next();
  }
  return neonAuth(request);
}

export const config = {
  matcher: ["/cuenta/:path*", "/account/:path*"],
};
