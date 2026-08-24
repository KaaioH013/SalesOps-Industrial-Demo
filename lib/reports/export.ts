import type { ReportResult } from "@/db/queries/reports";
import { formatBRL } from "@/lib/formatters/currency";
import { formatDatePtBR } from "@/lib/formatters/date";
import { formatPercent } from "@/lib/formatters/percent";
import { rowsToCsv } from "@/lib/reports/csv";
import type { Role } from "@/lib/permissions/roles";
import { canViewMargin } from "@/lib/permissions/roles";

function money(cents: number) {
  return formatBRL(cents / 100);
}

function margin(bps: number | null) {
  return bps == null ? "" : formatPercent(bps / 10_000, 1);
}

export function buildReportCsv(result: ReportResult, role: Role): string {
  if (result.type === "orders") {
    const headers = [
      "Pedido",
      "Data",
      "Status",
      "Cliente",
      "Segmento",
      "Vendedor",
      "Território",
      "Receita",
      ...(canViewMargin(role) ? ["Custo", "Margem"] : []),
    ];
    const rows = result.rows.map((row) => [
      row.number,
      formatDatePtBR(row.orderedAt),
      row.statusLabel,
      row.customerName,
      row.segment,
      row.sellerName ?? "",
      row.territoryName ?? "",
      money(row.revenueCents),
      ...(canViewMargin(role)
        ? [
            row.costCents == null ? "" : money(row.costCents),
            margin(row.grossMarginBps),
          ]
        : []),
    ]);
    return rowsToCsv(headers, rows);
  }

  if (result.type === "pipeline") {
    const headers = [
      "Oportunidade",
      "Estágio",
      "Cliente",
      "Vendedor",
      "Território",
      "Valor estimado",
      "Probabilidade (%)",
      "Valor ponderado",
      "Previsão de fechamento",
      "Motivo da perda",
    ];
    const rows = result.rows.map((row) => [
      row.title,
      row.stageLabel,
      row.customerName,
      row.sellerName ?? "",
      row.territoryName ?? "",
      money(row.estimatedValueCents),
      row.probability,
      money(row.weightedValueCents),
      row.expectedCloseAt ? formatDatePtBR(row.expectedCloseAt) : "",
      row.lossReason ?? "",
    ]);
    return rowsToCsv(headers, rows);
  }

  if (result.type === "customers") {
    const headers = [
      "Cliente",
      "Segmento",
      "Status",
      "Território",
      "Vendedor",
      "Cadastro",
      "Última compra",
      "Receita no período",
      "Pedidos no período",
    ];
    const rows = result.rows.map((row) => [
      row.tradeName,
      row.segment,
      row.status,
      row.territoryName ?? "",
      row.sellerName ?? "",
      formatDatePtBR(row.registeredAt),
      row.lastPurchaseAt ? formatDatePtBR(row.lastPurchaseAt) : "",
      money(row.revenueCents),
      row.orders,
    ]);
    return rowsToCsv(headers, rows);
  }

  const headers = [
    "Território",
    "Clientes",
    "Pedidos",
    "Receita",
    ...(canViewMargin(role) ? ["Custo", "Margem"] : []),
  ];
  const rows = result.rows.map((row) => [
    row.name,
    row.customers,
    row.orders,
    money(row.revenueCents),
    ...(canViewMargin(role)
      ? [
          row.costCents == null ? "" : money(row.costCents),
          margin(row.grossMarginBps),
        ]
      : []),
  ]);
  return rowsToCsv(headers, rows);
}

export function reportExportFilename(type: ReportResult["type"]) {
  const stamp = new Date().toISOString().slice(0, 10);
  return `relatorio-${type}-${stamp}.csv`;
}
