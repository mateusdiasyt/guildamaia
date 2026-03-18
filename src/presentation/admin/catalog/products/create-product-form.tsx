"use client";

import { RecordStatus } from "@prisma/client";
import { useActionState } from "react";

import { ActionFeedback } from "@/components/admin/action-feedback";
import { FormSubmitButton } from "@/components/admin/form-submit-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { initialActionState } from "@/presentation/admin/common/action-state";
import { createProductAction } from "@/presentation/admin/catalog/products/actions";

type ProductOption = {
  id: string;
  name: string;
};

type SupplierOption = {
  id: string;
  tradeName: string;
};

type CreateProductFormProps = {
  categories: ProductOption[];
  suppliers: SupplierOption[];
};

export function CreateProductForm({ categories, suppliers }: CreateProductFormProps) {
  const [state, formAction] = useActionState(createProductAction, initialActionState);

  return (
    <form action={formAction} className="grid gap-4 md:grid-cols-2">
      <div className="space-y-2">
        <Label htmlFor="name">Nome</Label>
        <Input id="name" name="name" placeholder="Nome do produto" required />
      </div>

      <div className="space-y-2">
        <Label htmlFor="sku">SKU</Label>
        <Input id="sku" name="sku" placeholder="SKU-0001" required />
      </div>

      <div className="space-y-2">
        <Label htmlFor="categoryId">Categoria</Label>
        <select
          id="categoryId"
          name="categoryId"
          className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs"
          required
          defaultValue={categories[0]?.id}
        >
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="supplierId">Fornecedor</Label>
        <select
          id="supplierId"
          name="supplierId"
          className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs"
          defaultValue=""
        >
          <option value="">Sem fornecedor</option>
          {suppliers.map((supplier) => (
            <option key={supplier.id} value={supplier.id}>
              {supplier.tradeName}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="costPrice">Custo (R$)</Label>
        <Input id="costPrice" name="costPrice" placeholder="10.00" required />
      </div>

      <div className="space-y-2">
        <Label htmlFor="salePrice">Preco de venda (R$)</Label>
        <Input id="salePrice" name="salePrice" placeholder="15.00" required />
      </div>

      <div className="space-y-2">
        <Label htmlFor="minStock" className="inline-flex items-center gap-1.5">
          Estoque minimo
          <span
            title="Quantidade de alerta para reposicao. Quando o estoque atual atingir esse valor, o produto entra em nivel de atencao."
            className="inline-flex h-4 w-4 items-center justify-center rounded-full border border-zinc-300 text-[10px] font-semibold text-zinc-600"
          >
            ?
          </span>
        </Label>
        <Input id="minStock" name="minStock" type="number" min={0} defaultValue={0} required />
      </div>

      <div className="space-y-2">
        <Label htmlFor="currentStock" className="inline-flex items-center gap-1.5">
          Estoque atual
          <span
            title="Quantidade disponivel agora para venda. Esse valor diminui a cada venda e aumenta com entradas ou ajustes."
            className="inline-flex h-4 w-4 items-center justify-center rounded-full border border-zinc-300 text-[10px] font-semibold text-zinc-600"
          >
            ?
          </span>
        </Label>
        <Input id="currentStock" name="currentStock" type="number" min={0} defaultValue={0} required />
      </div>

      <div className="space-y-2">
        <Label htmlFor="status">Status</Label>
        <select
          id="status"
          name="status"
          className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs"
          defaultValue={RecordStatus.ACTIVE}
        >
          <option value={RecordStatus.ACTIVE}>Ativo</option>
          <option value={RecordStatus.INACTIVE}>Inativo</option>
        </select>
      </div>

      <div className="space-y-2 md:col-span-2">
        <Label htmlFor="description">Descricao</Label>
        <Textarea id="description" name="description" placeholder="Detalhes tecnicos e comerciais" rows={3} />
      </div>

      <div className="md:col-span-2">
        <FormSubmitButton>Criar produto</FormSubmitButton>
        <ActionFeedback state={state} />
      </div>
    </form>
  );
}
