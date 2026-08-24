export default function CustomersLoading() {
  return (
    <div className="space-y-6">
      <div>
        <div className="h-8 w-40 animate-pulse rounded bg-slate-200" />
        <div className="mt-2 h-4 w-72 animate-pulse rounded bg-slate-100" />
      </div>
      <div className="space-y-4">
        <div className="flex gap-2">
          <div className="h-9 flex-1 max-w-md animate-pulse rounded-md bg-slate-200" />
          <div className="h-9 w-20 animate-pulse rounded-md bg-slate-200" />
        </div>
        <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
          <div className="h-10 animate-pulse bg-slate-50" />
          {Array.from({ length: 6 }).map((_, index) => (
            <div
              key={index}
              className="h-14 animate-pulse border-t border-slate-100 bg-white"
            />
          ))}
        </div>
      </div>
    </div>
  );
}
