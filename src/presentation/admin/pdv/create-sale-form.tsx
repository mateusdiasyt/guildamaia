"use client";

import Link from "next/link";

import { PaymentMethod } from "@prisma/client";
import { Receipt, X } from "lucide-react";
import { useActionState, useState } from "react";

import { ActionFeedback } from "@/components/admin/action-feedback";
import { FormSubmitButton } from "@/components/admin/form-submit-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatCurrency } from "@/lib/format";
import { initialActionState } from "@/presentation/admin/common/action-state";
import {
  addComandaItemAction,
  closeComandaAction,
  removeComandaItemAction,
} from "@/presentation/admin/pdv/actions";

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

type SelectedComanda = {
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

type CreateSaleFormProps = {
  openSessions: OpenSessionOption[];
  products: ProductOption[];
  selectedComanda: SelectedComanda;
  canManage: boolean;
  onClose: () => void;
};

const paymentLabels: Record<PaymentMethod, string> = {
  CASH: "Dinheiro",
  PIX: "Pix",
  CREDIT_CARD: "Cartao credito",
  DEBIT_CARD: "Cartao debito",
};

function parseMoneyToCents(value: string) {
  const trimmed = value.trim();
  if (!trimmed) {
    return 0;
  }

  let normalized = trimmed.replace(/\s/g, "");
  if (normalized.includes(",") && normalized.includes(".")) {
    normalized = normalized.replace(/\./g, "").replace(",", ".");
  } else if (normalized.includes(",")) {
    normalized = normalized.replace(",", ".");
  }

  const parsed = Number(normalized);
  if (!Number.isFinite(parsed)) {
    return 0;
  }

  return Math.round(parsed * 100);
}

export function CreateSaleForm({
  openSessions,
  products,
  selectedComanda,
  canManage,
  onClose,
}: CreateSaleFormProps) {
  const [addState, addFormAction] = useActionState(addComandaItemAction, initialActionState);
  const [saleState, saleFormAction] = useActionState(closeComandaAction, initialActionState);
  const [discountAmount, setDiscountAmount] = useState("0.00");

  const subtotalInCents = Math.round(selectedComanda.subtotalAmount * 100);
  const discountInCents = Math.max(0, parseMoneyToCents(discountAmount));
  const totalInCents = Math.max(subtotalInCents - discountInCents, 0);
  const hasOpenSessions = openSessions.length > 0;
  const customerLabel = selectedComanda.isWalkIn ? "Comanda avulsa" : selectedComanda.customerName;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 rounded-[1.4rem] border border-border/75 bg-background/36 px-4 py-3">
        <div className="flex min-w-0 items-center gap-3">
          <span className="inline-flex h-11 min-w-11 items-center justify-center rounded-2xl border border-primary/30 bg-primary/10 px-3 font-mono text-lg font-semibold tracking-[-0.04em] text-foreground">
            #{selectedComanda.number}
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-foreground">{customerLabel}</p>
            <p className="text-xs text-muted-foreground">{selectedComanda.itemCount} item(ns)</p>
          </div>
        </div>

        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          className="rounded-full border border-border/70 bg-background/55"
          onClick={onClose}
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Fechar painel da comanda</span>
        </Button>
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
        <section className="admin-form-section space-y-4">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-semibold text-foreground">Pedidos</p>
            <Badge className="border border-border/70 bg-background/68 text-foreground/88 hover:bg-background/68">
              {selectedComanda.items.length}
            </Badge>
          </div>

          {canManage ? (
            <form action={addFormAction} className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_110px_auto] sm:items-end">
              <input type="hidden" name="comandaId" value={selectedComanda.id} />

              <div className="space-y-2">
                <Label htmlFor={`productId-${selectedComanda.id}`}>Produto</Label>
                <select
                  id={`productId-${selectedComanda.id}`}
                  name="productId"
                  className="admin-native-select"
                  required
                >
                  <option value="">Selecione</option>
                  {products.map((product) => (
                    <option key={product.id} value={product.id}>
                      {product.name} ({product.sku})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor={`quantity-${selectedComanda.id}`}>Qtd</Label>
                <Input
                  id={`quantity-${selectedComanda.id}`}
                  name="quantity"
                  type="number"
                  min={1}
                  step={1}
                  defaultValue={1}
                  required
                />
              </div>

              <div>
                <FormSubmitButton>Adicionar</FormSubmitButton>
              </div>

              <div className="sm:col-span-3">
                <ActionFeedback state={addState} />
              </div>
            </form>
          ) : null}

          {selectedComanda.items.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-border/75 bg-background/32 px-4 py-5 text-sm text-muted-foreground">
              Sem itens.
            </p>
          ) : (
            <div className="space-y-2">
              {selectedComanda.items.map((item) => (
                <div
                  key={item.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border/75 bg-background/32 px-4 py-3"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-foreground">{item.product.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {item.quantity}x
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-foreground">{formatCurrency(item.lineTotal)}</p>
                    {canManage ? (
                      <form action={removeComandaItemAction}>
                        <input type="hidden" name="comandaId" value={selectedComanda.id} />
                        <input type="hidden" name="productId" value={item.productId} />
                        <Button type="submit" variant="outline" size="sm">
                          Remover
                        </Button>
                      </form>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="admin-form-section space-y-4">
          <p className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <Receipt className="h-4 w-4 text-primary" />
            Fechamento
          </p>

          {!canManage ? (
            <p className="rounded-2xl border border-dashed border-border/75 bg-background/32 px-4 py-4 text-sm text-muted-foreground">
              Modo leitura.
            </p>
          ) : !hasOpenSessions ? (
            <div className="space-y-3 rounded-2xl border border-amber-400/30 bg-amber-400/8 px-4 py-4">
              <p className="text-sm text-amber-100">Abra um caixa para finalizar.</p>
              <Link
                href="/admin/cash"
                className="inline-flex h-9 items-center justify-center rounded-xl bg-primary px-3.5 text-sm font-medium text-primary-foreground shadow-lg shadow-primary/25"
              >
                Abrir caixa
              </Link>
            </div>
          ) : (
            <form action={saleFormAction} className="space-y-4">
              <input type="hidden" name="comandaId" value={selectedComanda.id} />

              <div className="space-y-2">
                <Label htmlFor={`cashSessionId-${selectedComanda.id}`}>Caixa</Label>
                <select
                  id={`cashSessionId-${selectedComanda.id}`}
                  name="cashSessionId"
                  className="admin-native-select"
                  defaultValue={openSessions[0]?.id}
                  required
                >
                  {openSessions.map((session) => (
                    <option key={session.id} value={session.id}>
                      {session.cashRegister.name} ({session.cashRegister.code})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor={`paymentMethod-${selectedComanda.id}`}>Pagamento</Label>
                <select
                  id={`paymentMethod-${selectedComanda.id}`}
                  name="paymentMethod"
                  className="admin-native-select"
                  defaultValue={PaymentMethod.PIX}
                  required
                >
                  {Object.values(PaymentMethod).map((method) => (
                    <option key={method} value={method}>
                      {paymentLabels[method]}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor={`discountAmount-${selectedComanda.id}`}>Desconto</Label>
                <Input
                  id={`discountAmount-${selectedComanda.id}`}
                  name="discountAmount"
                  value={discountAmount}
                  onChange={(event) => setDiscountAmount(event.target.value)}
                  placeholder="0.00"
                  required
                />
              </div>

              <div className="rounded-2xl border border-border/75 bg-background/32 p-4">
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span>Subtotal</span>
                  <span>{formatCurrency(subtotalInCents / 100)}</span>
                </div>
                <div className="mt-2 flex items-center justify-between text-sm text-muted-foreground">
                  <span>Desconto</span>
                  <span>{formatCurrency(discountInCents / 100)}</span>
                </div>
                <div className="mt-3 flex items-center justify-between border-t border-border/70 pt-3 text-base font-semibold text-foreground">
                  <span>Total</span>
                  <span>{formatCurrency(totalInCents / 100)}</span>
                </div>
              </div>

              <FormSubmitButton>Fechar venda</FormSubmitButton>
              <ActionFeedback state={saleState} />
            </form>
          )}
        </section>
      </div>
    </div>
  );
}
