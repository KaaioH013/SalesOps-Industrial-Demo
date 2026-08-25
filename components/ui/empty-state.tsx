type EmptyStateProps = {
  title: string;
  description?: string;
};

export function EmptyState({ title, description }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center border border-dashed border-border bg-paper-raised px-6 py-16 text-center">
      <div className="mb-4 flex h-12 w-12 items-center justify-center border border-border bg-paper">
        <svg
          aria-hidden="true"
          className="h-6 w-6 text-ink-muted"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.5}
          viewBox="0 0 24 24"
        >
          <path
            d="M20 13V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v7m16 0v5a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-5m16 0h-2.586a1 1 0 0 0-.707.293l-2.414 2.414a1 1 0 0 1-.707.293h-3.172a1 1 0 0 1-.707-.293l-2.414-2.414A1 1 0 0 0 6.586 13H4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
      <h2 className="text-lg font-semibold tracking-tight text-ink">{title}</h2>
      <p className="mt-2 max-w-md text-sm leading-6 text-ink-muted">
        {description ??
          "Os dados aparecerão aqui após a execução do seed do ambiente de demonstração."}
      </p>
    </div>
  );
}
