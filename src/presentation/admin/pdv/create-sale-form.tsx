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
    <form action={formAction} className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <div className="admin-form-section space-y-2 md:col-span-2">
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
          <p className="text-xs text-muted-foreground">
            A venda sera vinculada a sessao escolhida para conciliacao automatica de caixa.
          </p>
        </div>

        <div className="admin-form-section space-y-2">
          <Label htmlFor="discountAmount">Desconto (R$)</Label>
          <Input id="discountAmount" name="discountAmount" defaultValue="0.00" required />
          <p className="text-xs text-muted-foreground">Use desconto apenas em autorizacoes registradas.</p>
        </div>

        <div className="admin-form-section space-y-2 md:col-span-3">
          <Label htmlFor="customerName">Cliente (opcional)</Label>
          <Input id="customerName" name="customerName" placeholder="Nome do cliente" />
        </div>
      </div>

      <div className="admin-form-section space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-foreground">Itens da venda</p>
          <Button type="button" size="sm" variant="outline" onClick={addItemRow} className="gap-2">
            <Plus className="h-4 w-4" />
            Adicionar item
          </Button>
        </div>

        <div className="space-y-3">
          {itemRows.map((rowId, index) => (
            <div key={rowId} className="grid gap-3 rounded-xl border border-border/75 bg-background/65 p-3 md:grid-cols-[2fr,1fr,auto]">
              <select
                name="itemProductId"
                className="admin-native-select"
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
                size="icon-sm"
                onClick={() => removeItemRow(index)}
                disabled={itemRows.length <= 1}
                className="self-center text-rose-700 hover:bg-rose-100 hover:text-rose-700"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      </div>

      <div className="admin-form-section space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-foreground">Pagamentos</p>
          <Button type="button" size="sm" variant="outline" onClick={addPaymentRow} className="gap-2">
            <Plus className="h-4 w-4" />
            Adicionar pagamento
          </Button>
        </div>

        <div className="space-y-3">
          {paymentRows.map((rowId, index) => (
            <div key={rowId} className="grid gap-3 rounded-xl border border-border/75 bg-background/65 p-3 md:grid-cols-[2fr,1fr,auto]">
              <select
                name="paymentMethod"
                className="admin-native-select"
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
                size="icon-sm"
                onClick={() => removePaymentRow(index)}
                disabled={paymentRows.length <= 1}
                className="self-center text-rose-700 hover:bg-rose-100 hover:text-rose-700"
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

