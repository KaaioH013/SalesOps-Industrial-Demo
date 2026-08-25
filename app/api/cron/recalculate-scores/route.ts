import { NextRequest, NextResponse } from "next/server";

import { getDb } from "@/db/client";
import { organizations } from "@/db/schema";
import { recalculateOrganizationScores } from "@/features/scoring/recalculate";
import { isCronAuthorized } from "@/lib/security/cron-auth";

export async function GET(request: NextRequest) {
  if (!isCronAuthorized(request.headers.get("authorization"))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const organizationRows = await getDb()
    .select({ id: organizations.id })
    .from(organizations);

  const results = [];
  for (const organization of organizationRows) {
    results.push(await recalculateOrganizationScores(organization.id));
  }

  return NextResponse.json({
    ok: true,
    organizations: results.length,
    results,
  });
}
