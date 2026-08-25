"use client";

import {
  BarChart3,
  FileText,
  GitBranch,
  LayoutDashboard,
  Lightbulb,
  Package,
  Settings,
  ShoppingCart,
  Users,
  X,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { BrandLogo } from "@/components/brand/brand-logo";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/customers", label: "Clientes", icon: Users },
  { href: "/pipeline", label: "Pipeline", icon: GitBranch },
  { href: "/quotes", label: "Cotações", icon: FileText },
  { href: "/orders", label: "Pedidos", icon: ShoppingCart },
  { href: "/products", label: "Produtos", icon: Package },
  { href: "/insights", label: "Insights", icon: Lightbulb },
  { href: "/reports", label: "Relatórios", icon: BarChart3 },
  { href: "/settings", label: "Configurações", icon: Settings },
] as const;

type AppSidebarProps = {
  mobileOpen: boolean;
  onMobileClose: () => void;
};

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Navegação principal"
      className="flex flex-1 flex-col gap-0.5 p-2"
    >
      {navItems.map(({ href, label, icon: Icon }) => {
        const isActive =
          pathname === href ||
          (href !== "/dashboard" && pathname.startsWith(`${href}/`));

        return (
          <Link
            key={href}
            href={href}
            onClick={onNavigate}
            className={cn(
              "relative flex items-center gap-3 px-3 py-2.5 text-sm font-medium transition-colors",
              isActive
                ? "bg-white/10 text-white"
                : "text-slate-300 hover:bg-white/5 hover:text-white",
            )}
          >
            {isActive ? (
              <span
                aria-hidden
                className="absolute inset-y-0 left-0 w-0.5 bg-blue-300"
              />
            ) : null}
            <Icon aria-hidden="true" className="h-4 w-4 shrink-0" />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}

function BrandBlock({ compact }: { compact?: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <BrandLogo
        size={compact ? 36 : 44}
        className={compact ? "h-9 w-9" : "h-11 w-11"}
      />
      <div>
        <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-sidebar-muted">
          SalesOps
        </p>
        <p
          className={cn(
            "mt-0.5 font-semibold tracking-tight text-white",
            compact ? "text-base" : "text-lg",
          )}
        >
          Industrial
        </p>
      </div>
    </div>
  );
}

export function AppSidebar({ mobileOpen, onMobileClose }: AppSidebarProps) {
  return (
    <>
      <aside className="hidden w-64 shrink-0 flex-col bg-sidebar lg:flex">
        <div className="border-b border-white/10 px-5 py-5">
          <BrandBlock />
        </div>
        <NavLinks />
      </aside>

      {mobileOpen ? (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button
            type="button"
            aria-label="Fechar menu"
            className="absolute inset-0 bg-ink/50"
            onClick={onMobileClose}
          />
          <aside className="relative flex h-full w-72 max-w-[85vw] flex-col bg-sidebar shadow-xl">
            <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
              <BrandBlock compact />
              <button
                type="button"
                aria-label="Fechar menu de navegação"
                className="p-2 text-slate-300 transition-colors hover:bg-white/10 hover:text-white"
                onClick={onMobileClose}
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <NavLinks onNavigate={onMobileClose} />
          </aside>
        </div>
      ) : null}
    </>
  );
}
