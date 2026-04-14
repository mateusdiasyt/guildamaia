"use client";

import { useState } from "react";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { CreateComandaDialog } from "@/presentation/admin/pdv/create-comanda-dialog";
import { CreateSaleForm } from "@/presentation/admin/pdv/create-sale-form";
import { OpenComandasBoard } from "@/presentation/admin/pdv/open-comandas-board";

type CustomerOption = {
  id: string;
  fullName: string;
  documentType: "CPF" | "RG";
  documentNumber: string;
};

type OpenSessionOption = {
  id: string;
  cashRegister: {
    name: string;
    code: string;
  };
};

type ProductOption = {
  id: string;
  name: string;
  sku: string;
};

type OpenComandaView = {
  id: string;
  number: number;
  isWalkIn: boolean;
  customerName: string;
  subtotalAmount: number;
  itemCount: number;
  openedAt: string;
  items: Array<{
    id: string;
    productId: string;
    quantity: number;
    lineTotal: number;
    product: {
      name: string;
      sku: string;
    };
  }>;
};

type PdvWorkspaceProps = {
  customers: CustomerOption[];
  openSessions: OpenSessionOption[];
  products: ProductOption[];
  openComandas: OpenComandaView[];
  canManage: boolean;
};

const DEFAULT_SLOT_COUNT = 50;

export function PdvWorkspace({
  customers,
  openSessions,
  products,
  openComandas,
  canManage,
}: PdvWorkspaceProps) {
  const [selectedComandaId, setSelectedComandaId] = useState<string | null>(null);
  const [manualSlotCount, setManualSlotCount] = useState(DEFAULT_SLOT_COUNT);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [createDialogPresetNumber, setCreateDialogPresetNumber] = useState<number | undefined>(undefined);
  const [lockCreateDialogNumber, setLockCreateDialogNumber] = useState(false);

  const selectedComanda = openComandas.find((comanda) => comanda.id === selectedComandaId) ?? null;
  const highestActiveNumber = openComandas.reduce(
    (currentMax, comanda) => Math.max(currentMax, comanda.number),
    DEFAULT_SLOT_COUNT,
  );
  const visibleSlotCount = Math.max(manualSlotCount, highestActiveNumber, DEFAULT_SLOT_COUNT);

  function handleSelectComanda(comandaId: string) {
    setSelectedComandaId((currentValue) => (currentValue === comandaId ? null : comandaId));
  }

  function handleOpenManualCreateDialog() {
    setCreateDialogPresetNumber(undefined);
    setLockCreateDialogNumber(false);
    setIsCreateDialogOpen(true);
  }

  function handleOpenPresetCreateDialog(slotNumber: number) {
    setCreateDialogPresetNumber(slotNumber);
    setLockCreateDialogNumber(true);
    setIsCreateDialogOpen(true);
  }

  function handleAddSlot() {
    setManualSlotCount((currentValue) => Math.max(currentValue, visibleSlotCount) + 1);
  }

  return (
    <section
      className={cn(
        "grid items-start gap-6",
        selectedComanda ? "xl:grid-cols-[minmax(340px,420px)_minmax(0,1fr)]" : "grid-cols-1",
      )}
    >
      <Card className="border-border/80 bg-card/86">
        <CardHeader className="space-y-3 border-b border-border/70 pb-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <CardTitle>Comandas abertas</CardTitle>
              <CardDescription>
                {openComandas.length} comanda(s) ativa(s) em {visibleSlotCount} slot(s) visiveis.
              </CardDescription>
            </div>
            {canManage ? (
              <Button type="button" size="sm" className="gap-2" onClick={handleOpenManualCreateDialog}>
                <Plus className="h-4 w-4" />
                Nova comanda
              </Button>
            ) : null}
          </div>
        </CardHeader>

        <CardContent className="space-y-4 pt-5">
          <OpenComandasBoard
            canManage={canManage}
            openComandas={openComandas}
            slotCount={visibleSlotCount}
            selectedComandaId={selectedComandaId}
            onAddSlot={handleAddSlot}
            onRequestCreateComanda={handleOpenPresetCreateDialog}
            onSelectComanda={handleSelectComanda}
          />

          <div className="rounded-2xl border border-dashed border-border/75 bg-background/35 px-4 py-3">
            <p className="text-sm font-medium text-foreground">
              {selectedComanda
                ? `Comanda #${selectedComanda.number} selecionada. O atendimento foi aberto ao lado.`
                : "Slots inativos podem ser abertos com um clique; slots ativos revelam o atendimento ao lado."}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              O botao final com `+` expande o mapa quando voce precisar ir alem das 50 comandas iniciais.
            </p>
          </div>
        </CardContent>
      </Card>

      {selectedComanda ? (
        <Card className="animate-in fade-in-0 slide-in-from-right-5 duration-300 xl:sticky xl:top-24">
          <CardHeader className="border-b border-border/70 pb-4">
            <CardTitle>Nova venda</CardTitle>
            <CardDescription>
              Fluxo contextual aberto somente quando uma comanda e colocada em foco.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-5">
            <CreateSaleForm
              key={selectedComanda.id}
              canManage={canManage}
              openSessions={openSessions}
              products={products}
              selectedComanda={selectedComanda}
              onClose={() => setSelectedComandaId(null)}
            />
          </CardContent>
        </Card>
      ) : null}

      <CreateComandaDialog
        customers={customers}
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        presetNumber={createDialogPresetNumber}
        lockNumber={lockCreateDialogNumber}
      />
    </section>
  );
}
