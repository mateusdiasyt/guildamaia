"use client";

import { PaymentMethod } from "@prisma/client";
import { Plus, Trash2 } from "lucide-react";
import { useActionState, useMemo, useState } from "react";

import { ActionFeedback } from "@/components/admin/action-feedback";
import { FormSubmitButton } from "@/components/admin/form-submit-button";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { initialActionState } from "@/presentation/admin/common/action-state";
import { createSaleAction } from "@/presentation/admin/pdv/actions";

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
  salePrice: string;
  currentStock: number;
};

type CreateSaleFormProps = {
  openSessions: OpenSessionOption[];
  products: ProductOption[];
};

const paymentLabels: Record<PaymentMethod, string> = {
  CASH: "Dinheiro",
  PIX: "Pix",
  CREDIT_CARD: "Cartao de credito",
  DEBIT_CARD: "Cartao de debito",
};

export function CreateSaleForm({ openSessions, products }: CreateSaleFormProps) {
  const [state, formAction] = useActionState(createSaleAction, initialActionState);
  const [itemRows, setItemRows] = useState([0]);
  const [paymentRows, setPaymentRows] = useState([0]);

  const defaultProductId = useMemo(() => products[0]?.id ?? "", [products]);

  function addItemRow() {
    setItemRows((rows) => [...rows, Date.now()]);
  }

  function removeItemRow(targetIndex: number) {
    setItemRows((rows) => rows.filter((_, index) => index !== targetIndex));
  }

  function addPaymentRow() {
    setPaymentRows((rows) => [...rows, Date.now()]);
  }

  function removePaymentRow(targetIndex: number) {
    setPaymentRows((rows) => rows.filter((_, index) => index !== targetIndex));
  }

  return (
    <form action={formAction} className="space-y-5">
      <div className="grid gap-4 md:grid-cols-3">
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="cashSessionId">Sessao de caixa</Label>
          <select
            id="cashSessionId"
            name="cashSessionId"
            className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs"
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
          <Label htmlFor="discountAmount">Desconto (R$)</Label>
          <Input id="discountAmount" name="discountAmount" defaultValue="0.00" required />
        </div>

        <div className="space-y-2 md:col-span-3">
          <Label htmlFor="customerName">Cliente (opcional)</Label>
          <Input id="customerName" name="customerName" placeholder="Nome do cliente" />
        </div>
      </div>

      <div className="space-y-3 rounded-lg border border-zinc-200 p-4">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-zinc-800">Itens da venda</p>
          <Button type="button" size="sm" variant="outline" onClick={addItemRow} className="gap-2">
            <Plus className="h-4 w-4" />
            Adicionar item
          </Button>
        </div>

        <div className="space-y-3">
          {itemRows.map((rowId, index) => (
            <div key={rowId} className="grid gap-3 md:grid-cols-[2fr,1fr,auto]">
              <select
                name="itemProductId"
                className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs"
                defaultValue={defaultProductId}
                required
              >
                {products.map((product) => (
                  <option key={product.id} value={product.id}>
                    {product.name} ({product.sku}) - estoque {product.currentStock}
                  </option>
                ))}
              </select>
              <Input name="itemQuantity" type="number" min={1} defaultValue={1} required />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => removeItemRow(index)}
                disabled={itemRows.length <= 1}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-3 rounded-lg border border-zinc-200 p-4">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-zinc-800">Pagamentos</p>
          <Button type="button" size="sm" variant="outline" onClick={addPaymentRow} className="gap-2">
            <Plus className="h-4 w-4" />
            Adicionar pagamento
          </Button>
        </div>

        <div className="space-y-3">
          {paymentRows.map((rowId, index) => (
            <div key={rowId} className="grid gap-3 md:grid-cols-[2fr,1fr,auto]">
              <select
                name="paymentMethod"
                className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs"
                defaultValue={PaymentMethod.CASH}
                required
              >
                {Object.values(PaymentMethod).map((method) => (
                  <option key={method} value={method}>
                    {paymentLabels[method]}
                  </option>
                ))}
              </select>
              <Input name="paymentAmount" placeholder="0.00" required />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => removePaymentRow(index)}
                disabled={paymentRows.length <= 1}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      </div>

      <div>
        <FormSubmitButton>Registrar venda</FormSubmitButton>
        <ActionFeedback state={state} />
      </div>
    </form>
  );
}
