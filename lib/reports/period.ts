export const REPORT_PERIODS = [
  { value: "3m", label: "Últimos 3 meses", months: 3 },
  { value: "6m", label: "Últimos 6 meses", months: 6 },
  { value: "12m", label: "Últimos 12 meses", months: 12 },
  { value: "ytd", label: "Ano atual", months: 0 },
] as const;

export type ReportPeriodValue = (typeof REPORT_PERIODS)[number]["value"];

export function resolveReportPeriod(value: string | undefined) {
  const selected =
    REPORT_PERIODS.find((period) => period.value === value) ?? REPORT_PERIODS[2];
  const to = new Date();
  const from =
    selected.value === "ytd"
      ? new Date(Date.UTC(to.getUTCFullYear(), 0, 1))
      : new Date(
          Date.UTC(
            to.getUTCFullYear(),
            to.getUTCMonth() - selected.months + 1,
            1,
          ),
        );

  return { selected: selected.value, from, to };
}
