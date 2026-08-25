import { timingSafeEqual } from "node:crypto";

/**
 * Autoriza cron apenas via `Authorization: Bearer <CRON_SECRET>`.
 * Query string `?secret=` não é aceita (vaza em logs/Referer).
 */
export function isCronAuthorized(
  authorizationHeader: string | null,
  secret: string | undefined = process.env.CRON_SECRET,
): boolean {
  if (!secret) return false;
  if (!authorizationHeader?.startsWith("Bearer ")) return false;

  const provided = authorizationHeader.slice("Bearer ".length);
  if (provided.length !== secret.length) return false;

  try {
    return timingSafeEqual(Buffer.from(provided), Buffer.from(secret));
  } catch {
    return false;
  }
}
