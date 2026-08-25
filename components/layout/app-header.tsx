"use client";

import { Menu } from "lucide-react";

type AppHeaderProps = {
  userName?: string | null;
  onMenuClick: () => void;
};

export function AppHeader({ userName, onMenuClick }: AppHeaderProps) {
  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-border bg-paper-raised px-4 lg:px-6">
      <div className="flex items-center gap-3">
        <button
          type="button"
          aria-label="Abrir menu de navegação"
          className="cursor-pointer p-2 text-ink-muted transition-colors hover:bg-paper hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary lg:hidden"
          onClick={onMenuClick}
        >
          <Menu className="h-5 w-5" />
        </button>
        <div>
          <p className="so-label">SalesOps</p>
          <p className="text-sm font-semibold tracking-tight text-ink">
            Industrial Demo
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="hidden text-right sm:block">
          <p className="font-mono text-[10px] uppercase tracking-[0.1em] text-ink-muted">
            Usuário
          </p>
          <p className="text-sm font-medium text-ink">
            {userName ?? "Usuário demo"}
          </p>
        </div>
        <div
          aria-hidden="true"
          className="flex h-9 w-9 items-center justify-center bg-primary font-mono text-sm font-semibold text-white"
        >
          {(userName ?? "U").charAt(0).toUpperCase()}
        </div>
      </div>
    </header>
  );
}
