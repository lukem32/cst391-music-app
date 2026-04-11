// app/SessionWrapper.tsx
// Client component that wraps the app in NextAuth's SessionProvider.
// This makes useSession() available anywhere in the component tree.

"use client";

import { SessionProvider } from "next-auth/react";

export default function SessionWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  return <SessionProvider>{children}</SessionProvider>;
}
