import { describe, expect, it } from "vitest";

import { marginTargetForRole } from "@/db/queries/settings";
import {
  isDemoEmail,
  isDemoProfileSwitcherEnabled,
} from "@/lib/security/demo-allowlist";
import { isCronAuthorized } from "@/lib/security/cron-auth";
import {
  clientIpFromHeaders,
  rateLimit,
  releaseLock,
  tryAcquireLock,
} from "@/lib/security/rate-limit";

describe("demo allowlist", () => {
  it("aceita apenas e-mails seed", () => {
    expect(isDemoEmail("admin@demo.local")).toBe(true);
    expect(isDemoEmail("ADMIN@demo.local")).toBe(true);
    expect(isDemoEmail("hacker@evil.com")).toBe(false);
    expect(isDemoEmail("admin@gmail.com")).toBe(false);
  });

  it("desliga profile switcher em production por padrão", () => {
    const previousNode = process.env.NODE_ENV;
    const previousFlag = process.env.DEMO_PROFILE_SWITCHER;
    // @ts-expect-error test override
    process.env.NODE_ENV = "production";
    delete process.env.DEMO_PROFILE_SWITCHER;
    expect(isDemoProfileSwitcherEnabled()).toBe(false);
    process.env.DEMO_PROFILE_SWITCHER = "true";
    expect(isDemoProfileSwitcherEnabled()).toBe(true);
    // @ts-expect-error restore
    process.env.NODE_ENV = previousNode;
    if (previousFlag === undefined) {
      delete process.env.DEMO_PROFILE_SWITCHER;
    } else {
      process.env.DEMO_PROFILE_SWITCHER = previousFlag;
    }
  });
});

describe("rateLimit", () => {
  it("bloqueia após exceder o limite na janela", () => {
    const key = `test-${Math.random()}`;
    expect(rateLimit(key, 2, 60_000).ok).toBe(true);
    expect(rateLimit(key, 2, 60_000).ok).toBe(true);
    const blocked = rateLimit(key, 2, 60_000);
    expect(blocked.ok).toBe(false);
    if (!blocked.ok) {
      expect(blocked.retryAfterSec).toBeGreaterThan(0);
    }
  });
});

describe("clientIpFromHeaders", () => {
  it("prioriza x-vercel-forwarded-for sobre x-forwarded-for forjável", () => {
    const headers = new Headers({
      "x-forwarded-for": "1.2.3.4",
      "x-vercel-forwarded-for": "9.9.9.9, 8.8.8.8",
    });
    expect(clientIpFromHeaders(headers)).toBe("9.9.9.9");
  });

  it("usa x-real-ip quando não há header Vercel", () => {
    const headers = new Headers({
      "x-real-ip": "10.0.0.1",
      "x-forwarded-for": "1.2.3.4",
    });
    expect(clientIpFromHeaders(headers)).toBe("10.0.0.1");
  });

  it("não confia só em x-forwarded-for genérico", () => {
    const headers = new Headers({
      "x-forwarded-for": "1.2.3.4",
    });
    expect(clientIpFromHeaders(headers)).toBe("unknown");
  });
});

describe("tryAcquireLock", () => {
  it("impede lock concorrente na mesma chave", () => {
    const key = `lock-${Math.random()}`;
    expect(tryAcquireLock(key, 60_000).ok).toBe(true);
    expect(tryAcquireLock(key, 60_000).ok).toBe(false);
    releaseLock(key);
    expect(tryAcquireLock(key, 60_000).ok).toBe(true);
    releaseLock(key);
  });
});

describe("isCronAuthorized", () => {
  it("aceita apenas Bearer com secret correto", () => {
    const secret = "cron-test-secret-value";
    expect(isCronAuthorized(`Bearer ${secret}`, secret)).toBe(true);
    expect(isCronAuthorized(`Bearer wrong`, secret)).toBe(false);
    expect(isCronAuthorized(null, secret)).toBe(false);
    expect(isCronAuthorized(`Bearer ${secret}`, undefined)).toBe(false);
  });

  it("não autoriza via ausência de header (query string não conta)", () => {
    const secret = "cron-test-secret-value";
    // rota não lê mais ?secret= — sem Authorization = negado
    expect(isCronAuthorized(null, secret)).toBe(false);
    expect(isCronAuthorized("", secret)).toBe(false);
  });
});

describe("marginTargetForRole", () => {
  it("omite margem para seller e preserva para admin/manager", () => {
    expect(marginTargetForRole("seller", 12_000)).toBeNull();
    expect(marginTargetForRole("admin", 12_000)).toBe(12_000);
    expect(marginTargetForRole("manager", 12_000)).toBe(12_000);
  });
});
