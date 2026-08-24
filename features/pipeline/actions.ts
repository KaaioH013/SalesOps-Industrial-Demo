"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { getDb } from "@/db/client";
import { auditEvents, opportunities } from "@/db/schema";
import { auth } from "@/lib/auth/auth";
import {
  moveOpportunityStageSchema,
  type MoveOpportunityStageInput,
} from "@/lib/validations/opportunities";

export async function moveOpportunityStage(
  input: MoveOpportunityStageInput,
) {
  const data = moveOpportunityStageSchema.parse(input);
  const session = await auth();

  if (!session?.user) {
    throw new Error("Autenticação necessária");
  }

  const conditions = [
    eq(opportunities.id, data.id),
    eq(opportunities.organizationId, session.user.organizationId),
  ];

  if (session.user.role === "seller") {
    conditions.push(eq(opportunities.ownerId, session.user.id));
  }

  const current = await getDb().query.opportunities.findFirst({
    columns: { id: true, stage: true },
    where: and(...conditions),
  });

  if (!current) {
    throw new Error("Oportunidade não encontrada ou sem permissão");
  }

  const occurredAt = new Date();
  const isClosed = data.stage === "ganho" || data.stage === "perdido";

  await getDb().transaction(async (tx) => {
    await tx
      .update(opportunities)
      .set({
        stage: data.stage,
        stageChangedAt: occurredAt,
        lossReason: data.lossReason ?? null,
        closedAt: isClosed ? occurredAt : null,
        updatedAt: occurredAt,
      })
      .where(and(...conditions));

    await tx.insert(auditEvents).values({
      id: crypto.randomUUID(),
      organizationId: session.user.organizationId,
      actorId: session.user.id,
      entityType: "opportunity",
      entityId: data.id,
      action: "stage_change",
      metadata: {
        fromStage: current.stage,
        toStage: data.stage,
        ...(data.lossReason ? { lossReason: data.lossReason } : {}),
      },
      occurredAt,
    });
  });

  revalidatePath("/pipeline");
  revalidatePath(`/opportunities/${data.id}`);

  return { success: true as const };
}
