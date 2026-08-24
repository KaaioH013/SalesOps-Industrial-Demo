"use client";

import { useMemo, useState, useTransition } from "react";

import type {
  OrganizationConfig,
  SettingsProfile,
  SettingsTargetRow,
} from "@/db/queries/settings";
import {
  deleteTargetAction,
  updateOrganizationConfigAction,
  upsertTargetAction,
} from "@/features/settings/actions";
import { formatBRL } from "@/lib/formatters/currency";
import { canViewMargin } from "@/lib/permissions/roles";

const ROLE_LABELS = {
  admin: "Administrador",
  manager: "Gerente",
  seller: "Vendedor",
} as const;

type SettingsPanelProps = {
  profile: SettingsProfile;
  targets: SettingsTargetRow[];
  config: OrganizationConfig;
  sellers: Array<{ id: string; name: string }>;
  territories: Array<{ id: string; name: string }>;
};

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5">
      <h2 className="text-base font-semibold text-slate-900">{title}</h2>
      <p className="mt-1 text-sm text-slate-600">{description}</p>
      <div className="mt-5">{children}</div>
    </section>
  );
}

export function SettingsPanel({
  profile,
  targets,
  config,
  sellers,
  territories,
}: SettingsPanelProps) {
  const isAdmin = profile.role === "admin";
  const showMargin = canViewMargin(profile.role);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [attentionDays, setAttentionDays] = useState(config.attentionDays);
  const [criticalDays, setCriticalDays] = useState(config.criticalDays);
  const [lossReasons, setLossReasons] = useState(config.lossReasons.join("\n"));
  const [editingTargetId, setEditingTargetId] = useState<string | null>(null);

  const editingTarget = useMemo(
    () => targets.find((target) => target.id === editingTargetId) ?? null,
    [editingTargetId, targets],
  );

  const resetFeedback = () => {
    setMessage(null);
    setError(null);
  };

  return (
    <div className="space-y-6">
      {message ? (
        <p className="rounded-md border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
          {message}
        </p>
      ) : null}
      {error ? (
        <p className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </p>
      ) : null}

      <Section
        description="Informações da conta autenticada nesta sessão."
        title="Perfil"
      >
        <dl className="grid gap-4 sm:grid-cols-2">
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">
              Nome
            </dt>
            <dd className="mt-1 text-sm text-slate-900">{profile.name}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">
              E-mail
            </dt>
            <dd className="mt-1 text-sm text-slate-900">{profile.email}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">
              Papel
            </dt>
            <dd className="mt-1 text-sm text-slate-900">
              {ROLE_LABELS[profile.role]}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">
              Organização
            </dt>
            <dd className="mt-1 text-sm text-slate-900">
              {profile.organizationName}
            </dd>
          </div>
          {profile.title ? (
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">
                Cargo
              </dt>
              <dd className="mt-1 text-sm text-slate-900">{profile.title}</dd>
            </div>
          ) : null}
        </dl>
      </Section>

      <Section
        description={
          isAdmin
            ? "Metas mensais por vendedor ou território."
            : "Visualização das metas dentro do seu escopo de permissão."
        }
        title="Metas comerciais"
      >
        {targets.length === 0 ? (
          <p className="text-sm text-slate-600">Nenhuma meta cadastrada.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-3 py-2">Período</th>
                  <th className="px-3 py-2">Vendedor</th>
                  <th className="px-3 py-2">Território</th>
                  <th className="px-3 py-2">Receita</th>
                  {showMargin ? <th className="px-3 py-2">Margem</th> : null}
                  {isAdmin ? <th className="px-3 py-2">Ações</th> : null}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {targets.map((target) => (
                  <tr key={target.id}>
                    <td className="px-3 py-2 text-slate-800">{target.period}</td>
                    <td className="px-3 py-2 text-slate-700">
                      {target.sellerName ?? "—"}
                    </td>
                    <td className="px-3 py-2 text-slate-700">
                      {target.territoryName ?? "—"}
                    </td>
                    <td className="px-3 py-2 tabular-nums text-slate-700">
                      {formatBRL(target.revenueTargetCents / 100)}
                    </td>
                    {showMargin ? (
                      <td className="px-3 py-2 tabular-nums text-slate-700">
                        {formatBRL(target.marginTargetCents / 100)}
                      </td>
                    ) : null}
                    {isAdmin ? (
                      <td className="px-3 py-2">
                        <div className="flex gap-2">
                          <button
                            className="text-sm font-medium text-slate-700 hover:text-slate-900"
                            onClick={() => {
                              resetFeedback();
                              setEditingTargetId(target.id);
                            }}
                            type="button"
                          >
                            Editar
                          </button>
                          <button
                            className="text-sm font-medium text-red-700 hover:text-red-900"
                            disabled={isPending}
                            onClick={() =>
                              startTransition(async () => {
                                resetFeedback();
                                try {
                                  await deleteTargetAction({ id: target.id });
                                  setMessage("Meta removida.");
                                  if (editingTargetId === target.id) {
                                    setEditingTargetId(null);
                                  }
                                } catch (caught) {
                                  setError(
                                    caught instanceof Error
                                      ? caught.message
                                      : "Erro ao remover meta",
                                  );
                                }
                              })
                            }
                            type="button"
                          >
                            Excluir
                          </button>
                        </div>
                      </td>
                    ) : null}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {isAdmin ? (
          <form
            className="mt-6 grid gap-3 rounded-md border border-slate-200 bg-slate-50 p-4 sm:grid-cols-2"
            onSubmit={(event) => {
              event.preventDefault();
              resetFeedback();
              const form = new FormData(event.currentTarget);
              startTransition(async () => {
                try {
                  await upsertTargetAction({
                    id: editingTarget?.id,
                    period: String(form.get("period") ?? ""),
                    sellerId: String(form.get("sellerId") ?? "") || undefined,
                    territoryId:
                      String(form.get("territoryId") ?? "") || undefined,
                    revenueTargetCents: Number(form.get("revenueTargetCents")),
                    marginTargetCents: Number(form.get("marginTargetCents")),
                    newCustomersTarget: Number(form.get("newCustomersTarget")),
                    conversionTargetBps: Number(
                      form.get("conversionTargetBps"),
                    ),
                  });
                  setMessage(editingTarget ? "Meta atualizada." : "Meta criada.");
                  setEditingTargetId(null);
                  event.currentTarget.reset();
                } catch (caught) {
                  setError(
                    caught instanceof Error
                      ? caught.message
                      : "Erro ao salvar meta",
                  );
                }
              });
            }}
          >
            <h3 className="sm:col-span-2 text-sm font-semibold text-slate-900">
              {editingTarget ? "Editar meta" : "Nova meta"}
            </h3>
            <label className="grid gap-1 text-xs font-medium text-slate-600">
              Período (AAAA-MM)
              <input
                className="min-h-11 rounded-md border border-slate-300 bg-white px-3 text-sm"
                defaultValue={editingTarget?.period ?? ""}
                key={`period-${editingTarget?.id ?? "new"}`}
                name="period"
                required
              />
            </label>
            <label className="grid gap-1 text-xs font-medium text-slate-600">
              Vendedor
              <select
                className="min-h-11 rounded-md border border-slate-300 bg-white px-3 text-sm"
                defaultValue={editingTarget?.sellerId ?? ""}
                key={`seller-${editingTarget?.id ?? "new"}`}
                name="sellerId"
              >
                <option value="">Nenhum</option>
                {sellers.map((seller) => (
                  <option key={seller.id} value={seller.id}>
                    {seller.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="grid gap-1 text-xs font-medium text-slate-600">
              Território
              <select
                className="min-h-11 rounded-md border border-slate-300 bg-white px-3 text-sm"
                defaultValue={editingTarget?.territoryId ?? ""}
                key={`territory-${editingTarget?.id ?? "new"}`}
                name="territoryId"
              >
                <option value="">Nenhum</option>
                {territories.map((territory) => (
                  <option key={territory.id} value={territory.id}>
                    {territory.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="grid gap-1 text-xs font-medium text-slate-600">
              Meta de receita (centavos)
              <input
                className="min-h-11 rounded-md border border-slate-300 bg-white px-3 text-sm"
                defaultValue={editingTarget?.revenueTargetCents ?? 0}
                key={`revenue-${editingTarget?.id ?? "new"}`}
                min={0}
                name="revenueTargetCents"
                required
                type="number"
              />
            </label>
            <label className="grid gap-1 text-xs font-medium text-slate-600">
              Meta de margem (centavos)
              <input
                className="min-h-11 rounded-md border border-slate-300 bg-white px-3 text-sm"
                defaultValue={editingTarget?.marginTargetCents ?? 0}
                key={`margin-${editingTarget?.id ?? "new"}`}
                min={0}
                name="marginTargetCents"
                required
                type="number"
              />
            </label>
            <label className="grid gap-1 text-xs font-medium text-slate-600">
              Novos clientes
              <input
                className="min-h-11 rounded-md border border-slate-300 bg-white px-3 text-sm"
                defaultValue={editingTarget?.newCustomersTarget ?? 0}
                key={`customers-${editingTarget?.id ?? "new"}`}
                min={0}
                name="newCustomersTarget"
                required
                type="number"
              />
            </label>
            <label className="grid gap-1 text-xs font-medium text-slate-600">
              Conversão (bps)
              <input
                className="min-h-11 rounded-md border border-slate-300 bg-white px-3 text-sm"
                defaultValue={editingTarget?.conversionTargetBps ?? 2500}
                key={`conversion-${editingTarget?.id ?? "new"}`}
                max={10000}
                min={0}
                name="conversionTargetBps"
                required
                type="number"
              />
            </label>
            <div className="flex flex-wrap gap-2 sm:col-span-2">
              <button
                className="min-h-11 rounded-md bg-slate-900 px-4 text-sm font-semibold text-white hover:bg-slate-700 disabled:opacity-60"
                disabled={isPending}
                type="submit"
              >
                {editingTarget ? "Salvar alterações" : "Adicionar meta"}
              </button>
              {editingTarget ? (
                <button
                  className="min-h-11 rounded-md border border-slate-300 px-4 text-sm font-medium text-slate-700"
                  onClick={() => setEditingTargetId(null)}
                  type="button"
                >
                  Cancelar
                </button>
              ) : null}
            </div>
          </form>
        ) : null}
      </Section>

      <Section
        description={
          isAdmin
            ? "Limites usados nos alertas de oportunidade parada e catálogo de motivos de perda."
            : "Configurações organizacionais em modo somente leitura."
        }
        title="Alertas e motivos de perda"
      >
        <form
          className="grid gap-3 sm:grid-cols-2"
          onSubmit={(event) => {
            event.preventDefault();
            if (!isAdmin) return;
            resetFeedback();
            startTransition(async () => {
              try {
                await updateOrganizationConfigAction({
                  attentionDays,
                  criticalDays,
                  lossReasons: lossReasons
                    .split("\n")
                    .map((item) => item.trim())
                    .filter(Boolean),
                });
                setMessage("Configurações atualizadas.");
              } catch (caught) {
                setError(
                  caught instanceof Error
                    ? caught.message
                    : "Erro ao salvar configurações",
                );
              }
            });
          }}
        >
          <label className="grid gap-1 text-xs font-medium text-slate-600">
            Alerta de atenção (dias sem atividade)
            <input
              className="min-h-11 rounded-md border border-slate-300 bg-white px-3 text-sm disabled:bg-slate-100"
              disabled={!isAdmin || isPending}
              min={1}
              onChange={(event) =>
                setAttentionDays(Number(event.target.value))
              }
              type="number"
              value={attentionDays}
            />
          </label>
          <label className="grid gap-1 text-xs font-medium text-slate-600">
            Alerta crítico (dias sem atividade)
            <input
              className="min-h-11 rounded-md border border-slate-300 bg-white px-3 text-sm disabled:bg-slate-100"
              disabled={!isAdmin || isPending}
              min={2}
              onChange={(event) => setCriticalDays(Number(event.target.value))}
              type="number"
              value={criticalDays}
            />
          </label>
          <label className="grid gap-1 text-xs font-medium text-slate-600 sm:col-span-2">
            Motivos de perda (um por linha)
            <textarea
              className="min-h-32 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm disabled:bg-slate-100"
              disabled={!isAdmin || isPending}
              onChange={(event) => setLossReasons(event.target.value)}
              value={lossReasons}
            />
          </label>
          {isAdmin ? (
            <button
              className="min-h-11 rounded-md bg-slate-900 px-4 text-sm font-semibold text-white hover:bg-slate-700 disabled:opacity-60 sm:col-span-2 sm:justify-self-start"
              disabled={isPending}
              type="submit"
            >
              Salvar configurações
            </button>
          ) : (
            <p className="text-sm text-slate-600 sm:col-span-2">
              Somente administradores podem alterar estes valores.
            </p>
          )}
        </form>
      </Section>
    </div>
  );
}
