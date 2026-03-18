import { StockMovementType } from "@prisma/client";

import { requirePermission } from "@/application/auth/guards";
import { getStockFormOptions, getStockMovements } from "@/application/stock/stock-service";
import { PageHeader } from "@/components/admin/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { hasPermission, PERMISSIONS } from "@/domain/auth/permissions";
import { CreateStockMovementForm } from "@/presentation/admin/stock/create-stock-movement-form";

function movementTypeLabel(type: StockMovementType) {
  if (type === StockMovementType.IN) {
    return "Entrada";
  }

  if (type === StockMovementType.OUT) {
    return "Saida";
  }

  return "Ajuste";
}

function movementTypeClass(type: StockMovementType) {
  if (type === StockMovementType.IN) {
    return "bg-emerald-100 text-emerald-700 hover:bg-emerald-100";
  }

  if (type === StockMovementType.OUT) {
    return "bg-rose-100 text-rose-700 hover:bg-rose-100";
  }

  return "bg-amber-100 text-amber-700 hover:bg-amber-100";
}

const dateFormatter = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "short",
  timeStyle: "short",
});

export default async function StockPage() {
  const session = await requirePermission(PERMISSIONS.STOCK_VIEW);
  const [movements, products] = await Promise.all([getStockMovements(), getStockFormOptions()]);
  const canManage = hasPermission(session.user.permissions, PERMISSIONS.STOCK_MANAGE);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Modulo ERP"
        title="Estoque e Movimentacoes"
        description="Historico auditavel de entradas, saidas e ajustes com operador responsavel."
      />

      {canManage ? (
        <Card>
          <CardHeader>
            <CardTitle>Novo registro de estoque</CardTitle>
            <CardDescription>
              Entradas, saidas e ajustes atualizam o saldo do produto com consistencia transacional.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <CreateStockMovementForm products={products} />
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Historico recente</CardTitle>
          <CardDescription>Ultimas 100 movimentacoes registradas.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Produto</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead className="text-right">Quantidade</TableHead>
                <TableHead className="text-right">Estoque antes</TableHead>
                <TableHead className="text-right">Estoque depois</TableHead>
                <TableHead>Operador</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {movements.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-sm text-zinc-500">
                    Nenhuma movimentacao registrada.
                  </TableCell>
                </TableRow>
              ) : null}
              {movements.map((movement) => (
                <TableRow key={movement.id}>
                  <TableCell>{dateFormatter.format(movement.createdAt)}</TableCell>
                  <TableCell className="font-medium text-zinc-900">
                    {movement.product.name}
                    <p className="text-xs text-zinc-500">{movement.product.sku}</p>
                  </TableCell>
                  <TableCell>
                    <Badge className={movementTypeClass(movement.type)}>{movementTypeLabel(movement.type)}</Badge>
                  </TableCell>
                  <TableCell className="text-right">{movement.quantity}</TableCell>
                  <TableCell className="text-right">{movement.previousStock}</TableCell>
                  <TableCell className="text-right">{movement.resultingStock}</TableCell>
                  <TableCell>{movement.operator?.name ?? "-"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
