export default function DashboardLoading() {
  return (
    <div
      aria-busy="true"
      aria-label="Carregando dashboard"
      className="space-y-6"
    >
      <div className="space-y-2">
        <div className="h-3 w-40 animate-pulse rounded bg-slate-200 motion-reduce:animate-none" />
        <div className="h-8 w-64 animate-pulse rounded bg-slate-200 motion-reduce:animate-none" />
        <div className="h-4 w-full max-w-xl animate-pulse rounded bg-slate-200 motion-reduce:animate-none" />
      </div>
      <div className="h-28 animate-pulse rounded-md border border-slate-200 bg-white motion-reduce:animate-none" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 7 }, (_, index) => (
          <div
            className="h-40 animate-pulse rounded-md border border-slate-200 bg-white motion-reduce:animate-none"
            key={index}
          />
        ))}
      </div>
      <div className="grid gap-6 xl:grid-cols-3">
        <div className="h-96 animate-pulse rounded-md border border-slate-200 bg-white motion-reduce:animate-none xl:col-span-2" />
        <div className="h-96 animate-pulse rounded-md border border-slate-200 bg-white motion-reduce:animate-none" />
      </div>
      <span className="sr-only">Carregando indicadores comerciais...</span>
    </div>
  );
}
