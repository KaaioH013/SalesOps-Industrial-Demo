"use client";

import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  type ColumnDef,
  type VisibilityState,
} from "@tanstack/react-table";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState, useTransition } from "react";

import { EmptyState } from "@/components/ui/empty-state";
import type { CustomerListRow } from "@/db/queries/customers";
import { formatBRL } from "@/lib/formatters/currency";
import { formatDatePtBR } from "@/lib/formatters/date";
import { formatPercent } from "@/lib/formatters/percent";
import { cn } from "@/lib/utils";

const STATUS_LABELS: Record<CustomerListRow["status"], string> = {
  prospect: "Prospecto",
  active: "Ativo",
  inactive: "Inativo",
};

type CustomerTableProps = {
  rows: CustomerListRow[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  query: string;
  showMargin: boolean;
};

type ColumnMeta = {
  label: string;
};

function StatusBadge({ status }: { status: CustomerListRow["status"] }) {
  return (
    <span
      className={cn(
        "inline-flex rounded-full px-2 py-0.5 text-xs font-medium",
        status === "active" && "bg-emerald-50 text-emerald-700",
        status === "prospect" && "bg-amber-50 text-amber-700",
        status === "inactive" && "bg-slate-100 text-slate-600",
      )}
    >
      {STATUS_LABELS[status]}
    </span>
  );
}

export function CustomerTable({
  rows,
  page,
  pageSize,
  total,
  totalPages,
  query,
  showMargin,
}: CustomerTableProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [searchValue, setSearchValue] = useState(query);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});

  useEffect(() => {
    setSearchValue(query);
  }, [query]);

  const columns = useMemo<ColumnDef<CustomerListRow>[]>(() => {
    const base: ColumnDef<CustomerListRow>[] = [
      {
        id: "name",
        accessorKey: "tradeName",
        meta: { label: "Cliente" } satisfies ColumnMeta,
        header: "Cliente",
        cell: ({ row }) => {
          const customer = row.original;
          return (
            <div className="min-w-[180px]">
              <Link
                className="font-medium text-slate-900 hover:text-blue-700 hover:underline"
                href={`/customers/${customer.id}`}
              >
                {customer.tradeName}
              </Link>
              {customer.tradeName !== customer.legalName ? (
                <p className="mt-0.5 text-xs text-slate-500">
                  {customer.legalName}
                </p>
              ) : null}
            </div>
          );
        },
      },
      {
        id: "segment",
        accessorKey: "segment",
        meta: { label: "Segmento" } satisfies ColumnMeta,
        header: "Segmento",
        cell: ({ getValue }) => (
          <span className="text-slate-700">{getValue<string>()}</span>
        ),
      },
      {
        id: "territory",
        accessorFn: (row) => row.territory?.name ?? "—",
        meta: { label: "Território" } satisfies ColumnMeta,
        header: "Território",
        cell: ({ row }) => (
          <span className="text-slate-700">
            {row.original.territory?.name ?? "—"}
          </span>
        ),
      },
      {
        id: "seller",
        accessorFn: (row) => row.seller?.name ?? "—",
        meta: { label: "Vendedor" } satisfies ColumnMeta,
        header: "Vendedor",
        cell: ({ row }) => (
          <span className="text-slate-700">
            {row.original.seller?.name ?? "—"}
          </span>
        ),
      },
      {
        id: "lastPurchase",
        accessorKey: "lastPurchaseAt",
        meta: { label: "Última compra" } satisfies ColumnMeta,
        header: "Última compra",
        cell: ({ getValue }) => {
          const value = getValue<Date | null>();
          return (
            <span className="text-slate-700">
              {value ? formatDatePtBR(value) : "—"}
            </span>
          );
        },
      },
      {
        id: "revenue",
        accessorKey: "revenueCents",
        meta: { label: "Receita" } satisfies ColumnMeta,
        header: "Receita",
        cell: ({ getValue }) => {
          const cents = getValue<number>();
          return (
            <span className="tabular-nums text-slate-700">
              {cents > 0 ? formatBRL(cents / 100) : "—"}
            </span>
          );
        },
      },
    ];

    if (showMargin) {
      base.push({
        id: "margin",
        accessorKey: "grossMarginBps",
        meta: { label: "Margem" } satisfies ColumnMeta,
        header: "Margem",
        cell: ({ getValue }) => {
          const bps = getValue<number | null>();
          return (
            <span className="tabular-nums text-slate-700">
              {bps != null ? formatPercent(bps / 10_000, 1) : "—"}
            </span>
          );
        },
      });
    }

    base.push(
      {
        id: "priorityScore",
        accessorKey: "priorityScore",
        meta: { label: "Prioridade" } satisfies ColumnMeta,
        header: "Prioridade",
        cell: ({ getValue }) => {
          const score = getValue<number | null>();
          return (
            <span className="tabular-nums text-slate-700">
              {score != null ? score : "—"}
            </span>
          );
        },
      },
      {
        id: "status",
        accessorKey: "status",
        meta: { label: "Status" } satisfies ColumnMeta,
        header: "Status",
        cell: ({ getValue }) => (
          <StatusBadge status={getValue<CustomerListRow["status"]>()} />
        ),
      },
    );

    return base;
  }, [showMargin]);

  const table = useReactTable({
    data: rows,
    columns,
    state: { columnVisibility },
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
  });

  const navigate = (nextPage: number, nextQuery: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (nextQuery.trim()) {
      params.set("q", nextQuery.trim());
    } else {
      params.delete("q");
    }
    if (nextPage > 1) {
      params.set("page", String(nextPage));
    } else {
      params.delete("page");
    }

    const queryString = params.toString();
    startTransition(() => {
      router.push(queryString ? `/customers?${queryString}` : "/customers");
    });
  };

  const handleSearchSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    navigate(1, searchValue);
  };

  if (total === 0 && !query) {
    return (
      <EmptyState
        title="Nenhum cliente cadastrado"
        description="A listagem de clientes aparecerá aqui após a execução do seed do ambiente de demonstração."
      />
    );
  }

  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <form className="flex flex-1 gap-2 sm:max-w-md" onSubmit={handleSearchSubmit}>
          <input
            aria-label="Buscar clientes"
            className="h-9 flex-1 rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            onChange={(event) => setSearchValue(event.target.value)}
            placeholder="Buscar por nome ou CNPJ..."
            type="search"
            value={searchValue}
          />
          <button
            className="h-9 rounded-md bg-slate-900 px-3 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
            disabled={isPending}
            type="submit"
          >
            Buscar
          </button>
        </form>

        <details className="relative">
          <summary className="cursor-pointer list-none rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 [&::-webkit-details-marker]:hidden">
            Colunas
          </summary>
          <div className="absolute right-0 z-10 mt-2 w-52 rounded-md border border-slate-200 bg-white p-3 shadow-lg">
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-500">
              Visibilidade
            </p>
            <div className="space-y-2">
              {table
                .getAllLeafColumns()
                .filter((column) => column.getCanHide())
                .map((column) => {
                  const label =
                    (column.columnDef.meta as ColumnMeta | undefined)?.label ??
                    column.id;
                  return (
                    <label
                      key={column.id}
                      className="flex items-center gap-2 text-sm text-slate-700"
                    >
                      <input
                        checked={column.getIsVisible()}
                        className="rounded border-slate-300"
                        onChange={column.getToggleVisibilityHandler()}
                        type="checkbox"
                      />
                      {label}
                    </label>
                  );
                })}
            </div>
          </div>
        </details>
      </div>

      <div
        className={cn(
          "overflow-hidden rounded-lg border border-slate-200 bg-white",
          isPending && "opacity-60",
        )}
      >
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50">
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <th
                      key={header.id}
                      className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500"
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext(),
                          )}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody className="divide-y divide-slate-100">
              {table.getRowModel().rows.length === 0 ? (
                <tr>
                  <td
                    className="px-4 py-10 text-center text-slate-500"
                    colSpan={columns.length}
                  >
                    Nenhum cliente encontrado para &quot;{query}&quot;.
                  </td>
                </tr>
              ) : (
                table.getRowModel().rows.map((row) => (
                  <tr key={row.id} className="hover:bg-slate-50/80">
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id} className="px-4 py-3 align-top">
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext(),
                        )}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-slate-600">
          {total === 0
            ? "Nenhum resultado"
            : `Exibindo ${from}–${to} de ${total} clientes`}
        </p>
        <div className="flex items-center gap-2">
          <button
            className="h-9 rounded-md border border-slate-300 bg-white px-3 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            disabled={page <= 1 || isPending}
            onClick={() => navigate(page - 1, query)}
            type="button"
          >
            Anterior
          </button>
          <span className="text-sm text-slate-600">
            Página {page} de {Math.max(totalPages, 1)}
          </span>
          <button
            className="h-9 rounded-md border border-slate-300 bg-white px-3 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            disabled={page >= totalPages || totalPages === 0 || isPending}
            onClick={() => navigate(page + 1, query)}
            type="button"
          >
            Próxima
          </button>
        </div>
      </div>
    </div>
  );
}
