"use client";

import Image from "next/image";
import { RecordStatus } from "@prisma/client";
import { ImageIcon } from "lucide-react";
import { useActionState, useEffect, useState } from "react";

import { ActionFeedback } from "@/components/admin/action-feedback";
import { FormSubmitButton } from "@/components/admin/form-submit-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { initialActionState, type ActionState } from "@/presentation/admin/common/action-state";

type ProductOption = {
  id: string;
  name: string;
};

type SupplierOption = {
  id: string;
  tradeName: string;
};

type ProductFormInitialData = {
  productId?: string;
  name?: string;
  sku?: string;
  description?: string | null;
  imageUrl?: string | null;
  categoryId?: string;
  supplierId?: string | null;
  costPrice?: string;
  salePrice?: string;
  minStock?: number;
  currentStock?: number;
  status?: RecordStatus;
};

type ProductFormAction = (
  prevState: ActionState | undefined,
  formData: FormData,
) => Promise<ActionState>;

type ProductFormProps = {
  action: ProductFormAction;
  categories: ProductOption[];
  suppliers: SupplierOption[];
  submitLabel: string;
  initialData?: ProductFormInitialData;
  onSuccess?: () => void;
};

function ProductImagePreview({
  imageUrl,
  name,
}: {
  imageUrl: string;
  name: string;
}) {
  if (!imageUrl) {
    return (
      <div className="flex h-30 items-center justify-center rounded-2xl border border-dashed border-border/75 bg-background/40 text-muted-foreground">
        <div className="flex flex-col items-center gap-2">
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-border/70 bg-background/65">
            <ImageIcon className="h-4 w-4" />
          </span>
          <p className="text-xs">Sem imagem</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-30 overflow-hidden rounded-2xl border border-border/75 bg-background/30">
      <Image src={imageUrl} alt={name || "Produto"} fill className="object-cover" unoptimized />
    </div>
  );
}

export function CreateProductForm({
  action,
  categories,
  suppliers,
  submitLabel,
  initialData,
  onSuccess,
}: ProductFormProps) {
  const [state, formAction] = useActionState(action, initialActionState);
  const [imagePreviewUrl, setImagePreviewUrl] = useState(initialData?.imageUrl ?? "");

  useEffect(() => {
    if (state.status === "success") {
      onSuccess?.();
    }
  }, [onSuccess, state.status]);

  return (
    <form action={formAction} className="grid gap-5 xl:grid-cols-[280px_minmax(0,1fr)]">
      <aside className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="imageUrl">Imagem do produto</Label>
          <Input
            id="imageUrl"
            name="imageUrl"
            placeholder="https://... ou /imagens/produto.png"
            defaultValue={initialData?.imageUrl ?? ""}
            onChange={(event) => setImagePreviewUrl(event.target.value)}
          />
          <p className="text-xs text-muted-foreground">
            Use uma URL publica ou um caminho local servido pelo projeto.
          </p>
        </div>

        <ProductImagePreview imageUrl={imagePreviewUrl} name={initialData?.name ?? "Produto"} />
      </aside>

      <div className="grid gap-4 md:grid-cols-2">
        {initialData?.productId ? <input type="hidden" name="productId" value={initialData.productId} /> : null}

        <div className="space-y-2">
          <Label htmlFor="name">Nome</Label>
          <Input id="name" name="name" placeholder="Nome do produto" defaultValue={initialData?.name ?? ""} required />
        </div>

        <div className="space-y-2">
          <Label htmlFor="sku">SKU</Label>
          <Input id="sku" name="sku" placeholder="SKU-0001" defaultValue={initialData?.sku ?? ""} required />
        </div>

        <div className="space-y-2">
          <Label htmlFor="categoryId">Categoria</Label>
          <select
            id="categoryId"
            name="categoryId"
            className="admin-native-select"
            required
            defaultValue={initialData?.categoryId ?? categories[0]?.id}
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
            className="admin-native-select"
            defaultValue={initialData?.supplierId ?? ""}
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
          <Input id="costPrice" name="costPrice" placeholder="10.00" defaultValue={initialData?.costPrice ?? ""} required />
        </div>

        <div className="space-y-2">
          <Label htmlFor="salePrice">Preco de venda (R$)</Label>
          <Input id="salePrice" name="salePrice" placeholder="15.00" defaultValue={initialData?.salePrice ?? ""} required />
        </div>

        <div className="space-y-2">
          <Label htmlFor="minStock">Estoque minimo</Label>
          <Input
            id="minStock"
            name="minStock"
            type="number"
            min={0}
            defaultValue={initialData?.minStock ?? 0}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="currentStock">Estoque atual</Label>
          <Input
            id="currentStock"
            name="currentStock"
            type="number"
            min={0}
            defaultValue={initialData?.currentStock ?? 0}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="status">Status</Label>
          <select
            id="status"
            name="status"
            className="admin-native-select"
            defaultValue={initialData?.status ?? RecordStatus.ACTIVE}
          >
            <option value={RecordStatus.ACTIVE}>Ativo</option>
            <option value={RecordStatus.INACTIVE}>Inativo</option>
          </select>
        </div>

        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="description">Descricao</Label>
          <Textarea
            id="description"
            name="description"
            placeholder="Detalhes tecnicos e comerciais"
            rows={4}
            defaultValue={initialData?.description ?? ""}
          />
        </div>

        <div className="md:col-span-2">
          <div className={cn("flex flex-col gap-3", state.status !== "idle" && "items-start")}>
            <FormSubmitButton>{submitLabel}</FormSubmitButton>
            <ActionFeedback state={state} />
          </div>
        </div>
      </div>
    </form>
  );
}
