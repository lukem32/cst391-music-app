// lib/apiClient.ts
// Internal API client for Next.js (Vercel-safe)
// Exports only typed helper functions for clarity and safety.
//
// NOTE on `body?: unknown`:
//   `unknown` allows any input type but keeps type checking active.
//   It's safer than `any` — you can pass any value, but you can't
//   accidentally use its properties without narrowing or casting.
//   Here we just forward it to JSON.stringify(), so no cast is needed.

type Verb = "GET" | "POST" | "PUT" | "DELETE";

/**
 * Internal core request function.
 * Not exported — use get/post/put/del helpers instead.
 */
async function request<T>(
  path: string,
  method: Verb = "GET",
  body?: unknown
): Promise<T> {
  const response = await fetch(`/api${path}`, {
    method,
    headers: { "Content-Type": "application/json" },
    body: method !== "GET" ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  const text = await response.text();

  try {
    return text ? (JSON.parse(text) as T) : ({} as T);
  } catch {
    throw new Error("Invalid JSON response");
  }
}

/*
  ----------------------------------------------------------------
  🔹 Typed helper functions
  Only these are exported for use in app and component code.
  ----------------------------------------------------------------
*/

export const get = async <T>(path: string): Promise<T> =>
  request<T>(path, "GET");

export const post = async <T, B = unknown>(
  path: string,
  body: B
): Promise<T> => request<T>(path, "POST", body);

export const put = async <T, B = unknown>(
  path: string,
  body: B
): Promise<T> => request<T>(path, "PUT", body);

export const del = async <T>(path: string): Promise<T> =>
  request<T>(path, "DELETE");
