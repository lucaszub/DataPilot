const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

// TODO: Implement API client
// - fetchWithAuth(url, options) — auto-attach JWT token
// - handle 401 → refresh token or redirect to login
// - handle network errors gracefully

export async function apiFetch(
  path: string,
  options?: RequestInit
): Promise<Response> {
  return fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
  });
}
