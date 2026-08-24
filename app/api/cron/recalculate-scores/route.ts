import { NextRequest, NextResponse } from "next/server";

import { getDb } from "@/db/client";
import { organizations } from "@/db/schema";
import { recalculateOrganizationScores } from "@/features/scoring/recalculate";

function isAuthorized(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;

  const bearer = request.headers.get("authorization");
  const querySecret = request.nextUrl.searchParams.get("secret");
  return bearer === `Bearer ${secret}` || querySecret === secret;
}

export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const organizationRows = await getDb().select({ id: organizations.id }).from(organizations);
  const results = await Promise.all(
    organizationRows.map((organization) => recalculateOrganizationScores(organization.id)),
  );

  return NextResponse.json({
    ok: true,
    organizations: results.length,
    results,
  });
}
