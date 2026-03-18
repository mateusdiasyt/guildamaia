"use client";

import { RecordStatus, StockMovementType } from "@prisma/client";
import { useActionState } from "react";

import { ActionFeedback } from "@/components/admin/action-feedback";
import { FormSubmitButton } from "@/components/admin/form-submit-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { initialActionState } from "@/presentation/admin/common/action-state";
import { createStockMovementAction } from "@/presentation/admin/stock/actions";

type StockProductOption = {
  id: string;
  name: string;
  sku: string;
  currentStock: number;
  status: RecordStatus;
};

type CreateStockMovementFormProps = {
  products: StockProductOption[];
};

export function CreateStockMovementForm({ products }: CreateStockMovementFormProps) {
  const [state, formAction] = useActionState(createStockMovementAction, initialActionState);
  const activeProducts = products.filter((product) => product.status === RecordStatus.ACTIVE);

  return (
    <form action={formAction} className="grid gap-4 md:grid-cols-2" id="novo-registro">
      <div className="space-y-2 md:col-span-2">
        <Label htmlFor="productId">Produto</Label>
        <select
          id="productId"
          name="productId"
          className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs"
          defaultValue={activeProducts[0]?.id}
          required
        >
          {activeProducts.map((product) => (
            <option key={product.id} value={product.id}>
              {product.name} ({product.sku}) - estoque atual {product.currentStock}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="type">Tipo de movimentacao</Label>
        <select
          id="type"
          name="type"
          className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs"
          defaultValue={StockMovementType.IN}
        >
          <option value={StockMovementType.IN}>Entrada</option>
          <option value={StockMovementType.OUT}>Saida</option>
          <option value={StockMovementType.ADJUSTMENT}>Ajuste</option>
        </select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="quantity">Quantidade</Label>
        <Input id="quantity" name="quantity" type="number" min={1} defaultValue={1} required />
      </div>

      <div className="space-y-2">
        <Label htmlFor="unitCost">Custo unitario (opcional)</Label>
        <Input id="unitCost" name="unitCost" placeholder="0.00" />
      </div>

      <div className="space-y-2 md:col-span-2">
        <Label htmlFor="note">Observacao</Label>
        <Textarea id="note" name="note" rows={3} placeholder="Motivo da movimentacao" />
      </div>

      <div className="md:col-span-2">
        <FormSubmitButton>Registrar movimentacao</FormSubmitButton>
        <ActionFeedback state={state} />
      </div>
    </form>
  );
}
