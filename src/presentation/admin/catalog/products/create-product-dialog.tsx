"use client";

import { Plus } from "lucide-react";
import { useState } from "react";

import { CreateProductForm } from "@/presentation/admin/catalog/products/create-product-form";
import { createProductAction } from "@/presentation/admin/catalog/products/actions";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

type ProductOption = {
  id: string;
  name: string;
};

type SupplierOption = {
  id: string;
  tradeName: string;
};

type CreateProductDialogProps = {
  categories: ProductOption[];
  suppliers: SupplierOption[];
};

export function CreateProductDialog({ categories, suppliers }: CreateProductDialogProps) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button size="sm" className="gap-1" type="button" />}>
        <Plus className="h-4 w-4" />
        Novo produto
      </DialogTrigger>
      <DialogContent className="max-w-[min(1100px,95vw)] gap-0 border-border/80 bg-card p-0 sm:max-w-[min(1100px,95vw)]">
        <DialogHeader className="border-b border-border/70 px-5 py-4 pr-14">
          <DialogTitle>Novo produto</DialogTitle>
          <DialogDescription>Cadastro de produto com imagem, preco, estoque, categoria e fornecedor.</DialogDescription>
        </DialogHeader>
        <div className="max-h-[78vh] overflow-y-auto p-5">
          <CreateProductForm
            action={createProductAction}
            categories={categories}
            suppliers={suppliers}
            submitLabel="Criar produto"
            onSuccess={() => setOpen(false)}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
