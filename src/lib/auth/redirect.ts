// =============================================================================
// ConMart — Same-origin path guard
// =============================================================================
// Login, the auth callback, and password-reset emails all accept a `next` or
// `redirect` value from the URL. Those values must stay on this origin.
// =============================================================================

/**
 * Returns `candidate` when it is a same-origin relative path, otherwise
 * `fallback`. Rejects protocol-relative URLs, backslashes, and any scheme.
 */
export function safeAppPath(
  candidate: string | null | undefined,
  fallback = "/dashboard"
): string {
  if (!candidate) {
    return fallback;
  }

  const path = candidate.trim();

  if (
    !path.startsWith("/") ||
    path.startsWith("//") ||
    path.includes("\\") ||
    path.includes("://")
  ) {
    return fallback;
  }

  return path;
}
