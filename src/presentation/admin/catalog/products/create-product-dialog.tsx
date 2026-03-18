"use client";

import { Plus } from "lucide-react";

import { CreateProductForm } from "@/presentation/admin/catalog/products/create-product-form";
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
  return (
    <Dialog>
      <DialogTrigger render={<Button size="sm" className="gap-1" type="button" />}>
        <Plus className="h-4 w-4" />
        Add Product
      </DialogTrigger>
      <DialogContent className="max-w-[min(1100px,95vw)] gap-0 border-border/80 bg-card p-0 sm:max-w-[min(1100px,95vw)]">
        <DialogHeader className="border-b border-border/70 px-5 py-4 pr-14">
          <DialogTitle>Add Product</DialogTitle>
          <DialogDescription>Cadastro de produto com preco, estoque, categoria e fornecedor.</DialogDescription>
        </DialogHeader>
        <div className="max-h-[78vh] overflow-y-auto p-5">
          <CreateProductForm categories={categories} suppliers={suppliers} />
        </div>
      </DialogContent>
    </Dialog>
  );
}
