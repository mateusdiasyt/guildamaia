import { RecordStatus } from "@prisma/client";

import { requirePermission } from "@/application/auth/guards";
import { getProductFormOptions, getProducts } from "@/application/catalog/product-service";
import { PageHeader } from "@/components/admin/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { hasPermission, PERMISSIONS } from "@/domain/auth/permissions";
import { formatCurrency } from "@/lib/format";
import { CreateProductForm } from "@/presentation/admin/catalog/products/create-product-form";
import { toggleProductStatusAction } from "@/presentation/admin/catalog/products/actions";

type ProductsPageProps = {
  searchParams: Promise<{
    q?: string;
  }>;
};

export default async function ProductsPage({ searchParams }: ProductsPageProps) {
  const session = await requirePermission(PERMISSIONS.PRODUCTS_VIEW);
  const { q } = await searchParams;
  const search = q?.trim() || undefined;

  const [products, options] = await Promise.all([getProducts(search), getProductFormOptions()]);
  const canManage = hasPermission(session.user.permissions, PERMISSIONS.PRODUCTS_MANAGE);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Modulo ERP"
        title="Produtos"
        description="Cadastro tecnico-comercial com custo, margem, fornecedor e status operacional."
      />

      <Card>
        <CardHeader>
          <CardTitle>Filtro rapido</CardTitle>
        </CardHeader>
        <CardContent>
          <form method="GET">
            <Input name="q" defaultValue={search ?? ""} placeholder="Buscar por nome ou SKU" />
          </form>
        </CardContent>
      </Card>

      {canManage ? (
        <Card>
          <CardHeader>
            <CardTitle>Novo produto</CardTitle>
            <CardDescription>Cadastro com regra de margem e estoque inicial.</CardDescription>
          </CardHeader>
          <CardContent>
            <CreateProductForm categories={options.categories} suppliers={options.suppliers} />
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Lista de produtos</CardTitle>
          <CardDescription>{products.length} registro(s) encontrado(s).</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Produto</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead>Fornecedor</TableHead>
                <TableHead className="text-right">Custo</TableHead>
                <TableHead className="text-right">Venda</TableHead>
                <TableHead className="text-right">Estoque</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Acoes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center text-sm text-zinc-500">
                    Nenhum produto encontrado.
                  </TableCell>
                </TableRow>
              ) : null}
              {products.map((product) => {
                const isLowStock = product.currentStock <= product.minStock;

                return (
                  <TableRow key={product.id}>
                    <TableCell className="font-medium text-zinc-900">{product.name}</TableCell>
                    <TableCell>{product.sku}</TableCell>
                    <TableCell>{product.category.name}</TableCell>
                    <TableCell>{product.supplier?.tradeName ?? "-"}</TableCell>
                    <TableCell className="text-right">{formatCurrency(Number(product.costPrice))}</TableCell>
                    <TableCell className="text-right">{formatCurrency(Number(product.salePrice))}</TableCell>
                    <TableCell className="text-right">
                      <span className={isLowStock ? "font-semibold text-amber-700" : ""}>
                        {product.currentStock}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={
                          product.status === RecordStatus.ACTIVE
                            ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-100"
                            : "bg-zinc-100 text-zinc-600 hover:bg-zinc-100"
                        }
                      >
                        {product.status === RecordStatus.ACTIVE ? "Ativo" : "Inativo"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {canManage ? (
                        <form action={toggleProductStatusAction}>
                          <input type="hidden" name="productId" value={product.id} />
                          <input
                            type="hidden"
                            name="status"
                            value={
                              product.status === RecordStatus.ACTIVE
                                ? RecordStatus.INACTIVE
                                : RecordStatus.ACTIVE
                            }
                          />
                          <Button type="submit" variant="outline" size="sm">
                            {product.status === RecordStatus.ACTIVE ? "Desativar" : "Reativar"}
                          </Button>
                        </form>
                      ) : (
                        <span className="text-xs text-zinc-500">Sem permissao</span>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
