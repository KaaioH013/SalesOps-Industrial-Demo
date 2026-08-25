type Bucket = {
  count: number;
  resetAt: number;
};

const buckets = new Map<string, Bucket>();

/**
 * Rate limit em memória (por instância). Adequado para demo pública;
 * não substitui WAF/Vercel Firewall em escala multi-instância.
 */
export function rateLimit(
  key: string,
  limit: number,
  windowMs: number,
): { ok: true } | { ok: false; retryAfterSec: number } {
  const now = Date.now();
  const current = buckets.get(key);

  if (!current || current.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true };
  }

  if (current.count >= limit) {
    return {
      ok: false,
      retryAfterSec: Math.max(1, Math.ceil((current.resetAt - now) / 1000)),
    };
  }

  current.count += 1;
  return { ok: true };
}

/**
 * IP para rate limit: preferir headers da plataforma (Vercel).
 * Não confiar no 1º hop genérico de `x-forwarded-for` (forjável em self-host).
 */
export function clientIpFromHeaders(headers: Headers): string {
  const vercel = headers.get("x-vercel-forwarded-for");
  if (vercel) {
    return vercel.split(",")[0]?.trim() || "unknown";
  }

  const realIp = headers.get("x-real-ip");
  if (realIp?.trim()) {
    return realIp.trim();
  }

  return "unknown";
}

const locks = new Map<string, number>();

/** Lock em memória por chave (TTL). Mesma limitação por instância do rateLimit. */
export function tryAcquireLock(
  key: string,
  ttlMs: number,
): { ok: true } | { ok: false } {
  const now = Date.now();
  const until = locks.get(key);
  if (until !== undefined && until > now) {
    return { ok: false };
  }
  locks.set(key, now + ttlMs);
  return { ok: true };
}

export function releaseLock(key: string): void {
  locks.delete(key);
}
