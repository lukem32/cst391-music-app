// app/api/auth/[...nextauth]/route.ts
// NextAuth catch-all route — this single file activates the entire
// NextAuth authentication framework for all /api/auth/* endpoints.

import NextAuth, {
  type NextAuthOptions,
  type Session,
  type Account,
  type Profile,
} from "next-auth";
import GitHubProvider from "next-auth/providers/github";
import type { JWT } from "next-auth/jwt";

/**
 * Central authOptions, fully typed.
 * This lets TypeScript know the shapes of `token`, `session`, etc.
 */
export const authOptions: NextAuthOptions = {
  providers: [
    GitHubProvider({
      clientId: process.env.GITHUB_ID!,
      clientSecret: process.env.GITHUB_SECRET!,
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET,
  session: { strategy: "jwt" },
  callbacks: {
    /**
     * JWT callback: runs when the token is created/updated.
     * We attach email + role here.
     */
    async jwt({
      token,
      account,
      profile,
    }: {
      token: JWT;
      account?: Account | null;
      profile?: Profile | null;
    }): Promise<JWT> {
      // First sign-in: copy email from provider profile (GitHub)
      if (account && profile && typeof profile.email === "string") {
        token.email = profile.email;
      }

      // Simple admin allowlist via env var (comma-separated emails)
      const admins = (process.env.ADMIN_EMAILS ?? "").split(",").map((e) =>
        e.trim()
      );
      token.role = admins.includes(token.email ?? "") ? "admin" : "user";

      return token;
    },

    /**
     * Session callback: runs whenever `useSession` / `getServerSession` is used.
     * We copy our custom token.role → session.user.role so the client can see it.
     */
    async session({
      session,
      token,
    }: {
      session: Session;
      token: JWT;
    }): Promise<Session> {
      if (session.user) {
        // `role` is available on token because of our JWT type augmentation.
        session.user.role = token.role as "admin" | "user" | undefined;
      }
      return session;
    },
  },
};

// Standard NextAuth handler export for App Router
const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
