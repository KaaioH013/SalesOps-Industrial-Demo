# SalesOps Industrial Demo

Demonstração sintética de Sales Ops industrial B2B — Next.js, Turso, Auth.js, Drizzle.

## Pré-requisitos

- Node.js 20+
- npm

## Configuração

Copie `.env.example` para `.env` e preencha as variáveis:

```bash
cp .env.example .env
```

| Variável | Descrição |
|----------|-----------|
| `TURSO_DATABASE_URL` | URL do banco Turso/libSQL |
| `TURSO_AUTH_TOKEN` | Token de autenticação Turso |
| `AUTH_SECRET` | Segredo para Auth.js |
| `CRON_SECRET` | Segredo para rotas cron |
| `DEMO_PROFILE_SWITCHER` | Habilita troca de perfil demo (`true`/`false`) |

## Scripts

| Script | Descrição |
|--------|-----------|
| `npm run dev` | Servidor de desenvolvimento |
| `npm run build` | Build de produção |
| `npm run lint` | ESLint |
| `npm run typecheck` | Verificação TypeScript |
| `npm run test` | Testes unitários (Vitest) |
| `npm run test:e2e` | Testes E2E (Playwright) |
| `npm run db:generate` | Gera migrations Drizzle |
| `npm run db:migrate` | Aplica migrations |
| `npm run db:seed` | Popula dados demo |

## Estrutura preservada

Este repositório mantém documentação Ralph/Superpowers em `docs/`, `scripts/`, `.cursor/`, `tasks/` e `AGENTS.md`.

## Badge

> Dados demonstrativos e sintéticos
