import Link from "next/link";
import { RecordStatus } from "@prisma/client";
import { Download, Search, SlidersHorizontal } from "lucide-react";

import { requirePermission } from "@/application/auth/guards";
import { getProductFormOptions, getProducts } from "@/application/catalog/product-service";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { hasPermission, PERMISSIONS } from "@/domain/auth/permissions";
import { formatCurrency } from "@/lib/format";
import { cn } from "@/lib/utils";
import { CreateProductDialog } from "@/presentation/admin/catalog/products/create-product-dialog";
import { toggleProductStatusAction } from "@/presentation/admin/catalog/products/actions";

type ProductsPageProps = {
  searchParams: Promise<{
    q?: string;
    status?: string;
    categoryId?: string;
  }>;
};

const statusFilterOptions: Array<{ label: string; value: string }> = [
  { label: "Todos", value: "all" },
  { label: "Ativos", value: RecordStatus.ACTIVE },
  { label: "Inativos", value: RecordStatus.INACTIVE },
];

const headerOutlineLinkClass =
  "inline-flex h-8 items-center justify-center gap-1.5 rounded-xl border border-border/80 bg-background/85 px-3 text-[0.8rem] font-medium text-foreground shadow-sm transition-colors hover:border-border hover:bg-muted/70";

function productAvatarLabel(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

export default async function ProductsPage({ searchParams }: ProductsPageProps) {
  const session = await requirePermission(PERMISSIONS.PRODUCTS_VIEW);
  const { q, status, categoryId } = await searchParams;
  const search = q?.trim() || undefined;
  const statusFilter =
    status === RecordStatus.ACTIVE || status === RecordStatus.INACTIVE ? (status as RecordStatus) : undefined;
  const categoryFilter =
    categoryId && categoryId !== "all" ? categoryId.trim() || undefined : undefined;

  const [products, options] = await Promise.all([
    getProducts({
      search,
      status: statusFilter,
      categoryId: categoryFilter,
    }),
    getProductFormOptions(),
  ]);
  const canManage = hasPermission(session.user.permissions, PERMISSIONS.PRODUCTS_MANAGE);
  const hasFilters = Boolean(search || statusFilter || categoryFilter);

  return (
    <div className="space-y-6">
      <section className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Modulo ERP</p>
          <h1 className="text-3xl font-semibold tracking-[-0.01em] text-foreground">Products List</h1>
          <p className="text-sm text-muted-foreground">
            Listagem operacional de produtos com filtros por status e categoria.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Link href="/admin/products" className={headerOutlineLinkClass}>
            <Download className="h-4 w-4" />
            Atualizar
          </Link>
          {canManage ? <CreateProductDialog categories={options.categories} suppliers={options.suppliers} /> : null}
        </div>
      </section>

      <Card>
        <CardContent className="space-y-4 pt-4">
          <form
            method="GET"
            className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_170px_220px_auto_auto]"
          >
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                name="q"
                defaultValue={search ?? ""}
                placeholder="Search product name or SKU"
                className="pl-9"
              />
            </div>

            <select
              name="status"
              className="admin-native-select"
              defaultValue={statusFilter ?? "all"}
            >
              {statusFilterOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>

            <select
              name="categoryId"
              className="admin-native-select"
              defaultValue={categoryFilter ?? "all"}
            >
              <option value="all">Categoria</option>
              {options.categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>

            <Button type="submit" variant="secondary" className="gap-2">
              <SlidersHorizontal className="h-4 w-4" />
              Filtrar
            </Button>

            <Link href="/admin/products" className={headerOutlineLinkClass}>
              Limpar
            </Link>
          </form>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-8">
                  <input type="checkbox" className="h-4 w-4 rounded border-border/80 bg-background" />
                </TableHead>
                <TableHead>Product Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Stock</TableHead>
                <TableHead className="text-right">Price</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-sm text-muted-foreground">
                    Nenhum produto encontrado com os filtros atuais.
                  </TableCell>
                </TableRow>
              ) : null}
              {products.map((product) => {
                const isLowStock = product.currentStock <= product.minStock;
                const isOutOfStock = product.currentStock <= 0;
                const stockLabel = isOutOfStock ? "Out of Stock" : isLowStock ? "Low Stock" : "In Stock";

                return (
                  <TableRow key={product.id}>
                    <TableCell className="w-8">
                      <input type="checkbox" className="h-4 w-4 rounded border-border/80 bg-background" />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border/75 bg-muted/35 text-xs font-semibold text-muted-foreground">
                          {productAvatarLabel(product.name)}
                        </div>
                        <div>
                          <p className="font-semibold text-foreground">{product.name}</p>
                          <p className="text-xs text-muted-foreground">{product.sku}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{product.category.name}</TableCell>
                    <TableCell>
                      <div className="space-y-0.5">
                        <p className="font-semibold text-foreground">{product.currentStock}</p>
                        <p
                          className={cn(
                            "text-xs font-medium",
                            isOutOfStock
                              ? "text-rose-400"
                              : isLowStock
                                ? "text-amber-400"
                                : "text-emerald-400",
                          )}
                        >
                          {stockLabel}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">{formatCurrency(Number(product.salePrice))}</TableCell>
                    <TableCell>
                      <Badge
                        className={
                          product.status === RecordStatus.ACTIVE
                            ? "border border-emerald-400/20 bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/15"
                            : "border border-rose-400/20 bg-rose-500/15 text-rose-300 hover:bg-rose-500/15"
                        }
                      >
                        {product.status === RecordStatus.ACTIVE ? "Published" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {canManage ? (
                        <form action={toggleProductStatusAction} className="inline-flex">
                          <input type="hidden" name="productId" value={product.id} />
                          <input
                            type="hidden"
                            name="status"
                            value={
                              product.status === RecordStatus.ACTIVE ? RecordStatus.INACTIVE : RecordStatus.ACTIVE
                            }
                          />
                          <Button type="submit" variant="outline" size="sm">
                            {product.status === RecordStatus.ACTIVE ? "Desativar" : "Reativar"}
                          </Button>
                        </form>
                      ) : (
                        <span className="text-xs text-muted-foreground">Sem permissao</span>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>

          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border/70 pt-3 text-xs text-muted-foreground">
            <p>
              Resultado 1-{products.length} de {products.length}
            </p>
            <p>
              Filtros ativos: {hasFilters ? "sim" : "nao"}
            </p>
          </div>
        </CardContent>
      </Card>

    </div>
  );
}
