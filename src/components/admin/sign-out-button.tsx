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
      className="w-full justify-start gap-2 text-zinc-300 hover:bg-zinc-800 hover:text-zinc-100"
      onClick={handleSignOut}
      disabled={isPending}
      type="button"
    >
      <LogOut className="h-4 w-4" />
      {isPending ? "Saindo..." : "Sair"}
    </Button>
  );
}
