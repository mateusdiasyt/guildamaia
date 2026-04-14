"use client";

import { useState } from "react";

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

export function PdvWorkspace({
  customers,
  openSessions,
  products,
  openComandas,
  canManage,
}: PdvWorkspaceProps) {
  const [selectedComandaId, setSelectedComandaId] = useState<string | null>(null);

  const selectedComanda = openComandas.find((comanda) => comanda.id === selectedComandaId) ?? null;

  function handleSelectComanda(comandaId: string) {
    setSelectedComandaId((currentValue) => (currentValue === comandaId ? null : comandaId));
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
              <CardDescription>{openComandas.length} comanda(s) ativa(s).</CardDescription>
            </div>
            {canManage ? <CreateComandaDialog customers={customers} /> : null}
          </div>
        </CardHeader>

        <CardContent className="space-y-4 pt-5">
          <OpenComandasBoard
            openComandas={openComandas}
            selectedComandaId={selectedComandaId}
            onSelectComanda={handleSelectComanda}
          />

          <div className="rounded-2xl border border-dashed border-border/75 bg-background/35 px-4 py-3">
            <p className="text-sm font-medium text-foreground">
              {selectedComanda
                ? `Comanda #${selectedComanda.number} selecionada. O atendimento foi aberto ao lado.`
                : "Selecione uma comanda no mapa para abrir o painel de atendimento."}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Clique novamente na mesma comanda para recolher o painel e voltar ao mapa.
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
    </section>
  );
}
