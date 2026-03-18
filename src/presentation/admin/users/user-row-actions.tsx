"use client";

import { Ellipsis, ShieldCheck, UserRoundCheck, UserRoundX } from "lucide-react";

import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

type UserRowActionsProps = {
  editHref: string;
  toggleFormId: string;
  toggleLabel: string;
  destructiveToggle?: boolean;
};

export function UserRowActions({ editHref, toggleFormId, toggleLabel, destructiveToggle = false }: UserRowActionsProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={<Button type="button" variant="outline" size="icon-sm" className="rounded-lg border-border/70 bg-background/70" />}
      >
        <Ellipsis className="h-4 w-4" />
        <span className="sr-only">Acoes</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52 min-w-52">
        <DropdownMenuItem render={<a href={editHref} className="w-full" />}>
          <ShieldCheck className="h-4 w-4" />
          Atribuir permissoes
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          variant={destructiveToggle ? "destructive" : "default"}
          render={<button type="submit" form={toggleFormId} className="w-full text-left" />}
        >
          {destructiveToggle ? <UserRoundX className="h-4 w-4" /> : <UserRoundCheck className="h-4 w-4" />}
          {toggleLabel}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
