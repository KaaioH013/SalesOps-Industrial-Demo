import { organizationSettings } from "@/db/schema";
import { ATTENTION_DAYS, CRITICAL_DAYS } from "@/lib/analytics/alert-thresholds";
import {
  DEFAULT_LOSS_REASONS,
  serializeLossReasons,
} from "@/lib/settings/loss-reasons";

export function defaultOrganizationSettings(organizationId: string) {
  return {
    organizationId,
    attentionDays: ATTENTION_DAYS,
    criticalDays: CRITICAL_DAYS,
    lossReasonsJson: serializeLossReasons([...DEFAULT_LOSS_REASONS]),
    updatedAt: new Date(),
  } satisfies typeof organizationSettings.$inferInsert;
}
