# SalesOps Industrial Demo — Design System Master

Source: ui-ux-pro-max + product spec override (2026-08-24)

## Product
B2B industrial Sales Operations demo. Synthetic data. Audience: commercial coordinator / manager.

## Style (override)
- **Chosen:** Minimalism & Swiss (enterprise dashboard) — clean grid, high contrast, functional
- **Rejected from auto-rank:** Glassmorphism, purple/AI gradients, dark-by-default, heavy blur

## Colors
| Role | Hex | Use |
|------|-----|-----|
| Primary | `#172554` (blue-950) | Nav, primary CTA, key accents |
| Background | `#F1F5F9` (slate-100) | App canvas |
| Surface | `#FFFFFF` | Cards / panels |
| Foreground | `#0F172A` (slate-950) | Titles |
| Muted text | `#64748B` (slate-500) | Helpers |
| Border | `#E2E8F0` (slate-200) | Hairlines |
| Positive | `#15803D` (green-700) | Margin / ganho / on-target |
| Attention | `#B45309` (amber-700) | Warning / mid attainment |
| Risk | `#B91C1C` (red-700) | Alerts / perdido / off-target |
| Chart revenue | `#334155` | Bars |
| Chart secondary | `#0369A1` | Lines |

## Typography
- Root: Geist Sans / Geist Mono (existing Next font)
- Hierarchy: page title `text-2xl font-semibold`, section `text-base font-semibold`, KPI value `text-2xl`, helper `text-xs leading-5`
- No decorative display fonts on operational screens

## Effects
- Borders over shadows; soft `shadow-sm` only on sticky filter if needed
- Transitions 150–200ms; respect `prefers-reduced-motion`
- `cursor-pointer` on all clickable controls
- Visible `focus-visible` rings (slate/blue-950)

## Anti-patterns
- Glass / frost blur panels
- Emoji as icons (use Lucide)
- Color-only status (always pair with text/label)
- Blank empty states
