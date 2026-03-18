import { Bell } from "lucide-react";

import { BrandLogo } from "@/components/admin/brand-logo";
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
    <header className="sticky top-0 z-30 border-b border-border/80 bg-background/78 px-4 py-3 backdrop-blur-xl md:px-8">
      <div className="mx-auto flex w-full max-w-[1400px] items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="md:hidden">
          <AdminMobileNav roleSlug={roleSlug} permissions={permissions} />
        </div>
        <BrandLogo className="hidden w-32 md:block" />
        <div className="space-y-0.5">
          <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
            Painel Administrativo
          </p>
          <h2 className="text-sm font-semibold tracking-[-0.01em] text-foreground md:text-base">Operacao interna</h2>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Badge
          variant="outline"
          className="hidden rounded-full border-border bg-card/85 px-2.5 text-foreground/85 shadow-sm sm:inline-flex"
        >
          {userName ?? "Usuario"}
        </Badge>
        <Button variant="outline" size="icon-sm" className="rounded-full">
          <Bell className="h-4 w-4" />
          <span className="sr-only">Alertas</span>
        </Button>
      </div>
      </div>
    </header>
  );
}
