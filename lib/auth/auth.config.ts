import type { NextAuthConfig } from "next-auth";

// Config edge-safe usada pelo middleware — não pode importar Prisma nem
// bcrypt aqui (rodam no runtime Node.js, não no Edge). Os providers que
// precisam dessas dependências são adicionados só em lib/auth/auth.ts.
export const authConfig = {
  pages: {
    signIn: "/login",
  },
  // Necessário para Vercel/preview e para o proxy (Edge runtime), onde o
  // host da requisição não é conhecido antecipadamente (ver docs/deployment.md).
  trustHost: true,
  callbacks: {
    // jwt/session rodam tanto no proxy (Edge) quanto nas rotas (Node) —
    // por isso ficam aqui, e não em auth.ts, onde só o provider (que
    // precisa de Prisma/bcrypt) roda em runtime Node.
    jwt({ token, user }) {
      if (user) {
        token.role = user.role;
        token.clientId = user.clientId ?? null;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub as string;
        session.user.role = token.role;
        session.user.clientId = token.clientId;
      }
      return session;
    },
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const role = auth?.user?.role;

      const isAdminRoute = nextUrl.pathname.startsWith("/admin");
      const isClientRoute = nextUrl.pathname.startsWith("/client");

      if (isAdminRoute) return isLoggedIn && role === "ADMIN";
      if (isClientRoute) return isLoggedIn && role === "CLIENT";
      return true;
    },
  },
  providers: [],
} satisfies NextAuthConfig;
