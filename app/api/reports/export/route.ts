import { NextRequest, NextResponse } from "next/server";

import {
  listReportRows,
  REPORT_EXPORT_MAX_ROWS,
  REPORT_TYPES,
  type ReportType,
} from "@/db/queries/reports";
import { auth } from "@/lib/auth/auth";
import {
  buildReportCsv,
  reportExportFilename,
} from "@/lib/reports/export";
import { resolveReportPeriod } from "@/lib/reports/period";

function parseReportType(value: string | null): ReportType | null {
  if (!value) return null;
  return REPORT_TYPES.includes(value as ReportType)
    ? (value as ReportType)
    : null;
}

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const params = request.nextUrl.searchParams;
  const type = parseReportType(params.get("type"));
  if (!type) {
    return NextResponse.json({ error: "Tipo de relatório inválido" }, { status: 400 });
  }

  const period = resolveReportPeriod(params.get("period") ?? undefined);
  const result = await listReportRows({
    organizationId: session.user.organizationId,
    role: session.user.role,
    userId: session.user.id,
    type,
    from: period.from,
    to: period.to,
    territoryId: params.get("territoryId") || undefined,
    segment: params.get("segment") || undefined,
    sellerId:
      session.user.role === "seller"
        ? session.user.id
        : params.get("sellerId") || undefined,
    limit: REPORT_EXPORT_MAX_ROWS,
  });

  if (result.total > REPORT_EXPORT_MAX_ROWS) {
    return NextResponse.json(
      {
        error: `Exportação limitada a ${REPORT_EXPORT_MAX_ROWS.toLocaleString("pt-BR")} linhas. Refine os filtros.`,
      },
      { status: 400 },
    );
  }

  const csv = buildReportCsv(result, session.user.role);
  const filename = reportExportFilename(type);

  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
