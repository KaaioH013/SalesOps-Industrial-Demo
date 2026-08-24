import { EmptyState } from "@/components/ui/empty-state";

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">
          Configurações
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          Preferências da conta e da organização.
        </p>
      </div>
      <EmptyState
        title="Configurações em preparação"
        description="As opções de perfil, equipe e preferências do sistema serão habilitadas nas próximas fases do projeto."
      />
    </div>
  );
}
