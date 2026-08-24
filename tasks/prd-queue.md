# Ralph PRD Queue

Execute in order. When a phase outputs `<promise>COMPLETE</promise>`:

1. Archive is handled by `ralph.sh` / agent notes in `scripts/ralph/archive/`
2. Copy the next JSON file over `scripts/ralph/prd.json`
3. Keep `## Codebase Patterns` in `progress.txt`
4. Checkout/create the new `branchName`
5. Continue the loop without asking the human

| Order | File | Branch |
|------:|------|--------|
| 1 | `tasks/prd-p0-foundations.json` | `ralph/p0-foundations` |
| 2 | `tasks/prd-p1-customers.json` | `ralph/p1-customers` |
| 3 | `tasks/prd-p2-pipeline.json` | `ralph/p2-pipeline` |
| 4 | `tasks/prd-p3-dashboard.json` | `ralph/p3-dashboard` |
| 5 | `tasks/prd-p4-commerce.json` | `ralph/p4-commerce` |
| 6 | `tasks/prd-p5-insights.json` | `ralph/p5-insights` |
| 7 | `tasks/prd-p6-reports-settings.json` | `ralph/p6-reports-settings` |
| 8 | `tasks/prd-p7-hardening.json` | `ralph/p7-hardening` |
| 9 | `tasks/prd-p8-ml.json` | `ralph/p8-ml` |

Master plan: `docs/superpowers/plans/2026-08-24-salesops-industrial-demo.md`  
Spec: `docs/superpowers/specs/2026-08-24-salesops-industrial-demo-design.md`
