import { Suspense } from "react";

import { listOpportunities } from "@/db/queries/opportunities";
import { PipelineBoard } from "@/features/pipeline/pipeline-board";
import { auth } from "@/lib/auth/auth";

type PipelinePageProps = {
  searchParams: Promise<{ q?: string }>;
};

export default async function PipelinePage({
  searchParams,
}: PipelinePageProps) {
  const session = await auth();
  const params = await searchParams;

  if (!session?.user) {
    return null;
  }

  const query = params.q?.trim() ?? "";
  const opportunities = await listOpportunities({
    organizationId: session.user.organizationId,
    role: session.user.role,
    userId: session.user.id,
    q: query || undefined,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Pipeline</h1>
        <p className="mt-1 text-sm text-slate-600">
          Acompanhe oportunidades, valores e tempo em cada estágio comercial.
        </p>
      </div>
      <Suspense fallback={null}>
        <PipelineBoard key={query} query={query} rows={opportunities} />
      </Suspense>
    </div>
  );
}
