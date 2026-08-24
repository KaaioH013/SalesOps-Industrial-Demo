import { describe, expect, it } from "vitest";

import { escapeCsvCell, rowsToCsv } from "@/lib/reports/csv";
import { buildReportCsv } from "@/lib/reports/export";

describe("csv helpers", () => {
  it("escapa valores com vírgula e aspas", () => {
    expect(escapeCsvCell('Empresa "A", Ltda')).toBe('"Empresa ""A"", Ltda"');
  });

  it("gera CSV com BOM e cabeçalho", () => {
    const csv = rowsToCsv(["Coluna"], [["valor"]]);
    expect(csv.startsWith("\uFEFFColuna")).toBe(true);
    expect(csv).toContain("valor");
  });
});

describe("buildReportCsv", () => {
  it("remove custo e margem do CSV de pedidos para vendedor", () => {
    const csv = buildReportCsv(
      {
        type: "orders",
        total: 1,
        page: 1,
        pageSize: 1,
        totalPages: 1,
        rows: [
          {
            id: "order-1",
            number: "PED-001",
            orderedAt: new Date("2026-01-15T12:00:00.000Z"),
            status: "confirmed",
            statusLabel: "Confirmado",
            customerName: "Cliente Demo",
            sellerName: "Vendedor",
            territoryName: "Sudeste",
            segment: "Industrial",
            revenueCents: 100_000,
            costCents: null,
            grossMarginBps: null,
          },
        ],
      },
      "seller",
    );

    expect(csv).toContain("Receita");
    expect(csv).not.toContain("Custo");
    expect(csv).not.toContain("Margem");
  });

  it("inclui custo e margem para gerente", () => {
    const csv = buildReportCsv(
      {
        type: "orders",
        total: 1,
        page: 1,
        pageSize: 1,
        totalPages: 1,
        rows: [
          {
            id: "order-1",
            number: "PED-001",
            orderedAt: new Date("2026-01-15T12:00:00.000Z"),
            status: "confirmed",
            statusLabel: "Confirmado",
            customerName: "Cliente Demo",
            sellerName: "Vendedor",
            territoryName: "Sudeste",
            segment: "Industrial",
            revenueCents: 100_000,
            costCents: 70_000,
            grossMarginBps: 3_000,
          },
        ],
      },
      "manager",
    );

    expect(csv).toContain("Custo");
    expect(csv).toContain("Margem");
  });
});
