/**
 * Auth helpers — token storage and cookie management.
 * Tokens are stored in localStorage for client-side access.
 * A cookie `dp_token` is set for middleware-side access (protected route detection).
 */

export function getAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("access_token");
}

export function getRefreshToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("refresh_token");
}

export function setTokens(accessToken: string, refreshToken: string): void {
  localStorage.setItem("access_token", accessToken);
  localStorage.setItem("refresh_token", refreshToken);
  // Set cookie for middleware (not httpOnly — MVP, will migrate in Phase 2)
  document.cookie = `dp_token=${accessToken}; path=/; max-age=1800; SameSite=Lax`;
}

export function clearTokens(): void {
  localStorage.removeItem("access_token");
  localStorage.removeItem("refresh_token");
  // Clear cookie
  document.cookie = "dp_token=; path=/; max-age=0; SameSite=Lax";
}

export function isAuthenticated(): boolean {
  return Boolean(getAccessToken());
}
