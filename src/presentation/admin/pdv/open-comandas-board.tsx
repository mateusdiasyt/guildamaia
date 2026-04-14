"use client";

import { Plus } from "lucide-react";

import { Badge } from "@/components/ui/badge";
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
  canManage: boolean;
  openComandas: OpenComandaView[];
  slotCount: number;
  selectedComandaId: string | null;
  onAddSlot: () => void;
  onRequestCreateComanda: (slotNumber: number) => void;
  onSelectComanda: (comandaId: string) => void;
};

export function OpenComandasBoard({
  canManage,
  openComandas,
  slotCount,
  selectedComandaId,
  onAddSlot,
  onRequestCreateComanda,
  onSelectComanda,
}: OpenComandasBoardProps) {
  const activeComandasByNumber = new Map(openComandas.map((comanda) => [comanda.number, comanda]));
  const slotNumbers = Array.from({ length: slotCount }, (_, index) => index + 1);
  const compactGrid = Boolean(selectedComandaId);

  return (
    <div>
      <div
        className={cn(
          "grid gap-2.5",
          compactGrid
            ? "grid-cols-4 sm:grid-cols-5 md:grid-cols-6 xl:grid-cols-4 2xl:grid-cols-5"
            : "grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-7 xl:grid-cols-8 2xl:grid-cols-10",
        )}
      >
        {slotNumbers.map((slotNumber) => {
          const comanda = activeComandasByNumber.get(slotNumber);
          const isSelected = comanda?.id === selectedComandaId;

          if (!comanda) {
            return (
              <button
                key={`slot-${slotNumber}`}
                type="button"
                disabled={!canManage}
                onClick={() => onRequestCreateComanda(slotNumber)}
                className={cn(
                  "group flex aspect-square flex-col rounded-[1.05rem] border border-dashed border-border/75 bg-background/24 p-2.5 text-left transition-all duration-200",
                  "focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring/25",
                  canManage
                    ? "hover:-translate-y-0.5 hover:border-primary/35 hover:bg-background/48"
                    : "cursor-not-allowed opacity-65",
                )}
              >
                <div className="flex items-center justify-between">
                  <span className="h-2.5 w-2.5 rounded-full bg-border/80" />
                  <span className="text-[10px] text-muted-foreground/40"> </span>
                </div>

                <div className="mt-auto">
                  <p className="font-mono text-[1.35rem] font-semibold tracking-[-0.05em] text-foreground/86">
                    #{slotNumber}
                  </p>
                </div>
              </button>
            );
          }

          return (
            <button
              key={comanda.id}
              type="button"
              aria-pressed={isSelected}
              onClick={() => onSelectComanda(comanda.id)}
              className={cn(
                "group relative flex aspect-square flex-col rounded-[1.05rem] border p-2.5 text-left transition-all duration-200",
                "focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring/25",
                isSelected
                  ? "border-primary/70 bg-primary/12 shadow-[0_18px_34px_-26px_color-mix(in_oklab,var(--primary)_82%,transparent)]"
                  : "border-border/75 bg-card/74 hover:-translate-y-0.5 hover:border-primary/30 hover:bg-card/92",
              )}
            >
              <div
                className={cn(
                  "absolute inset-0 rounded-[1.1rem] opacity-0 transition-opacity duration-200",
                  "bg-[radial-gradient(circle_at_top_right,color-mix(in_oklab,var(--primary)_12%,transparent),transparent_56%)]",
                  isSelected && "opacity-100",
                )}
              />

              <div className="relative flex h-full flex-col">
                <div className="flex items-center justify-between">
                  <span
                    className={cn(
                      "h-2.5 w-2.5 rounded-full",
                      isSelected ? "bg-primary" : "bg-emerald-400",
                    )}
                  />
                  {comanda.itemCount > 0 ? (
                    <Badge className="rounded-full border border-border/70 bg-background/68 px-2 py-0.5 text-[10px] text-foreground/82 hover:bg-background/68">
                      {comanda.itemCount}
                    </Badge>
                  ) : (
                    <span className="text-[10px] text-muted-foreground/40"> </span>
                  )}
                </div>

                <div className="mt-auto">
                  <p className="font-mono text-[1.35rem] font-semibold tracking-[-0.05em] text-foreground">
                    #{comanda.number}
                  </p>
                </div>
              </div>
            </button>
          );
        })}

        {canManage ? (
          <button
            type="button"
            onClick={onAddSlot}
            className="group flex aspect-square flex-col items-center justify-center rounded-[1.05rem] border border-dashed border-primary/35 bg-primary/6 p-2.5 text-center transition-all duration-200 hover:-translate-y-0.5 hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring/25"
          >
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-primary/28 bg-primary/12 text-primary">
              <Plus className="h-4 w-4" />
            </span>
            <p className="mt-2 text-[11px] text-muted-foreground">#{slotCount + 1}</p>
          </button>
        ) : null}
      </div>
    </div>
  );
}
