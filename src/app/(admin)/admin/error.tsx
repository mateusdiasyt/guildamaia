"use client";

import { useEffect } from "react";

import { Button } from "@/components/ui/button";

type AdminErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function AdminError({ error, reset }: AdminErrorProps) {
  useEffect(() => {
    console.error("Admin route error:", error);
  }, [error]);

  return (
    <div className="rounded-xl border border-rose-200 bg-rose-50 p-6">
      <h2 className="text-lg font-semibold text-rose-800">Falha ao carregar modulo administrativo</h2>
      <p className="mt-2 text-sm text-rose-700">
        Tente novamente. Se o problema persistir, valide variaveis de ambiente e conexao com banco.
      </p>
      <Button className="mt-4" variant="destructive" onClick={reset} type="button">
        Tentar novamente
      </Button>
    </div>
  );
}
