// types/next-auth.d.ts
// Extend NextAuth's built-in types to include our custom `role` field
// on both the Session and JWT objects.

import "next-auth";
import "next-auth/jwt";

declare module "next-auth" {
  interface Session {
    user?: {
      name?: string | null;
      email?: string | null;
      image?: string | null;
      role?: "admin" | "user";
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    email?: string;
    role?: "admin" | "user";
  }
}
