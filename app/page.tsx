import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  Database,
  Lock,
  ShieldCheck,
  Sparkles,
  Workflow,
} from "lucide-react";

import {
  DEMO_CREDENTIALS,
  isDemoProfileSwitcherEnabled,
} from "@/lib/security/demo-allowlist";

export const metadata = {
  title: "SalesOps Industrial Demo — Case de portfólio B2B",
  description:
    "Demo pública de Sales Operations para distribuidora industrial B2B. Dados sintéticos, stack Next.js + Turso + Auth.js.",
};

const stack = [
  { name: "Next.js 16", detail: "App Router, RSC, TypeScript strict" },
  { name: "Turso / libSQL", detail: "Postgres-like SQLite na edge (sem Supabase)" },
  { name: "Drizzle ORM", detail: "Schema tipado + migrations SQL" },
  { name: "Auth.js", detail: "Login credentials + RBAC no servidor" },
  { name: "Tailwind + Recharts", detail: "UI industrial + gráficos" },
  { name: "Vitest + Playwright", detail: "Regras de negócio e fluxo crítico" },
];

const modules = [
  {
    title: "Dashboard executivo",
    body: "Receita vs meta, pipeline ponderado, funil, rankings e ações do dia.",
    icon: BarChart3,
  },
  {
    title: "Clientes 360º",
    body: "Carteira, contatos, pedidos, oportunidades e scores de prioridade.",
    icon: Workflow,
  },
  {
    title: "Insights comerciais",
    body: "Recompra, risco de inatividade, oportunidades paradas e margem.",
    icon: Sparkles,
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-100 text-slate-950">
      <a
        href="#conteudo"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded focus:bg-white focus:px-3 focus:py-2 focus:shadow"
      >
        Ir para o conteúdo
      </a>

      <header className="border-b border-slate-200/80 bg-slate-100/90">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-blue-950">
              Case de portfólio
            </p>
            <p className="text-sm font-semibold text-slate-900">
              SalesOps Industrial Demo
            </p>
          </div>
          <nav className="flex items-center gap-2 sm:gap-3" aria-label="Atalhos">
            <a
              className="hidden cursor-pointer text-sm font-medium text-slate-600 hover:text-slate-950 sm:inline"
              href="#acesso"
            >
              Como entrar
            </a>
            <Link
              className="inline-flex h-10 cursor-pointer items-center rounded bg-blue-950 px-4 text-sm font-semibold text-white transition-colors hover:bg-blue-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-950"
              href="/login"
            >
              Entrar na demo
            </Link>
          </nav>
        </div>
      </header>

      <main id="conteudo">
        {/* Hero — uma composição */}
        <section className="relative overflow-hidden border-b border-slate-200 bg-blue-950 text-white">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 opacity-30"
            style={{
              backgroundImage:
                "linear-gradient(135deg, transparent 40%, rgba(255,255,255,0.08) 40%), linear-gradient(to right, rgba(15,23,42,0.2), transparent)",
            }}
          />
          <div className="relative mx-auto grid max-w-6xl gap-10 px-4 py-16 sm:px-6 sm:py-20 lg:grid-cols-[1.2fr_0.8fr] lg:items-end lg:py-24">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-200">
                SalesOps Industrial Demo
              </p>
              <h1 className="mt-4 max-w-2xl text-4xl font-semibold tracking-tight text-white sm:text-5xl">
                Operação comercial B2B industrial, em uma demo navegável.
              </h1>
              <p className="mt-5 max-w-xl text-base leading-7 text-blue-100/90">
                Case público de Sales Operations: priorizar clientes, pipeline em
                risco, recompra e margem — com dados 100% sintéticos.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  className="inline-flex h-11 cursor-pointer items-center gap-2 rounded bg-white px-5 text-sm font-semibold text-blue-950 transition-colors hover:bg-blue-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                  href="/login"
                >
                  Abrir a aplicação
                  <ArrowRight aria-hidden className="h-4 w-4" />
                </Link>
                <a
                  className="inline-flex h-11 cursor-pointer items-center rounded border border-white/30 px-5 text-sm font-semibold text-white transition-colors hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                  href="#acesso"
                >
                  Ver usuários demo
                </a>
              </div>
              <p className="mt-6 inline-flex items-center gap-2 rounded border border-white/15 bg-white/5 px-3 py-2 text-xs text-blue-100">
                <ShieldCheck aria-hidden className="h-4 w-4 shrink-0" />
                Dados demonstrativos e sintéticos · sem cadastro público
              </p>
            </div>
            <aside className="rounded-lg border border-white/15 bg-slate-950/40 p-5 text-sm text-blue-50/90">
              <p className="text-[11px] font-bold uppercase tracking-wide text-blue-200">
                Em 30 segundos
              </p>
              <ol className="mt-3 space-y-3 leading-6">
                <li>
                  <span className="font-semibold text-white">1.</span> Entre com
                  uma conta demo abaixo.
                </li>
                <li>
                  <span className="font-semibold text-white">2.</span> Explore
                  dashboard, clientes, pipeline e insights.
                </li>
                <li>
                  <span className="font-semibold text-white">3.</span> Compare o
                  papel Seller (sem margem) vs Admin.
                </li>
              </ol>
            </aside>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6" id="ideia">
          <h2 className="text-2xl font-semibold tracking-tight text-slate-950">
            A ideia do projeto
          </h2>
          <p className="mt-3 max-w-3xl text-base leading-7 text-slate-600">
            Simula a operação de uma distribuidora B2B de peças industriais. O
            objetivo não é um ERP gigante — é mostrar como dados de vendas e CRM
            ajudam um coordenador a decidir onde agir: quem priorizar, o que está
            em risco e onde a margem aperta.
          </p>
          <ul className="mt-8 grid gap-4 sm:grid-cols-3">
            {modules.map(({ title, body, icon: Icon }) => (
              <li
                key={title}
                className="border border-slate-200 bg-white p-5"
              >
                <Icon aria-hidden className="h-5 w-5 text-blue-950" />
                <h3 className="mt-3 text-base font-semibold text-slate-900">
                  {title}
                </h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">{body}</p>
              </li>
            ))}
          </ul>
        </section>

        <section
          className="border-y border-slate-200 bg-white"
          id="stack"
        >
          <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
            <div className="flex items-start gap-3">
              <Database aria-hidden className="mt-1 h-5 w-5 text-blue-950" />
              <div>
                <h2 className="text-2xl font-semibold tracking-tight text-slate-950">
                  Stack
                </h2>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                  Desvio consciente do brief original (Supabase): a demo usa Turso
                  + Auth.js para persistência e autenticação em deploy Vercel.
                </p>
              </div>
            </div>
            <dl className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {stack.map((item) => (
                <div
                  key={item.name}
                  className="border border-slate-200 bg-slate-50 px-4 py-3"
                >
                  <dt className="text-sm font-semibold text-slate-900">
                    {item.name}
                  </dt>
                  <dd className="mt-1 text-xs leading-5 text-slate-600">
                    {item.detail}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6" id="acesso">
          <div className="flex items-start gap-3">
            <Lock aria-hidden className="mt-1 h-5 w-5 text-blue-950" />
            <div>
              <h2 className="text-2xl font-semibold tracking-tight text-slate-950">
                Como entrar
              </h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                Não há auto-cadastro. Somente contas seed da allowlist autenticam.
                {isDemoProfileSwitcherEnabled()
                  ? " Use o Admin para o tour completo."
                  : " Credenciais de demonstração ficam no README do projeto."}
              </p>
            </div>
          </div>

          {isDemoProfileSwitcherEnabled() ? (
            <div className="mt-8 overflow-x-auto border border-slate-200 bg-white">
              <table className="w-full min-w-[36rem] text-left text-sm">
                <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-4 py-3 font-semibold" scope="col">
                      Papel
                    </th>
                    <th className="px-4 py-3 font-semibold" scope="col">
                      E-mail
                    </th>
                    <th className="px-4 py-3 font-semibold" scope="col">
                      Senha
                    </th>
                    <th className="px-4 py-3 font-semibold" scope="col">
                      Uso
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {DEMO_CREDENTIALS.map((row) => (
                    <tr
                      className="border-b border-slate-100 last:border-0"
                      key={row.email}
                    >
                      <td className="px-4 py-3 font-medium text-slate-900">
                        {row.role}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-slate-800">
                        {row.email}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-slate-800">
                        {row.password}
                      </td>
                      <td className="px-4 py-3 text-slate-600">{row.label}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}

          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              className="inline-flex h-11 cursor-pointer items-center gap-2 rounded bg-blue-950 px-5 text-sm font-semibold text-white hover:bg-blue-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-950"
              href="/login"
            >
              Ir para o login
              <ArrowRight aria-hidden className="h-4 w-4" />
            </Link>
          </div>
        </section>

        <section className="border-t border-slate-200 bg-slate-50">
          <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
            <h2 className="text-lg font-semibold text-slate-950">
              Avisos da demo pública
            </h2>
            <ul className="mt-4 grid gap-3 text-sm leading-6 text-slate-600 sm:grid-cols-2">
              <li className="border border-slate-200 bg-white p-4">
                Dados e previsões são <strong>sintéticos</strong> — não representam
                empresas ou pessoas reais.
              </li>
              <li className="border border-slate-200 bg-white p-4">
                Sem criação de contas. Login restrito à allowlist demo + rate limit.
              </li>
              <li className="border border-slate-200 bg-white p-4">
                Ambiente de portfólio: não use para dados reais nem processos
                produtivos.
              </li>
              <li className="border border-slate-200 bg-white p-4">
                Sessões curtas, headers de segurança e RBAC no servidor (Seller sem
                custo/margem).
              </li>
            </ul>
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-8 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <p>SalesOps Industrial Demo · case de portfólio</p>
          <p>Feito para LinkedIn / revisão técnica — não é produto comercial.</p>
        </div>
      </footer>
    </div>
  );
}
