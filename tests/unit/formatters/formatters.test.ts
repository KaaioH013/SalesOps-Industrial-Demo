import { describe, it, expect } from "vitest";
import { formatBRL } from "@/lib/formatters/currency";
import { formatDatePtBR } from "@/lib/formatters/date";
import { formatPercent } from "@/lib/formatters/percent";

const expectedBRL = (n: number) =>
  new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(n);

describe("formatBRL", () => {
  it("formats numbers as BRL currency in pt-BR", () => {
    expect(formatBRL(1234.56)).toBe(expectedBRL(1234.56));
  });

  it("formats zero", () => {
    expect(formatBRL(0)).toBe(expectedBRL(0));
  });

  it("formats negative values", () => {
    expect(formatBRL(-99.9)).toBe(expectedBRL(-99.9));
  });
});

describe("formatDatePtBR", () => {
  it("formats Date as dd/MM/yyyy", () => {
    expect(formatDatePtBR(new Date(2024, 2, 15))).toBe("15/03/2024");
  });

  it("formats ISO date strings", () => {
    expect(formatDatePtBR("2024-03-15")).toBe("15/03/2024");
  });
});

describe("formatPercent", () => {
  it("formats ratio 0-1 as percent", () => {
    expect(formatPercent(0.4)).toBe("40%");
  });

  it("formats zero ratio", () => {
    expect(formatPercent(0)).toBe("0%");
  });

  it("respects optional decimal digits", () => {
    expect(formatPercent(0.405, 1)).toBe("40,5%");
  });
});
