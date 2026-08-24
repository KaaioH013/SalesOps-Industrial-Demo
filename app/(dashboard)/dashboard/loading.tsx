export default function DashboardLoading() {
  return (
    <div aria-busy="true" aria-label="Carregando dashboard" className="space-y-6">
      <div className="h-24 animate-pulse rounded-lg bg-slate-200" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 7 }, (_, index) => (
          <div
            className="h-36 animate-pulse rounded-lg border border-slate-200 bg-white"
            key={index}
          />
        ))}
      </div>
      <div className="grid gap-6 xl:grid-cols-3">
        <div className="h-96 animate-pulse rounded-lg border border-slate-200 bg-white xl:col-span-2" />
        <div className="h-96 animate-pulse rounded-lg border border-slate-200 bg-white" />
      </div>
      <span className="sr-only">Carregando indicadores comerciais...</span>
    </div>
  );
}
