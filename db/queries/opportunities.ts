import { and, asc, eq, like, or, type SQL } from "drizzle-orm";

import {
  daysInStage,
  daysSinceActivity,
  stalenessLevel,
  weightedValue,
  type StalenessLevel,
} from "@/lib/analytics/opportunity-risk";

import { getDb } from "../client";
import { customers, opportunities, profiles } from "../schema";
import type {
  OpportunityPriority,
  OpportunityStage,
  ProfileRole,
} from "../schema/enums";

type OpportunityAccessParams = {
  organizationId: string;
  role: ProfileRole;
  userId: string;
};

type OpportunityAccessRecord = {
  organizationId: string;
  ownerId: string | null;
};

export function filterOpportunitiesByAccess<T extends OpportunityAccessRecord>(
  records: readonly T[],
  params: OpportunityAccessParams,
): T[] {
  return records.filter(
    (record) =>
      record.organizationId === params.organizationId &&
      (params.role !== "seller" || record.ownerId === params.userId),
  );
}

function opportunityScopeConditions(params: OpportunityAccessParams): SQL[] {
  const conditions: SQL[] = [
    eq(opportunities.organizationId, params.organizationId),
  ];

  if (params.role === "seller") {
    conditions.push(eq(opportunities.ownerId, params.userId));
  }

  return conditions;
}

export type OpportunityListRow = {
  id: string;
  title: string;
  stage: OpportunityStage;
  priority: OpportunityPriority;
  customer: { id: string; name: string };
  owner: { id: string; name: string; email: string } | null;
  estimatedValueCents: number;
  probability: number;
  weightedValueCents: number;
  expectedCloseAt: Date | null;
  nextStep: string | null;
  lossReason: string | null;
  daysInStage: number;
  daysSinceActivity: number | null;
  staleness: StalenessLevel;
};

export async function listOpportunities(
  params: OpportunityAccessParams & { q?: string },
): Promise<OpportunityListRow[]> {
  const conditions = opportunityScopeConditions(params);
  const search = params.q?.trim();

  if (search) {
    const pattern = `%${search}%`;
    conditions.push(
      or(
        like(opportunities.title, pattern),
        like(customers.tradeName, pattern),
        like(customers.legalName, pattern),
      )!,
    );
  }

  const rows = await getDb()
    .select({
      opportunity: opportunities,
      customer: {
        id: customers.id,
        tradeName: customers.tradeName,
      },
      owner: {
        id: profiles.id,
        name: profiles.name,
        email: profiles.email,
      },
    })
    .from(opportunities)
    .innerJoin(customers, eq(opportunities.customerId, customers.id))
    .leftJoin(profiles, eq(opportunities.ownerId, profiles.id))
    .where(and(...conditions))
    .orderBy(asc(opportunities.stage), asc(opportunities.stageChangedAt));

  const now = new Date();

  return rows.map(({ opportunity, customer, owner }) => {
    const activityDays = opportunity.lastActivityAt
      ? Math.max(0, daysSinceActivity(opportunity.lastActivityAt, now))
      : null;

    return {
      id: opportunity.id,
      title: opportunity.title,
      stage: opportunity.stage,
      priority: opportunity.priority,
      customer: {
        id: customer.id,
        name: customer.tradeName,
      },
      owner: owner?.id ? owner : null,
      estimatedValueCents: opportunity.estimatedValueCents,
      probability: opportunity.probability,
      weightedValueCents: Math.round(
        weightedValue(
          opportunity.estimatedValueCents,
          opportunity.probability / 100,
        ),
      ),
      expectedCloseAt: opportunity.expectedCloseAt,
      nextStep: opportunity.nextStep,
      lossReason: opportunity.lossReason,
      daysInStage: Math.max(
        0,
        daysInStage(opportunity.stageChangedAt, now),
      ),
      daysSinceActivity: activityDays,
      staleness: activityDays == null ? "critical" : stalenessLevel(activityDays),
    };
  });
}
