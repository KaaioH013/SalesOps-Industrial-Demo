import Link from "next/link";
import { AlertTriangle, ArrowRight, Clock3, RefreshCw, TrendingDown } from "lucide-react";

import { getInsights, type InsightItem } from "@/db/queries/insights";
import { auth } from "@/lib/auth/auth";

const severityLabels = {
  info: "Informativo",
  warning: "Atenção",
  critical: "Crítico",
} as const;

function InsightBlock({
  title,
  description,
  items,
  icon: Icon,
}: {
  title: string;
  description: string;
  items: InsightItem[];
  icon: typeof RefreshCw;
}) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5">
      <div className="flex items-start gap-3">
        <span className="rounded-md bg-slate-100 p-2 text-slate-600">
          <Icon aria-hidden="true" className="h-5 w-5" />
        </span>
        <div>
          <h2 className="font-semibold text-slate-900">{title}</h2>
          <p className="mt-1 text-sm text-slate-500">{description}</p>
        </div>
      </div>
      {items.length === 0 ? (
        <p className="mt-5 rounded-md bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
          Nenhum insight nesta categoria.
        </p>
      ) : (
        <ol className="mt-5 space-y-3">
          {items.map((item) => (
            <li className="rounded-md border border-slate-100 p-4" key={item.id}>
              <div className="flex items-start justify-between gap-3">
                <p className="text-sm font-semibold text-slate-900">{item.name}</p>
                <span className="shrink-0 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
                  {item.score != null
                    ? `${item.score}/100`
                    : item.severity
                      ? severityLabels[item.severity]
                      : "—"}
                </span>
              </div>
              <ul className="mt-3 space-y-1 text-xs leading-5 text-slate-600">
                {item.factors.map((factor) => (
                  <li key={factor}>• {factor}</li>
                ))}
              </ul>
              <p className="mt-3 text-sm text-slate-700">
                <span className="font-medium">Ação recomendada:</span> {item.recommendation}
              </p>
              <Link
                className="mt-3 inline-flex min-h-11 items-center gap-1.5 py-2 text-sm font-semibold text-slate-900 hover:text-slate-600"
                href={item.href}
              >
                Abrir registro
                <ArrowRight aria-hidden="true" className="h-4 w-4" />
              </Link>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}

export default async function InsightsPage() {
  const session = await auth();
  if (!session?.user) return null;

  const insights = await getInsights({
    organizationId: session.user.organizationId,
    role: session.user.role,
    userId: session.user.id,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Insights</h1>
        <p className="mt-1 text-sm text-slate-600">Análises e recomendações comerciais.</p>
      </div>
      <div className="grid gap-5 xl:grid-cols-2">
        <InsightBlock
          description="Clientes próximos da janela habitual de compra."
          icon={RefreshCw}
          items={insights.repurchase}
          title="Oportunidades de recompra"
        />
        <InsightBlock
          description="Clientes que exigem ação para preservar a carteira."
          icon={Clock3}
          items={insights.inactivity}
          title="Risco de inatividade"
        />
        <InsightBlock
          description="Negociações abertas sem avanço ou contato recente."
          icon={AlertTriangle}
          items={insights.opportunityRisk}
          title="Oportunidades em risco"
        />
        <InsightBlock
          description="Cotações abaixo da margem-alvo dos produtos."
          icon={TrendingDown}
          items={insights.marginRisk}
          title="Risco de margem"
        />
      </div>
      <p className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-xs leading-5 text-amber-900">
        Ambiente demonstrativo: scores, alertas e recomendações são estimativas baseadas nos dados
        disponíveis e não substituem a análise comercial.
      </p>
    </div>
  );
}
