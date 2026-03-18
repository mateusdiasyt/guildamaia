"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";

import { adminNavigation } from "@/components/admin/navigation";
import { SignOutButton } from "@/components/admin/sign-out-button";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

type AdminMobileNavProps = {
  permissions: string[];
};

export function AdminMobileNav({ permissions }: AdminMobileNavProps) {
  const pathname = usePathname();
  const items = adminNavigation.filter((item) => permissions.includes(item.permission));

  return (
    <Sheet>
      <SheetTrigger render={<Button variant="outline" size="icon" />}>
        <Menu className="h-5 w-5" />
        <span className="sr-only">Abrir menu</span>
      </SheetTrigger>
      <SheetContent side="left" className="flex flex-col bg-zinc-950 p-0 text-zinc-100">
        <SheetHeader className="border-b border-zinc-800 p-6">
          <SheetTitle className="text-left text-zinc-100">ERP + Guild</SheetTitle>
        </SheetHeader>
        <div className="flex-1 space-y-1 p-3">
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
                {item.label}
              </Link>
            );
          })}
        </div>
        <div className="border-t border-zinc-800 p-3">
          <SignOutButton />
        </div>
      </SheetContent>
    </Sheet>
  );
}
