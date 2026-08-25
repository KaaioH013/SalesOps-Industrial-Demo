import Link from "next/link";
import { ArrowRight, Database, Lock, ShieldCheck } from "lucide-react";

import { BrandLogo } from "@/components/brand/brand-logo";
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
  { name: "Turso / libSQL", detail: "SQLite na edge (sem Supabase)" },
  { name: "Drizzle ORM", detail: "Schema tipado + migrations SQL" },
  { name: "Auth.js", detail: "Credentials + RBAC no servidor" },
  { name: "Tailwind + Recharts", detail: "UI industrial + gráficos" },
  { name: "Vitest + Playwright", detail: "Regras e fluxo crítico" },
];

const modules = [
  {
    title: "Dashboard executivo",
    body: "Receita vs meta, pipeline ponderado, funil, rankings e ações do dia.",
    code: "01",
  },
  {
    title: "Clientes 360º",
    body: "Carteira, contatos, pedidos, oportunidades e scores de prioridade.",
    code: "02",
  },
  {
    title: "Insights comerciais",
    body: "Recompra, risco de inatividade, oportunidades paradas e margem.",
    code: "03",
  },
];

export default function LandingPage() {
  return (
    <div className="relative min-h-dvh bg-paper text-ink">
      <div aria-hidden className="so-grain pointer-events-none absolute inset-0" />

      <a
        href="#conteudo"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:border focus:border-primary focus:bg-paper-raised focus:px-3 focus:py-2"
      >
        Ir para o conteúdo
      </a>

      <header className="relative z-10 border-b border-border bg-paper">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
          <Link href="/" className="flex items-center gap-3">
            <BrandLogo size={44} priority className="h-11 w-11" />
            <div>
              <p className="so-label">Case de portfólio</p>
              <p className="mt-0.5 text-sm font-semibold tracking-tight text-ink">
                SalesOps Industrial Demo
              </p>
            </div>
          </Link>
          <nav className="flex items-center gap-2 sm:gap-4" aria-label="Atalhos">
            <a
              className="hidden cursor-pointer text-sm font-medium text-ink-muted transition-colors hover:text-ink sm:inline"
              href="#acesso"
            >
              Como entrar
            </a>
            <Link className="so-btn so-btn-primary h-10 px-4" href="/login">
              Entrar na demo
            </Link>
          </nav>
        </div>
      </header>

      <main className="relative z-10" id="conteudo">
        <section className="relative overflow-hidden border-b border-border bg-primary text-white">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 opacity-40"
            style={{
              backgroundImage:
                "repeating-linear-gradient(90deg, transparent, transparent 47px, rgba(255,255,255,0.04) 47px, rgba(255,255,255,0.04) 48px), repeating-linear-gradient(0deg, transparent, transparent 47px, rgba(255,255,255,0.04) 47px, rgba(255,255,255,0.04) 48px)",
            }}
          />
          <div className="relative mx-auto grid max-w-6xl gap-12 px-4 py-16 sm:px-6 sm:py-20 lg:grid-cols-[1.35fr_0.65fr] lg:items-end lg:py-24">
            <div>
              <div className="so-enter flex items-center gap-3">
                <BrandLogo size={56} priority className="h-14 w-14" />
                <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-blue-200">
                  SalesOps Industrial Demo
                </p>
              </div>
              <h1 className="so-enter so-enter-delay-1 mt-4 max-w-2xl text-balance text-4xl font-semibold leading-[1.05] tracking-tight text-white sm:text-5xl lg:text-[3.25rem]">
                Operação comercial B2B industrial, em uma demo navegável.
              </h1>
              <p className="so-enter so-enter-delay-2 mt-5 max-w-xl text-base leading-7 text-blue-100/90">
                Case público de Sales Operations: priorizar clientes, pipeline em
                risco, recompra e margem — com dados 100% sintéticos.
              </p>
              <div className="so-enter so-enter-delay-3 mt-8 flex flex-wrap gap-3">
                <Link className="so-btn so-btn-solid-light" href="/login">
                  Abrir a aplicação
                  <ArrowRight aria-hidden className="h-4 w-4" />
                </Link>
                <a className="so-btn so-btn-ghost" href="#acesso">
                  Ver usuários demo
                </a>
              </div>
              <p className="mt-8 inline-flex max-w-md items-start gap-2 border border-white/15 bg-white/5 px-3 py-2 font-mono text-[11px] leading-5 tracking-wide text-blue-100">
                <ShieldCheck aria-hidden className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                DADOS SINTÉTICOS · SEM CADASTRO PÚBLICO · ALLOWLIST ONLY
              </p>
            </div>

            <aside className="so-enter so-enter-delay-2 border border-white/20 bg-slate-950/50 p-5 font-mono text-[12px] leading-6 text-blue-50/90">
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-blue-200">
                [ Protocolo / 30s ]
              </p>
              <ol className="mt-4 space-y-4">
                <li>
                  <span className="text-blue-300">01 —</span> Entre com uma conta
                  demo.
                </li>
                <li>
                  <span className="text-blue-300">02 —</span> Explore dashboard,
                  clientes, pipeline e insights.
                </li>
                <li>
                  <span className="text-blue-300">03 —</span> Compare Seller (sem
                  margem) vs Admin.
                </li>
              </ol>
            </aside>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6" id="ideia">
          <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
            <div>
              <p className="so-label">Escopo</p>
              <h2 className="mt-2 text-3xl font-semibold tracking-tight text-ink text-balance">
                A ideia do projeto
              </h2>
              <p className="mt-4 max-w-md text-base leading-7 text-ink-muted">
                Simula a operação de uma distribuidora B2B de peças industriais.
                Não é um ERP gigante — é decidir onde agir: quem priorizar, o que
                está em risco e onde a margem aperta.
              </p>
            </div>
            <ul className="grid gap-0 border border-border sm:grid-cols-2">
              {modules.map((mod, index) => (
                <li
                  key={mod.title}
                  className={`border-border bg-paper-raised p-5 ${
                    index === 0 ? "sm:col-span-2 border-b" : ""
                  } ${index === 1 ? "border-b sm:border-b-0 sm:border-r" : ""}`}
                >
                  <p className="font-mono text-[10px] font-semibold tracking-[0.14em] text-ink-muted">
                    MOD / {mod.code}
                  </p>
                  <h3 className="mt-2 text-base font-semibold text-ink">
                    {mod.title}
                  </h3>
                  <p className="mt-2 max-w-prose text-sm leading-6 text-ink-muted">
                    {mod.body}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="border-y border-border bg-paper-raised" id="stack">
          <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
            <div className="flex items-start gap-3">
              <Database aria-hidden className="mt-1 h-5 w-5 text-primary" />
              <div>
                <p className="so-label">Infra</p>
                <h2 className="mt-2 text-2xl font-semibold tracking-tight text-ink">
                  Stack
                </h2>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-ink-muted">
                  Desvio consciente do brief original (Supabase): Turso + Auth.js
                  para persistência e autenticação no deploy Vercel.
                </p>
              </div>
            </div>
            <dl className="mt-10 divide-y divide-border border border-border">
              {stack.map((item) => (
                <div
                  key={item.name}
                  className="grid gap-1 px-4 py-3 sm:grid-cols-[14rem_1fr] sm:items-baseline sm:gap-6"
                >
                  <dt className="font-mono text-xs font-semibold uppercase tracking-wide text-ink">
                    {item.name}
                  </dt>
                  <dd className="text-sm text-ink-muted">{item.detail}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6" id="acesso">
          <div className="flex items-start gap-3">
            <Lock aria-hidden className="mt-1 h-5 w-5 text-primary" />
            <div>
              <p className="so-label">Acesso</p>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight text-ink">
                Como entrar
              </h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-ink-muted">
                Não há auto-cadastro. Somente contas seed da allowlist autenticam.
                {isDemoProfileSwitcherEnabled()
                  ? " Use o Admin para o tour completo."
                  : " Credenciais de demonstração ficam no README do projeto."}
              </p>
            </div>
          </div>

          {isDemoProfileSwitcherEnabled() ? (
            <div className="mt-8 overflow-x-auto border border-border bg-paper-raised">
              <table className="w-full min-w-[36rem] text-left text-sm">
                <thead className="border-b border-border bg-paper font-mono text-[10px] uppercase tracking-[0.12em] text-ink-muted">
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
                <tbody className="tabular-data">
                  {DEMO_CREDENTIALS.map((row) => (
                    <tr
                      className="border-b border-border last:border-0"
                      key={row.email}
                    >
                      <td className="px-4 py-3 font-medium text-ink">
                        {row.role}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-ink">
                        {row.email}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-ink">
                        {row.password}
                      </td>
                      <td className="px-4 py-3 text-ink-muted">{row.label}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}

          <div className="mt-8">
            <Link className="so-btn so-btn-primary" href="/login">
              Ir para o login
              <ArrowRight aria-hidden className="h-4 w-4" />
            </Link>
          </div>
        </section>

        <section className="border-t border-border bg-paper">
          <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
            <p className="so-label-muted">Avisos</p>
            <h2 className="mt-2 text-lg font-semibold text-ink">
              Demo pública — limites
            </h2>
            <ul className="mt-6 grid gap-0 border border-border sm:grid-cols-2">
              {[
                "Dados e previsões são sintéticos — não representam empresas ou pessoas reais.",
                "Sem criação de contas. Login restrito à allowlist demo + rate limit.",
                "Ambiente de portfólio: não use para dados reais nem processos produtivos.",
                "Sessões curtas, headers de segurança e RBAC no servidor (Seller sem custo/margem).",
              ].map((text, i) => (
                <li
                  key={text}
                  className={`border-border bg-paper-raised p-4 text-sm leading-6 text-ink-muted ${
                    i < 2 ? "border-b" : ""
                  } ${i % 2 === 0 ? "sm:border-r" : ""} ${i === 2 ? "border-b sm:border-b-0" : ""}`}
                >
                  <span className="font-mono text-[10px] text-primary">
                    {String(i + 1).padStart(2, "0")} /
                  </span>{" "}
                  {text}
                </li>
              ))}
            </ul>
          </div>
        </section>
      </main>

      <footer className="relative z-10 border-t border-border bg-paper">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-8 text-sm text-ink-muted sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div className="flex items-center gap-3">
            <BrandLogo size={36} className="h-9 w-9" />
            <p className="font-medium text-ink">SalesOps Industrial Demo</p>
          </div>
          <p className="font-mono text-xs tracking-wide">
            CASE / LINKEDIN · NÃO É PRODUTO COMERCIAL
          </p>
        </div>
      </footer>
    </div>
  );
}
