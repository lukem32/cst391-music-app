// lib/auth.ts
// Centralised NextAuth configuration extracted from the route handler.
// Importing authOptions from here (rather than from the route file) avoids
// circular-import issues when server components / API routes call
// getServerSession(authOptions).

import { type NextAuthOptions, type Session, type Account, type Profile } from "next-auth";
import GitHubProvider from "next-auth/providers/github";
import type { JWT } from "next-auth/jwt";

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
     * JWT callback – runs when the token is first created or refreshed.
     * We attach the user's email and role here so they travel with the JWT.
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
      // First sign-in: copy email from the provider profile (GitHub)
      if (account && profile && typeof profile.email === "string") {
        token.email = profile.email;
      }

      // Simple admin allowlist – comma-separated emails in ADMIN_EMAILS env var
      const admins = (process.env.ADMIN_EMAILS ?? "")
        .split(",")
        .map((e) => e.trim());
      token.role = admins.includes(token.email ?? "") ? "admin" : "user";

      return token;
    },

    /**
     * Session callback – runs whenever useSession() / getServerSession() is called.
     * Copies token.role → session.user.role so the client can read it.
     */
    async session({
      session,
      token,
    }: {
      session: Session;
      token: JWT;
    }): Promise<Session> {
      if (session.user) {
        session.user.role = token.role as "admin" | "user" | undefined;
      }
      return session;
    },
  },
};
