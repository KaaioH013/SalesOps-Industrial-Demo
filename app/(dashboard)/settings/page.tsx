import {
  getOrganizationConfig,
  getSettingsProfile,
  listSettingsOptions,
  listSettingsTargets,
} from "@/db/queries/settings";
import { SettingsPanel } from "@/features/settings/settings-panel";
import { auth } from "@/lib/auth/auth";

export default async function SettingsPage() {
  const session = await auth();
  if (!session?.user) {
    return null;
  }

  const scope = {
    organizationId: session.user.organizationId,
    role: session.user.role,
    userId: session.user.id,
  };

  const [profile, targets, config, options] = await Promise.all([
    getSettingsProfile(scope),
    listSettingsTargets(scope),
    getOrganizationConfig(session.user.organizationId),
    listSettingsOptions(session.user.organizationId),
  ]);

  if (!profile) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">
          Configurações
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          Perfil, metas comerciais e parâmetros de alertas da organização.
        </p>
      </div>
      <SettingsPanel
        config={config}
        profile={profile}
        sellers={options.sellers}
        targets={targets}
        territories={options.territories}
      />
    </div>
  );
}
