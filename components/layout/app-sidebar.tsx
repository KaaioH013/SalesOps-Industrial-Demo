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
    <nav aria-label="Navegação principal" className="flex flex-1 flex-col gap-1 p-3">
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
              "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors",
              isActive
                ? "bg-blue-950 text-white"
                : "text-slate-300 hover:bg-slate-800 hover:text-white",
            )}
          >
            <Icon aria-hidden="true" className="h-4 w-4 shrink-0" />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}

export function AppSidebar({ mobileOpen, onMobileClose }: AppSidebarProps) {
  return (
    <>
      <aside className="hidden w-64 shrink-0 flex-col bg-blue-950 lg:flex">
        <div className="border-b border-blue-900 px-5 py-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-blue-300">
            SalesOps
          </p>
          <p className="mt-1 text-lg font-semibold text-white">Industrial</p>
        </div>
        <NavLinks />
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button
            type="button"
            aria-label="Fechar menu"
            className="absolute inset-0 bg-slate-950/50"
            onClick={onMobileClose}
          />
          <aside className="relative flex h-full w-72 max-w-[85vw] flex-col bg-blue-950 shadow-xl">
            <div className="flex items-center justify-between border-b border-blue-900 px-5 py-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-blue-300">
                  SalesOps
                </p>
                <p className="text-base font-semibold text-white">Industrial</p>
              </div>
              <button
                type="button"
                aria-label="Fechar menu de navegação"
                className="rounded-md p-2 text-slate-300 hover:bg-slate-800 hover:text-white"
                onClick={onMobileClose}
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <NavLinks onNavigate={onMobileClose} />
          </aside>
        </div>
      )}
    </>
  );
}
