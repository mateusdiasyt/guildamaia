"use client";

import { LogOut } from "lucide-react";
import { signOut } from "next-auth/react";
import { useTransition } from "react";

import { Button } from "@/components/ui/button";

export function SignOutButton() {
  const [isPending, startTransition] = useTransition();

  function handleSignOut() {
    startTransition(async () => {
      await signOut({ callbackUrl: "/login" });
    });
  }

  return (
    <Button
      variant="ghost"
      className="w-full justify-start gap-2 rounded-xl border border-sidebar-border/70 bg-sidebar-accent/45 text-sidebar-foreground/85 hover:bg-sidebar-accent hover:text-sidebar-foreground"
      onClick={handleSignOut}
      disabled={isPending}
      type="button"
    >
      <LogOut className="h-4 w-4" />
      {isPending ? "Saindo..." : "Sair"}
    </Button>
  );
}
