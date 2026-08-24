"use client";

import { Menu } from "lucide-react";

type AppHeaderProps = {
  userName?: string | null;
  onMenuClick: () => void;
};

export function AppHeader({ userName, onMenuClick }: AppHeaderProps) {
  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-slate-200 bg-white px-4 lg:px-6">
      <div className="flex items-center gap-3">
        <button
          type="button"
          aria-label="Abrir menu de navegação"
          className="rounded-md p-2 text-slate-600 hover:bg-slate-100 lg:hidden"
          onClick={onMenuClick}
        >
          <Menu className="h-5 w-5" />
        </button>
        <div className="hidden sm:block">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
            Período
          </p>
          <p className="text-sm font-medium text-slate-900">Agosto de 2026</p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="hidden text-right sm:block">
          <p className="text-xs text-slate-500">Usuário</p>
          <p className="text-sm font-medium text-slate-900">
            {userName ?? "Usuário demo"}
          </p>
        </div>
        <div
          aria-hidden="true"
          className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-950 text-sm font-semibold text-white"
        >
          {(userName ?? "U").charAt(0).toUpperCase()}
        </div>
      </div>
    </header>
  );
}
