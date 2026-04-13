// app/api/auth/[...nextauth]/route.ts
// NextAuth catch-all route — activates the full NextAuth framework for all
// /api/auth/* endpoints.  authOptions now live in lib/auth.ts so that other
// server-side code can import them without circular dependencies.

import NextAuth from "next-auth";
import { authOptions } from "@/lib/auth";

// Re-export authOptions so any code that imported from this file still works.
export { authOptions };

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
