"use client";

import { AlertTriangle } from "lucide-react";

export default function DashboardError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div
      className="rounded-lg border border-red-200 bg-white px-6 py-16 text-center"
      role="alert"
    >
      <AlertTriangle
        aria-hidden="true"
        className="mx-auto h-8 w-8 text-red-600"
      />
      <h2 className="mt-4 text-lg font-semibold text-slate-900">
        Não foi possível carregar o dashboard
      </h2>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-600">
        Houve uma falha ao consultar os indicadores. Tente novamente.
      </p>
      <button
        className="mt-5 min-h-11 cursor-pointer rounded-md bg-slate-900 px-5 text-sm font-semibold text-white transition hover:bg-slate-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900"
        onClick={reset}
        type="button"
      >
        Tentar novamente
      </button>
    </div>
  );
}
