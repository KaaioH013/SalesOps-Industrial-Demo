import { and, asc, desc, eq } from "drizzle-orm";

import { getDb } from "../client";
import {
  organizationSettings,
  organizations,
  profiles,
  salesTerritories,
  targets,
} from "../schema";
import type { ProfileRole } from "../schema/enums";
import {
  DEFAULT_LOSS_REASONS,
  parseLossReasonsJson,
  serializeLossReasons,
} from "@/lib/settings/loss-reasons";
import { ATTENTION_DAYS, CRITICAL_DAYS } from "@/lib/analytics/alert-thresholds";

export type SettingsProfile = {
  id: string;
  name: string;
  email: string;
  title: string | null;
  role: ProfileRole;
  organizationName: string;
};

export type SettingsTargetRow = {
  id: string;
  period: string;
  sellerId: string | null;
  sellerName: string | null;
  territoryId: string | null;
  territoryName: string | null;
  revenueTargetCents: number;
  marginTargetCents: number;
  newCustomersTarget: number;
  conversionTargetBps: number;
};

export type OrganizationConfig = {
  attentionDays: number;
  criticalDays: number;
  lossReasons: string[];
};

export async function getSettingsProfile(params: {
  organizationId: string;
  userId: string;
}): Promise<SettingsProfile | null> {
  const db = getDb();
  const row = await db
    .select({
      profile: profiles,
      organizationName: organizations.name,
    })
    .from(profiles)
    .innerJoin(organizations, eq(profiles.organizationId, organizations.id))
    .where(
      and(
        eq(profiles.id, params.userId),
        eq(profiles.organizationId, params.organizationId),
      ),
    )
    .limit(1);

  const result = row[0];
  if (!result) return null;

  return {
    id: result.profile.id,
    name: result.profile.name,
    email: result.profile.email,
    title: result.profile.title,
    role: result.profile.role,
    organizationName: result.organizationName,
  };
}

export async function listSettingsTargets(params: {
  organizationId: string;
  role: ProfileRole;
  userId: string;
}): Promise<SettingsTargetRow[]> {
  const db = getDb();
  const rows = await db
    .select({
      target: targets,
      sellerName: profiles.name,
      territoryName: salesTerritories.name,
    })
    .from(targets)
    .leftJoin(profiles, eq(targets.sellerId, profiles.id))
    .leftJoin(salesTerritories, eq(targets.territoryId, salesTerritories.id))
    .where(eq(targets.organizationId, params.organizationId))
    .orderBy(desc(targets.period), asc(profiles.name));

  return rows
    .filter((row) =>
      params.role === "seller" ? row.target.sellerId === params.userId : true,
    )
    .map(({ target, sellerName, territoryName }) => ({
      id: target.id,
      period: target.period,
      sellerId: target.sellerId,
      sellerName,
      territoryId: target.territoryId,
      territoryName,
      revenueTargetCents: target.revenueTargetCents,
      marginTargetCents: target.marginTargetCents,
      newCustomersTarget: target.newCustomersTarget,
      conversionTargetBps: target.conversionTargetBps,
    }));
}

export async function getOrganizationConfig(
  organizationId: string,
): Promise<OrganizationConfig> {
  const db = getDb();
  const row = await db.query.organizationSettings.findFirst({
    where: eq(organizationSettings.organizationId, organizationId),
  });

  if (!row) {
    return {
      attentionDays: ATTENTION_DAYS,
      criticalDays: CRITICAL_DAYS,
      lossReasons: [...DEFAULT_LOSS_REASONS],
    };
  }

  return {
    attentionDays: row.attentionDays,
    criticalDays: row.criticalDays,
    lossReasons: parseLossReasonsJson(row.lossReasonsJson),
  };
}

export async function upsertOrganizationConfig(
  organizationId: string,
  config: OrganizationConfig,
) {
  const db = getDb();
  const lossReasonsJson = serializeLossReasons(config.lossReasons);
  const updatedAt = new Date();

  await db
    .insert(organizationSettings)
    .values({
      organizationId,
      attentionDays: config.attentionDays,
      criticalDays: config.criticalDays,
      lossReasonsJson,
      updatedAt,
    })
    .onConflictDoUpdate({
      target: organizationSettings.organizationId,
      set: {
        attentionDays: config.attentionDays,
        criticalDays: config.criticalDays,
        lossReasonsJson,
        updatedAt,
      },
    });
}

export async function listSettingsOptions(organizationId: string) {
  const db = getDb();
  const [sellerRows, territoryRows] = await Promise.all([
    db
      .select({ id: profiles.id, name: profiles.name })
      .from(profiles)
      .where(
        and(
          eq(profiles.organizationId, organizationId),
          eq(profiles.role, "seller"),
        ),
      )
      .orderBy(asc(profiles.name)),
    db
      .select({ id: salesTerritories.id, name: salesTerritories.name })
      .from(salesTerritories)
      .where(eq(salesTerritories.organizationId, organizationId))
      .orderBy(asc(salesTerritories.name)),
  ]);

  return { sellers: sellerRows, territories: territoryRows };
}
