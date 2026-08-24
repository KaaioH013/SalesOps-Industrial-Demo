# Page override: Dashboard

Overrides `MASTER.md` for `/dashboard`.

## Layout
1. Page header + sticky filter strip (period, territory, segment, seller)
2. KPI grid with **bullet-style attainment** vs target (not gauges)
3. Evolution chart (2 cols) + Funnel (1 col) with **accessible stage table**
4. Rankings + Pareto
5. Alerts + Recommended actions (“Operação de hoje”)

## Charts
- Funnel: horizontal bars + text labels + conversion context; color supplementary only
- Time series: composed bar+line; legend with names
- Pareto: area with % labels in tooltip

## UX
- Empty: message + guidance to adjust filters / seed
- Filters: labeled selects, `min-h-11`, focus rings, submit CTA primary blue-950
- KPI tone: green ≥100% meta, amber 70–99%, red <70% (text + bar)
