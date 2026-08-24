import { describe, expect, it } from "vitest";

import {
  isDemoEmail,
  isDemoProfileSwitcherEnabled,
} from "@/lib/security/demo-allowlist";
import { rateLimit } from "@/lib/security/rate-limit";

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
