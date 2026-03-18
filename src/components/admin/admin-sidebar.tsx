"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { adminNavigation } from "@/components/admin/navigation";
import { SignOutButton } from "@/components/admin/sign-out-button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type AdminSidebarProps = {
  userName?: string | null;
  roleLabel: string;
  roleSlug: string;
  permissions: string[];
};

export function AdminSidebar({ userName, roleLabel, roleSlug, permissions }: AdminSidebarProps) {
  const pathname = usePathname();

  const isAdmin = roleSlug === "administrador";
  const items = adminNavigation.filter((item) => isAdmin || permissions.includes(item.permission));

  return (
    <aside className="flex h-screen w-72 flex-col border-r border-zinc-800 bg-zinc-950 text-zinc-100">
      <div className="border-b border-zinc-800 px-6 py-5">
        <p className="text-xs uppercase tracking-[0.16em] text-zinc-400">Guilda Maia</p>
        <h1 className="mt-2 text-lg font-semibold">ERP + Guild Platform</h1>
        <p className="mt-2 text-sm text-zinc-400">{userName ?? "Usuario"}</p>
        <Badge className="mt-2 bg-emerald-600/20 text-emerald-300 hover:bg-emerald-600/20">
          {roleLabel}
        </Badge>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-4">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive =
            item.href === "/admin"
              ? pathname === "/admin"
              : pathname?.startsWith(item.href.replace("#novo-registro", ""));

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-zinc-800 text-zinc-100"
                  : "text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200",
              )}
            >
              <Icon className="h-4 w-4" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-zinc-800 p-3">
        <SignOutButton />
      </div>
    </aside>
  );
}
