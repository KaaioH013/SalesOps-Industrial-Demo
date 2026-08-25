"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { getDb } from "@/db/client";
import {
  activities,
  auditEvents,
  customers,
  opportunities,
} from "@/db/schema";
import { auth } from "@/lib/auth/auth";
import {
  createActivitySchema,
  createOpportunitySchema,
  type CreateActivityInput,
  type CreateOpportunityInput,
} from "@/lib/validations/crm";

async function requireCustomerAccess(customerId: string) {
  const session = await auth();

  if (!session?.user) {
    throw new Error("Não autorizado");
  }

  const conditions = [
    eq(customers.id, customerId),
    eq(customers.organizationId, session.user.organizationId),
  ];

  if (session.user.role === "seller") {
    conditions.push(eq(customers.sellerId, session.user.id));
  }

  const customer = await getDb().query.customers.findFirst({
    columns: { id: true },
    where: and(...conditions),
  });

  if (!customer) {
    throw new Error("Não encontrado");
  }

  return session.user;
}

export async function createCustomerActivity(input: CreateActivityInput) {
  const data = createActivitySchema.parse(input);
  const user = await requireCustomerAccess(data.customerId);
  const activityId = crypto.randomUUID();
  const occurredAt = new Date();

  await getDb().transaction(async (tx) => {
    await tx.insert(activities).values({
      id: activityId,
      organizationId: user.organizationId,
      customerId: data.customerId,
      ownerId: user.id,
      type: data.type,
      status: data.status,
      subject: data.subject,
      description: data.description,
      scheduledAt: data.scheduledAt,
    });

    await tx.insert(auditEvents).values({
      id: crypto.randomUUID(),
      organizationId: user.organizationId,
      actorId: user.id,
      entityType: "activity",
      entityId: activityId,
      action: "create",
      occurredAt,
    });
  });

  revalidatePath("/customers/[id]", "page");

  return { success: true as const, id: activityId };
}

export async function createCustomerOpportunity(input: CreateOpportunityInput) {
  const data = createOpportunitySchema.parse(input);
  const user = await requireCustomerAccess(data.customerId);
  const opportunityId = crypto.randomUUID();
  const occurredAt = new Date();

  await getDb().transaction(async (tx) => {
    await tx.insert(opportunities).values({
      id: opportunityId,
      organizationId: user.organizationId,
      customerId: data.customerId,
      ownerId: user.id,
      title: data.title,
      stage: data.stage,
      source: data.source,
      estimatedValueCents: data.estimatedValueCents,
      probability: data.probability,
      expectedCloseAt: data.expectedCloseAt,
      priority: data.priority,
      nextStep: data.nextStep,
    });

    await tx.insert(auditEvents).values({
      id: crypto.randomUUID(),
      organizationId: user.organizationId,
      actorId: user.id,
      entityType: "opportunity",
      entityId: opportunityId,
      action: "create",
      occurredAt,
    });
  });

  revalidatePath("/customers/[id]", "page");

  return { success: true as const, id: opportunityId };
}
