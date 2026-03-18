import { Bell } from "lucide-react";

import { AdminMobileNav } from "@/components/admin/admin-mobile-nav";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

type AdminHeaderProps = {
  userName?: string | null;
  roleSlug: string;
  permissions: string[];
};

export function AdminHeader({ userName, roleSlug, permissions }: AdminHeaderProps) {
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-zinc-200/70 bg-white/90 px-4 backdrop-blur-md md:px-6">
      <div className="flex items-center gap-3">
        <div className="md:hidden">
          <AdminMobileNav roleSlug={roleSlug} permissions={permissions} />
        </div>
        <div>
          <p className="text-xs uppercase tracking-[0.12em] text-zinc-500">Painel Administrativo</p>
          <h2 className="text-sm font-semibold text-zinc-900 md:text-base">Operacao ERP + Guilda</h2>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Badge variant="outline" className="hidden border-zinc-300 text-zinc-700 sm:inline-flex">
          {userName ?? "Usuario"}
        </Badge>
        <Button variant="ghost" size="icon" className="text-zinc-600 hover:text-zinc-900">
          <Bell className="h-4 w-4" />
          <span className="sr-only">Alertas</span>
        </Button>
      </div>
    </header>
  );
}
