# SalesOps Industrial Demo

Aplicação demonstrativa de Sales Operations para distribuição industrial B2B,
feita com Next.js, Turso/libSQL, Drizzle ORM e Auth.js.

> Todos os nomes, documentos, usuários e dados comerciais deste projeto são
> sintéticos. Não use a aplicação nem as credenciais demo com dados reais.

A rota `/` é uma **landing de portfólio** (ideia, stack, como entrar). A app
protegida começa em `/login` → `/dashboard`.

## O problema e a proposta

Uma operação comercial precisa consultar sua carteira e registrar as próximas ações sem perder o contexto de cada cliente. Esta demonstração organiza dashboard, clientes e atividades em uma aplicação com diferentes níveis de acesso.

## O que explorar

| Recurso | O que demonstra |
| --- | --- |
| Dashboard e clientes | Organização da informação comercial em uma interface web |
| Registro de atividades | Acompanhamento das ações relacionadas a um cliente |
| Administrador, gerente e vendedor | Controle de acesso conforme a responsabilidade do usuário |
| Base sintética reproduzível | Ambiente para explorar o produto sem utilizar dados comerciais reais |

**Percurso sugerido:** execute a aplicação localmente, entre com um usuário demo, abra o dashboard, consulte um cliente e registre uma atividade.

O projeto inclui testes de autorização e um fluxo E2E documentado abaixo. A base completa de demonstração contém 350 clientes e 2.500 pedidos sintéticos; esses números descrevem o cenário de teste, não clientes atendidos ou resultados reais.

[Ler case study e gerar as capturas de portfólio →](docs/portfolio/CASE_STUDY.md)

