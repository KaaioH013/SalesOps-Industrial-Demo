import { and, asc, desc, eq, like, or, type SQL } from "drizzle-orm";

import {
  buildStalenessExplanation,
  daysInStage,
  daysSinceActivity,
  stalenessLevel,
  weightedValue,
  type StalenessLevel,
} from "@/lib/analytics/opportunity-risk";

import { getDb } from "../client";
import {
  activities,
  auditEvents,
  customers,
  opportunities,
  profiles,
} from "../schema";
import type {
  ActivityStatus,
  ActivityType,
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

export type OpportunityTimelineActivity = {
  kind: "activity";
  id: string;
  subject: string;
  type: ActivityType;
  status: ActivityStatus;
  occurredAt: Date;
  description: string | null;
  ownerName: string | null;
};

export type OpportunityTimelineStageChange = {
  kind: "stage_change";
  id: string;
  occurredAt: Date;
  fromStage: OpportunityStage | null;
  toStage: OpportunityStage;
  actorName: string | null;
  lossReason: string | null;
};

export type OpportunityTimelineItem =
  | OpportunityTimelineActivity
  | OpportunityTimelineStageChange;

export type OpportunityDetail = {
  id: string;
  title: string;
  stage: OpportunityStage;
  priority: OpportunityPriority;
  source: string | null;
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
  riskExplanation: string;
  stageChangedAt: Date;
  lastActivityAt: Date | null;
  closedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  timeline: OpportunityTimelineItem[];
};

function isOpportunityStage(value: unknown): value is OpportunityStage {
  return (
    typeof value === "string" &&
    [
      "novo",
      "qualificacao",
      "diagnostico",
      "proposta",
      "negociacao",
      "ganho",
      "perdido",
    ].includes(value)
  );
}

export async function getOpportunityDetail(
  params: OpportunityAccessParams & { id: string },
): Promise<OpportunityDetail | null> {
  const conditions = [
    ...opportunityScopeConditions(params),
    eq(opportunities.id, params.id),
  ];

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
    .limit(1);

  const row = rows[0];

  if (!row) {
    return null;
  }

  const { opportunity, customer, owner } = row;

  const [activityRows, auditRows] = await Promise.all([
    getDb()
      .select({
        activity: activities,
        owner: {
          name: profiles.name,
        },
      })
      .from(activities)
      .leftJoin(profiles, eq(activities.ownerId, profiles.id))
      .where(
        and(
          eq(activities.organizationId, params.organizationId),
          eq(activities.opportunityId, params.id),
        ),
      )
      .orderBy(desc(activities.scheduledAt)),
    getDb()
      .select({
        event: auditEvents,
        actor: {
          name: profiles.name,
        },
      })
      .from(auditEvents)
      .leftJoin(profiles, eq(auditEvents.actorId, profiles.id))
      .where(
        and(
          eq(auditEvents.organizationId, params.organizationId),
          eq(auditEvents.entityType, "opportunity"),
          eq(auditEvents.entityId, params.id),
        ),
      )
      .orderBy(desc(auditEvents.occurredAt)),
  ]);

  const now = new Date();
  const activityDays = opportunity.lastActivityAt
    ? Math.max(0, daysSinceActivity(opportunity.lastActivityAt, now))
    : null;
  const daysInStageCount = Math.max(
    0,
    daysInStage(opportunity.stageChangedAt, now),
  );
  const staleness =
    activityDays == null ? "critical" : stalenessLevel(activityDays);

  const timelineActivities: OpportunityTimelineActivity[] = activityRows.map(
    ({ activity, owner: activityOwner }) => ({
      kind: "activity",
      id: activity.id,
      subject: activity.subject,
      type: activity.type,
      status: activity.status,
      occurredAt: activity.completedAt ?? activity.scheduledAt,
      description: activity.description,
      ownerName: activityOwner?.name ?? null,
    }),
  );

  const timelineStageChanges: OpportunityTimelineStageChange[] = auditRows
    .filter(({ event }) => event.action === "stage_change")
    .map(({ event, actor }) => {
      const metadata = event.metadata ?? {};
      const fromStage = isOpportunityStage(metadata.fromStage)
        ? metadata.fromStage
        : null;
      const toStage = isOpportunityStage(metadata.toStage)
        ? metadata.toStage
        : opportunity.stage;

      return {
        kind: "stage_change" as const,
        id: event.id,
        occurredAt: event.occurredAt,
        fromStage,
        toStage,
        actorName: actor?.name ?? null,
        lossReason:
          typeof metadata.lossReason === "string" ? metadata.lossReason : null,
      };
    });

  const timeline = [...timelineActivities, ...timelineStageChanges].sort(
    (left, right) => right.occurredAt.getTime() - left.occurredAt.getTime(),
  );

  return {
    id: opportunity.id,
    title: opportunity.title,
    stage: opportunity.stage,
    priority: opportunity.priority,
    source: opportunity.source,
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
    daysInStage: daysInStageCount,
    daysSinceActivity: activityDays,
    staleness,
    riskExplanation: buildStalenessExplanation(
      staleness,
      activityDays,
      daysInStageCount,
    ),
    stageChangedAt: opportunity.stageChangedAt,
    lastActivityAt: opportunity.lastActivityAt,
    closedAt: opportunity.closedAt,
    createdAt: opportunity.createdAt,
    updatedAt: opportunity.updatedAt,
    timeline,
  };
}
