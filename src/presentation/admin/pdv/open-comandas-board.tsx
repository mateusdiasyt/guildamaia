"use client";

import { useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatCurrency } from "@/lib/format";
import { removeComandaItemAction } from "@/presentation/admin/pdv/actions";
import { AddComandaItemForm } from "@/presentation/admin/pdv/add-comanda-item-form";
import { CloseComandaForm } from "@/presentation/admin/pdv/close-comanda-form";

type ComandaItemView = {
  id: string;
  productId: string;
  quantity: number;
  lineTotal: number;
  product: {
    name: string;
    sku: string;
  };
};

type OpenComandaView = {
  id: string;
  number: number;
  isWalkIn: boolean;
  customerName: string;
  subtotalAmount: number;
  itemCount: number;
  openedAt: string;
  items: ComandaItemView[];
};

type ProductOption = {
  id: string;
  name: string;
  sku: string;
};

type OpenSessionOption = {
  id: string;
  cashRegister: {
    name: string;
    code: string;
  };
};

type OpenComandasBoardProps = {
  openComandas: OpenComandaView[];
  products: ProductOption[];
  openSessions: OpenSessionOption[];
  canManage: boolean;
};

const openedAtFormatter = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "short",
  timeStyle: "short",
});

export function OpenComandasBoard({
  openComandas,
  products,
  openSessions,
  canManage,
}: OpenComandasBoardProps) {
  const [selectedComandaId, setSelectedComandaId] = useState("");

  const resolvedSelectedComandaId = useMemo(() => {
    if (openComandas.length === 0) {
      return "";
    }

    const selectedExists = openComandas.some((comanda) => comanda.id === selectedComandaId);
    return selectedExists ? selectedComandaId : openComandas[0].id;
  }, [openComandas, selectedComandaId]);

  const selectedComanda = useMemo(
    () => openComandas.find((comanda) => comanda.id === resolvedSelectedComandaId) ?? null,
    [openComandas, resolvedSelectedComandaId],
  );

  if (openComandas.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-border/80 bg-muted/35 px-3 py-4 text-sm text-muted-foreground">
        Nenhuma comanda aberta no momento.
      </p>
    );
  }

  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_420px]">
      <div className="space-y-3">
        <p className="text-xs text-muted-foreground">
          Selecione uma comanda para abrir os detalhes na coluna da direita.
        </p>
        <div className="grid gap-3 sm:grid-cols-2 2xl:grid-cols-3">
          {openComandas.map((comanda) => {
            const isActive = comanda.id === resolvedSelectedComandaId;

            return (
              <button
                key={comanda.id}
                type="button"
                onClick={() => setSelectedComandaId(comanda.id)}
                className={`rounded-xl border p-3 text-left transition-all ${
                  isActive
                    ? "border-primary/70 bg-primary/10 shadow-[0_0_0_1px_color-mix(in_oklab,var(--primary)_42%,transparent)]"
                    : "border-border/70 bg-card/70 hover:border-primary/40 hover:bg-card"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold text-foreground">Comanda #{comanda.number}</p>
                    <p className="text-xs text-muted-foreground">
                      {comanda.isWalkIn ? "Avulsa" : comanda.customerName}
                    </p>
                  </div>
                  <Badge className="border border-border/70 bg-background/70 text-[11px] text-foreground hover:bg-background/70">
                    {comanda.itemCount} item(ns)
                  </Badge>
                </div>
                <div className="mt-3 flex items-center justify-between">
                  <span className="text-[11px] text-muted-foreground">Subtotal</span>
                  <span className="text-sm font-semibold text-foreground">
                    {formatCurrency(comanda.subtotalAmount)}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="rounded-2xl border border-border/75 bg-card/85 p-4 xl:sticky xl:top-4 xl:h-fit">
        {!selectedComanda ? (
          <p className="rounded-xl border border-dashed border-border/80 bg-muted/35 px-3 py-4 text-sm text-muted-foreground">
            Nenhuma comanda selecionada.
          </p>
        ) : (
          <div className="space-y-4">
            <div className="border-b border-border/70 pb-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-base font-semibold text-foreground">
                    Detalhes da comanda #{selectedComanda.number}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {selectedComanda.isWalkIn ? "Comanda avulsa" : selectedComanda.customerName}
                  </p>
                </div>
                <Badge className="bg-primary/15 text-primary hover:bg-primary/15">
                  {formatCurrency(selectedComanda.subtotalAmount)}
                </Badge>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                Aberta em {openedAtFormatter.format(new Date(selectedComanda.openedAt))}
              </p>
            </div>

            {selectedComanda.items.length === 0 ? (
              <p className="rounded-xl border border-dashed border-border px-3 py-4 text-sm text-muted-foreground">
                Nenhum item adicionado nesta comanda.
              </p>
            ) : (
              <div className="max-h-[240px] overflow-auto rounded-xl border border-border/70">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Produto</TableHead>
                      <TableHead className="text-right">Qtd</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                      <TableHead className="text-right">Acoes</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedComanda.items.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>
                          <p className="text-sm text-foreground">{item.product.name}</p>
                          <p className="text-xs text-muted-foreground">{item.product.sku}</p>
                        </TableCell>
                        <TableCell className="text-right">{item.quantity}</TableCell>
                        <TableCell className="text-right">{formatCurrency(item.lineTotal)}</TableCell>
                        <TableCell className="text-right">
                          {canManage ? (
                            <form action={removeComandaItemAction}>
                              <input type="hidden" name="comandaId" value={selectedComanda.id} />
                              <input type="hidden" name="productId" value={item.productId} />
                              <Button type="submit" variant="outline" size="sm">
                                Remover
                              </Button>
                            </form>
                          ) : (
                            <span className="text-xs text-muted-foreground">-</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}

            {canManage ? (
              <div className="rounded-xl border border-border/75 bg-background/60 p-3">
                <p className="mb-3 text-sm font-semibold text-foreground">Adicionar produto</p>
                <AddComandaItemForm comandaId={selectedComanda.id} products={products} />
              </div>
            ) : null}

            {canManage ? (
              openSessions.length === 0 ? (
                <p className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700">
                  Abra uma sessao de caixa para fechar a comanda.
                </p>
              ) : (
                <div className="rounded-xl border border-border/75 bg-background/60 p-3">
                  <p className="mb-3 text-sm font-semibold text-foreground">Fechamento da comanda</p>
                  <CloseComandaForm comandaId={selectedComanda.id} openSessions={openSessions} />
                </div>
              )
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}