[← Voltar ao portfólio](https://github.com/KaaioH013)

## Segurança da demo pública

- **Sem cadastro**: só autenticam e-mails da allowlist `*@demo.local` seed.
- **Rate limit** em `/api/auth` (POST) e exports CSV.
- **Sessão JWT** com validade de 8h.
- **Headers**: `X-Frame-Options`, `nosniff`, CSP básica, `poweredBy` desligado.
- **RBAC** no servidor (Seller sem custo/margem).
- `DEMO_PROFILE_SWITCHER` desligado em produção por padrão.
- Cron exige `CRON_SECRET`.

Isso reduz abuso casual; não substitui WAF/Firewall em escala.

## Requisitos

- Node.js 20 ou superior
- npm
- Conta Turso e conta Vercel apenas para deploy

## Instalação local

```bash
git clone https://github.com/KaaioH013/SalesOps-Industrial-Demo.git
cd SalesOps-Industrial-Demo
npm ci
```

Copie `.env.example` para `.env` e configure um segredo local:

```bash
cp .env.example .env
```

```env
TURSO_DATABASE_URL=file:./local.db
TURSO_AUTH_TOKEN=
AUTH_SECRET=substitua-por-um-segredo-longo-e-aleatorio
CRON_SECRET=substitua-por-outro-segredo-longo-e-aleatorio
DEMO_PROFILE_SWITCHER=true
```

No PowerShell, `Copy-Item .env.example .env` substitui o comando `cp`.

### Banco local

O modo local usa `file:./local.db` e não exige token Turso:

```bash
npm run db:migrate
npm run db:seed
npm run dev
```

Acesse `http://localhost:3000`.

### Banco Turso

Crie o banco e obtenha as credenciais com a CLI do Turso:

```bash
turso auth login
turso db create salesops-industrial-demo
turso db show salesops-industrial-demo --url
turso db tokens create salesops-industrial-demo
```

Defina `TURSO_DATABASE_URL` e `TURSO_AUTH_TOKEN` no `.env`, depois execute:

```bash
npm run db:migrate
npm run db:seed
npm run dev
```

As migrations e o seed atuam no banco indicado por `TURSO_DATABASE_URL`.

## Seeds

`npm run db:seed` cria o conjunto mínimo, suficiente para navegar e executar o
teste E2E. O seed completo é determinístico (seed `42`) e cria 350 clientes,
2.500 pedidos e cerca de 5.000 itens:

```bash
npm run db:seed -- --full
```

Para um smoke test menor do gerador completo:

```powershell
$env:FULL_SEED_MAX_CUSTOMERS="10"
npm run db:seed -- --full
```

## Credenciais demo

| Perfil        | E-mail               | Senha             |
| ------------- | -------------------- | ----------------- |
| Administrador | `admin@demo.local`   | `DemoAdmin!123`   |
| Gerente       | `manager@demo.local` | `DemoManager!123` |
| Vendedor      | `seller@demo.local`  | `DemoSeller!123`  |

Essas credenciais são públicas e servem somente para a demonstração.

## Variáveis de ambiente

| Variável                | Obrigatória | Uso |
| ----------------------- | ----------- | --- |
| `TURSO_DATABASE_URL`    | Sim         | URL `libsql://...` do Turso ou `file:./local.db` |
| `TURSO_AUTH_TOKEN`      | No Turso    | Token de acesso ao banco; deixe vazio com `file:` |
| `AUTH_SECRET`           | Sim         | Assina tokens e sessões do Auth.js |
| `CRON_SECRET`           | Sim         | Protege `GET /api/cron/recalculate-scores` |
| `DEMO_PROFILE_SWITCHER` | Não         | Reserva a opção de troca de perfil demo |
| `FULL_SEED_MAX_CUSTOMERS` | Não       | Limita clientes somente no seed completo |
| `PLAYWRIGHT_BASE_URL`   | Não         | Alvo E2E; padrão `http://localhost:3000` |

Use segredos diferentes, longos e aleatórios em produção. Nunca envie `.env`
ou tokens Turso ao repositório.

## Qualidade e testes

```bash
npm run lint
npm run typecheck
npm run test
```

O caminho crítico do Playwright autentica como administrador, abre um cliente e
cria uma atividade. Prepare o banco local antes da primeira execução:

```bash
npm run db:migrate
npm run db:seed
npx playwright install chromium
npm run test:e2e
```

O Playwright inicia `npm run dev` automaticamente e usa `file:./local.db` quando
`TURSO_DATABASE_URL` não está definida. Para testar um servidor já ativo:

```bash
PLAYWRIGHT_BASE_URL=http://localhost:3000 npm run test:e2e
```

No PowerShell:

```powershell
$env:PLAYWRIGHT_BASE_URL="http://localhost:3000"
npm run test:e2e
```

## Checklist de deploy na Vercel

1. Crie o banco Turso e guarde a URL e o token.
2. Aponte o `.env` local para o Turso e execute `npm run db:migrate`.
3. Execute `npm run db:seed` ou `npm run db:seed -- --full` uma única vez.
4. Importe o repositório na Vercel.
5. Cadastre `TURSO_DATABASE_URL`, `TURSO_AUTH_TOKEN`, `AUTH_SECRET`,
   `CRON_SECRET` e `DEMO_PROFILE_SWITCHER=false` no projeto Vercel.
6. Confirme os comandos padrão: build `npm run build` e install `npm ci`.
7. Faça o deploy e valide login, dashboard, clientes e criação de atividade.
8. Configure um Vercel Cron para `/api/cron/recalculate-scores` e envie
   `Authorization: Bearer <CRON_SECRET>`.
9. Execute `npm run lint`, `npm run typecheck`, `npm run test` e, contra o
   deploy, `PLAYWRIGHT_BASE_URL=<url> npm run test:e2e`.

O arquivo SQLite local não é persistência adequada para funções serverless.
Produção deve usar a URL remota do Turso.

## Decisão de arquitetura: Supabase para Turso/Auth.js

O escopo inicial previa Supabase Postgres, Supabase Auth e RLS. Este projeto usa
Turso/libSQL com Drizzle e Auth.js Credentials porque a cota Supabase disponível
estava esgotada e o conjunto de dados é demonstrativo.

A autorização foi movida para consultas e Server Actions no servidor. O papel e
a organização vêm da sessão Auth.js; vendedores são limitados à própria
carteira e não recebem custo ou margem. Os testes de RBAC protegem essa regra.
Esta implementação não oferece RLS no banco nem deve ser tratada como substituta
direta de Supabase em um sistema com dados reais.

## Scripts

| Script                      | Descrição |
| --------------------------- | --------- |
| `npm run dev`               | Servidor de desenvolvimento |
| `npm run build`             | Build de produção |
| `npm run lint`              | ESLint |
| `npm run typecheck`         | Verificação TypeScript |
| `npm run test`              | Testes Vitest |
| `npm run test:e2e`          | Testes Playwright |
| `npm run db:generate`       | Gera migrations Drizzle |
| `npm run db:migrate`        | Aplica migrations |
| `npm run db:seed`           | Carrega o seed mínimo |
| `npm run db:seed -- --full` | Carrega o seed completo |
