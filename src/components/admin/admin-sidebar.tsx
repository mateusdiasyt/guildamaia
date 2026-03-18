"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { BrandLogo } from "@/components/admin/brand-logo";
import { adminNavigation } from "@/components/admin/navigation";
import { SignOutButton } from "@/components/admin/sign-out-button";
import { cn } from "@/lib/utils";

type AdminSidebarProps = {
  roleSlug: string;
  permissions: string[];
};

export function AdminSidebar({ roleSlug, permissions }: AdminSidebarProps) {
  const pathname = usePathname();

  const isAdmin = roleSlug === "administrador";
  const items = adminNavigation.filter((item) => isAdmin || permissions.includes(item.permission));

  return (
    <aside className="sticky top-0 flex h-screen w-[18.5rem] shrink-0 flex-col border-r border-sidebar-border/80 bg-sidebar/95 text-sidebar-foreground backdrop-blur-xl">
      <div className="border-b border-sidebar-border/75 px-4 py-4">
        <div className="rounded-2xl border border-sidebar-border/80 bg-sidebar-accent/55 p-4 shadow-lg shadow-black/20">
          <BrandLogo priority className="mx-auto max-w-[188px]" />
        </div>
      </div>

      <nav className="flex-1 space-y-1.5 overflow-y-auto px-3 py-4">
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
                "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all",
                isActive
                  ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-lg shadow-sidebar-primary/20"
                  : "text-sidebar-foreground/75 hover:bg-sidebar-accent/80 hover:text-sidebar-foreground",
              )}
            >
              <span
                className={cn(
                  "inline-flex h-7 w-7 items-center justify-center rounded-lg border border-transparent transition-colors",
                  isActive
                    ? "border-white/20 bg-white/12"
                    : "border-sidebar-border/55 bg-sidebar-accent/55 group-hover:border-sidebar-border/80",
                )}
              >
                <Icon className="h-4 w-4" />
              </span>
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-sidebar-border/75 p-3">
        <SignOutButton />
      </div>
    </aside>
  );
}
