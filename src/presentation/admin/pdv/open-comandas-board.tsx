"use client";

import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/format";
import { cn } from "@/lib/utils";

type OpenComandaView = {
  id: string;
  number: number;
  isWalkIn: boolean;
  customerName: string;
  subtotalAmount: number;
  itemCount: number;
  openedAt: string;
};

type OpenComandasBoardProps = {
  openComandas: OpenComandaView[];
  selectedComandaId: string | null;
  onSelectComanda: (comandaId: string) => void;
};

const openedAtFormatter = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
});

export function OpenComandasBoard({
  openComandas,
  selectedComandaId,
  onSelectComanda,
}: OpenComandasBoardProps) {
  if (openComandas.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-border/80 bg-muted/35 px-3 py-4 text-sm text-muted-foreground">
        Nenhuma comanda aberta no momento.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground">
        Toque em uma comanda para abrir o atendimento com animacao lateral.
      </p>

      <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-2 2xl:grid-cols-3">
        {openComandas.map((comanda) => {
          const isActive = comanda.id === selectedComandaId;
          const hasItems = comanda.itemCount > 0;

          return (
            <button
              key={comanda.id}
              type="button"
              aria-pressed={isActive}
              onClick={() => onSelectComanda(comanda.id)}
              className={cn(
                "group relative aspect-square overflow-hidden rounded-[1.6rem] border text-left transition-all duration-300",
                "focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring/25",
                isActive
                  ? "border-primary/70 bg-primary/12 shadow-[0_22px_40px_-26px_color-mix(in_oklab,var(--primary)_82%,transparent)]"
                  : hasItems
                    ? "border-border/75 bg-card/70 hover:-translate-y-1 hover:border-primary/35 hover:bg-card/90"
                    : "border-border/75 bg-background/45 hover:-translate-y-1 hover:border-border hover:bg-card/72",
              )}
            >
              <div
                className={cn(
                  "absolute inset-0 opacity-0 transition-opacity duration-300",
                  hasItems &&
                    "bg-[radial-gradient(circle_at_top_right,color-mix(in_oklab,var(--primary)_15%,transparent),transparent_55%)]",
                  isActive && "opacity-100",
                )}
              />

              <div className="relative flex h-full flex-col justify-between p-4">
                <div className="flex items-start justify-between gap-2">
                  <Badge
                    className={cn(
                      "rounded-full border px-2.5 py-1 text-[11px]",
                      isActive
                        ? "border-primary/45 bg-primary/15 text-primary hover:bg-primary/15"
                        : "border-border/70 bg-background/65 text-foreground/85 hover:bg-background/65",
                    )}
                  >
                    {comanda.itemCount} item(ns)
                  </Badge>

                  <span className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
                    {comanda.isWalkIn ? "Avulsa" : "Cliente"}
                  </span>
                </div>

                <div className="space-y-2">
                  <p className="font-mono text-[2rem] font-semibold tracking-[-0.04em] text-foreground">
                    #{comanda.number}
                  </p>
                  <p className="line-clamp-2 text-sm font-medium text-foreground/88">
                    {comanda.isWalkIn ? "Cliente nao informado" : comanda.customerName}
                  </p>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                    <span>Subtotal</span>
                    <span className="font-semibold text-foreground">{formatCurrency(comanda.subtotalAmount)}</span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                    <span>Abertura</span>
                    <span>{openedAtFormatter.format(new Date(comanda.openedAt))}</span>
                  </div>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
