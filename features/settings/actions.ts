"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { getDb } from "@/db/client";
import {
  auditEvents,
  profiles,
  salesTerritories,
  targets,
} from "@/db/schema";
import {
  getOrganizationConfig,
  upsertOrganizationConfig,
} from "@/db/queries/settings";
import { auth } from "@/lib/auth/auth";
import {
  deleteTargetSchema,
  updateOrganizationConfigSchema,
  upsertTargetSchema,
} from "@/lib/validations/settings";

async function requireSession() {
  const session = await auth();
  if (!session?.user) {
    throw new Error("Não autorizado");
  }
  return session.user;
}

async function requireAdmin() {
  const user = await requireSession();
  if (user.role !== "admin") {
    throw new Error("Não autorizado");
  }
  return user;
}

export async function upsertTargetAction(input: unknown) {
  const user = await requireAdmin();
  const data = upsertTargetSchema.parse(input);
  const targetId = data.id ?? crypto.randomUUID();
  const occurredAt = new Date();

  await getDb().transaction(async (tx) => {
    if (data.id) {
      const existing = await tx.query.targets.findFirst({
        where: and(
          eq(targets.id, data.id),
          eq(targets.organizationId, user.organizationId),
        ),
      });
      if (!existing) {
        throw new Error("Não encontrado");
      }
    }

    if (data.sellerId) {
      const seller = await tx.query.profiles.findFirst({
        columns: { id: true },
        where: and(
          eq(profiles.id, data.sellerId),
          eq(profiles.organizationId, user.organizationId),
        ),
      });
      if (!seller) {
        throw new Error("Não encontrado");
      }
    }

    if (data.territoryId) {
      const territory = await tx.query.salesTerritories.findFirst({
        columns: { id: true },
        where: and(
          eq(salesTerritories.id, data.territoryId),
          eq(salesTerritories.organizationId, user.organizationId),
        ),
      });
      if (!territory) {
        throw new Error("Não encontrado");
      }
    }

    await tx
      .insert(targets)
      .values({
        id: targetId,
        organizationId: user.organizationId,
        period: data.period,
        sellerId: data.sellerId || null,
        territoryId: data.territoryId || null,
        revenueTargetCents: data.revenueTargetCents,
        marginTargetCents: data.marginTargetCents,
        newCustomersTarget: data.newCustomersTarget,
        conversionTargetBps: data.conversionTargetBps,
        updatedAt: occurredAt,
      })
      .onConflictDoUpdate({
        target: targets.id,
        set: {
          period: data.period,
          sellerId: data.sellerId || null,
          territoryId: data.territoryId || null,
          revenueTargetCents: data.revenueTargetCents,
          marginTargetCents: data.marginTargetCents,
          newCustomersTarget: data.newCustomersTarget,
          conversionTargetBps: data.conversionTargetBps,
          updatedAt: occurredAt,
        },
      });

    await tx.insert(auditEvents).values({
      id: crypto.randomUUID(),
      organizationId: user.organizationId,
      actorId: user.id,
      entityType: "target",
      entityId: targetId,
      action: data.id ? "update" : "create",
      occurredAt,
    });
  });

  revalidatePath("/settings");
  return { ok: true as const };
}

export async function deleteTargetAction(input: unknown) {
  const user = await requireAdmin();
  const data = deleteTargetSchema.parse(input);
  const occurredAt = new Date();

  await getDb().transaction(async (tx) => {
    const existing = await tx.query.targets.findFirst({
      where: and(
        eq(targets.id, data.id),
        eq(targets.organizationId, user.organizationId),
      ),
    });
    if (!existing) {
      throw new Error("Não encontrado");
    }

    await tx
      .delete(targets)
      .where(
        and(
          eq(targets.id, data.id),
          eq(targets.organizationId, user.organizationId),
        ),
      );

    await tx.insert(auditEvents).values({
      id: crypto.randomUUID(),
      organizationId: user.organizationId,
      actorId: user.id,
      entityType: "target",
      entityId: data.id,
      action: "delete",
      occurredAt,
    });
  });

  revalidatePath("/settings");
  return { ok: true as const };
}

export async function updateOrganizationConfigAction(input: unknown) {
  const user = await requireAdmin();
  const data = updateOrganizationConfigSchema.parse(input);
  const current = await getOrganizationConfig(user.organizationId);

  await upsertOrganizationConfig(user.organizationId, {
    attentionDays: data.attentionDays,
    criticalDays: data.criticalDays,
    lossReasons: data.lossReasons,
  });

  await getDb().insert(auditEvents).values({
    id: crypto.randomUUID(),
    organizationId: user.organizationId,
    actorId: user.id,
    entityType: "organization_settings",
    entityId: user.organizationId,
    action: "update",
    metadata: {
      previousAttentionDays: current.attentionDays,
      previousCriticalDays: current.criticalDays,
    },
    occurredAt: new Date(),
  });

  revalidatePath("/settings");
  return { ok: true as const };
}
