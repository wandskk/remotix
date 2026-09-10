import NextAuth from "next-auth";

import { authConfig } from "@/lib/auth/auth.config";

const { auth } = NextAuth(authConfig);

export function proxy(...args: Parameters<typeof auth>) {
  return auth(...args);
}

export const config = {
  matcher: ["/admin/:path*", "/client/:path*"],
};
