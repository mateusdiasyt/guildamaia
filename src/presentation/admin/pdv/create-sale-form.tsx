"use client";

import { PaymentMethod } from "@prisma/client";
import { useActionState, useMemo, useState } from "react";

import { ActionFeedback } from "@/components/admin/action-feedback";
import { FormSubmitButton } from "@/components/admin/form-submit-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatCurrency } from "@/lib/format";
import { initialActionState } from "@/presentation/admin/common/action-state";
import { addComandaItemAction, closeComandaAction } from "@/presentation/admin/pdv/actions";

type OpenSessionOption = {
  id: string;
  cashRegister: {
    name: string;
    code: string;
  };
};

type OpenComandaOption = {
  id: string;
  number: number;
  customerName: string;
  subtotalAmount: number;
  itemCount: number;
};

type ProductOption = {
  id: string;
  name: string;
  sku: string;
};

type CreateSaleFormProps = {
  openSessions: OpenSessionOption[];
  openComandas: OpenComandaOption[];
  products: ProductOption[];
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

export function CreateSaleForm({ openSessions, openComandas, products }: CreateSaleFormProps) {
  const [addState, addFormAction] = useActionState(addComandaItemAction, initialActionState);
  const [saleState, saleFormAction] = useActionState(closeComandaAction, initialActionState);
  const [selectedComandaId, setSelectedComandaId] = useState(openComandas[0]?.id ?? "");
  const [discountAmount, setDiscountAmount] = useState("0.00");

  const selectedComanda = useMemo(
    () => openComandas.find((comanda) => comanda.id === selectedComandaId) ?? openComandas[0] ?? null,
    [openComandas, selectedComandaId],
  );

  const subtotalInCents = selectedComanda ? Math.round(selectedComanda.subtotalAmount * 100) : 0;
  const discountInCents = Math.max(0, parseMoneyToCents(discountAmount));
  const totalInCents = Math.max(subtotalInCents - discountInCents, 0);

  return (
    <div className="space-y-4">
      <div className="admin-form-section space-y-3">
        <p className="text-sm font-semibold text-foreground">Selecionar comanda no caixa</p>
        <div className="space-y-2">
          <Label htmlFor="cash-comandaId">Numero da comanda</Label>
          <select
            id="cash-comandaId"
            className="admin-native-select"
            value={selectedComandaId}
            onChange={(event) => setSelectedComandaId(event.target.value)}
          >
            {openComandas.map((comanda) => (
              <option key={comanda.id} value={comanda.id}>
                #{comanda.number} - {comanda.customerName} ({comanda.itemCount} item(ns))
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <form action={addFormAction} className="admin-form-section space-y-3">
          <p className="text-sm font-semibold text-foreground">Lancar pedido na comanda</p>
          <input type="hidden" name="comandaId" value={selectedComandaId} />

          <div className="space-y-2">
            <Label htmlFor="productId">Produto</Label>
            <select id="productId" name="productId" className="admin-native-select" required>
              <option value="">Selecione um produto</option>
              {products.map((product) => (
                <option key={product.id} value={product.id}>
                  {product.name} ({product.sku})
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="quantity">Quantidade</Label>
            <Input id="quantity" name="quantity" type="number" min={1} step={1} defaultValue={1} required />
          </div>

          <FormSubmitButton>Adicionar pedido na comanda</FormSubmitButton>
          <ActionFeedback state={addState} />
        </form>

        <form action={saleFormAction} className="admin-form-section space-y-3">
          <p className="text-sm font-semibold text-foreground">Registrar venda da comanda</p>
          <input type="hidden" name="comandaId" value={selectedComandaId} />

          <div className="space-y-2">
            <Label htmlFor="cashSessionId">Sessao de caixa</Label>
            <select
              id="cashSessionId"
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
            <Label htmlFor="paymentMethod">Pagamento</Label>
            <select
              id="paymentMethod"
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
            <Label htmlFor="discountAmount">Desconto (R$)</Label>
            <Input
              id="discountAmount"
              name="discountAmount"
              value={discountAmount}
              onChange={(event) => setDiscountAmount(event.target.value)}
              placeholder="0.00"
              required
            />
          </div>

          <div className="space-y-1 rounded-xl border border-border/80 bg-muted/35 p-3">
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>Subtotal da comanda</span>
              <span>{formatCurrency(subtotalInCents / 100)}</span>
            </div>
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>Desconto</span>
              <span>{formatCurrency(discountInCents / 100)}</span>
            </div>
            <div className="mt-2 flex items-center justify-between border-t border-border/70 pt-2 text-base font-semibold text-foreground">
              <span>Total da venda</span>
              <span>{formatCurrency(totalInCents / 100)}</span>
            </div>
          </div>

          <FormSubmitButton>Fechar comanda e registrar venda</FormSubmitButton>
          <ActionFeedback state={saleState} />
        </form>
      </div>
    </div>
  );
}
