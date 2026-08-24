/**
 * Optional import of offline ML scores into customer_scores.
 *
 * The application works without running this script — the deterministic scoring
 * layer (features/scoring/recalculate.ts) remains the default path.
 *
 * Usage:
 *   npx tsx db/seed/import-ml-scores.ts [path-to-json]
 *
 * Default path: ml/output/customer_scores.json
 *
 * Environment: TURSO_DATABASE_URL (+ TURSO_AUTH_TOKEN when required).
 */

import { readFileSync } from "node:fs";
import path from "node:path";

import { and, eq, inArray } from "drizzle-orm";
import { z } from "zod";

import { getDb } from "../client";
import { customerScores, customers } from "../schema";

const scoreRowSchema = z.object({
  customerId: z.string().min(1),
  repurchaseScore: z.number().int().min(0).max(100),
  inactivityRiskScore: z.number().int().min(0).max(100),
  potentialScore: z.number().int().min(0).max(100),
  priorityScore: z.number().int().min(0).max(100),
  explanations: z.record(z.string(), z.unknown()),
});

const importPayloadSchema = z.object({
  version: z.literal(1),
  organizationId: z.string().min(1),
  calculatedAt: z.string().datetime(),
  model: z
    .object({
      name: z.string(),
      metrics: z.record(z.string(), z.unknown()).optional(),
    })
    .optional(),
  scores: z.array(scoreRowSchema).min(1),
});

type ImportPayload = z.infer<typeof importPayloadSchema>;

function resolveInputPath(arg?: string) {
  return path.resolve(arg ?? path.join(process.cwd(), "ml/output/customer_scores.json"));
}

function loadPayload(filePath: string): ImportPayload {
  const raw = readFileSync(filePath, "utf8");
  return importPayloadSchema.parse(JSON.parse(raw));
}

async function importMlScores(filePath: string) {
  const payload = loadPayload(filePath);
  const db = getDb();
  const calculatedAt = new Date(payload.calculatedAt);
  const now = new Date();
  const customerIds = payload.scores.map((row) => row.customerId);

  const existingCustomers = await db
    .select({ id: customers.id })
    .from(customers)
    .where(
      and(
        eq(customers.organizationId, payload.organizationId),
        inArray(customers.id, customerIds),
      ),
    );

  const validIds = new Set(existingCustomers.map((row) => row.id));
  const missingIds = customerIds.filter((id) => !validIds.has(id));

  if (missingIds.length > 0) {
    console.warn(
      `Skipping ${missingIds.length} unknown customer(s) for org ${payload.organizationId}: ${missingIds.join(", ")}`,
    );
  }

  const rows = payload.scores
    .filter((row) => validIds.has(row.customerId))
    .map((row) => ({
      id: crypto.randomUUID(),
      organizationId: payload.organizationId,
      customerId: row.customerId,
      repurchaseScore: row.repurchaseScore,
      inactivityRiskScore: row.inactivityRiskScore,
      potentialScore: row.potentialScore,
      priorityScore: row.priorityScore,
      explanations: row.explanations,
      calculatedAt,
      createdAt: now,
      updatedAt: now,
    }));

  if (rows.length === 0) {
    throw new Error("No valid customer scores to import");
  }

  await db.transaction(async (tx) => {
    await tx
      .delete(customerScores)
      .where(
        and(
          eq(customerScores.organizationId, payload.organizationId),
          inArray(customerScores.customerId, rows.map((row) => row.customerId)),
        ),
      );

    await tx.insert(customerScores).values(rows);
  });

  console.log(
    `Imported ${rows.length} ML score row(s) for organization ${payload.organizationId} from ${filePath}`,
  );
  console.log(
    "Note: recalculate scores in the app will overwrite these rows with deterministic scores.",
  );
}

async function main() {
  const filePath = resolveInputPath(process.argv[2]);
  await importMlScores(filePath);
}

main().catch((error: unknown) => {
  console.error("ML score import failed", error);
  process.exitCode = 1;
});
