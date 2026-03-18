import Link from "next/link";
import { SaleStatus } from "@prisma/client";

import { requirePermission } from "@/application/auth/guards";
import { getPdvData } from "@/application/pdv/pdv-service";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { hasPermission, PERMISSIONS } from "@/domain/auth/permissions";
import { formatCurrency } from "@/lib/format";
import { CancelSaleForm } from "@/presentation/admin/pdv/cancel-sale-form";
import { CreateComandaDialog } from "@/presentation/admin/pdv/create-comanda-dialog";
import { OpenComandasBoard } from "@/presentation/admin/pdv/open-comandas-board";
import { CreateSaleForm } from "@/presentation/admin/pdv/create-sale-form";

const dateFormatter = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "short",
  timeStyle: "short",
});

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

export default async function PdvPage() {
  const session = await requirePermission(PERMISSIONS.PDV_VIEW);
  const { openSessions, products, sales, customers, openComandas } = await getPdvData();
  const canManage = hasPermission(session.user.permissions, PERMISSIONS.PDV_MANAGE);
  const canCancel = hasPermission(session.user.permissions, PERMISSIONS.PDV_CANCEL);

  const customerOptions = customers.map((customer) => ({
    id: customer.id,
    fullName: customer.fullName,
    documentType: customer.documentType,
    documentNumber: customer.documentNumber,
  }));

  const openSessionOptions = openSessions.map((openSession) => ({
    id: openSession.id,
    cashRegister: {
      name: openSession.cashRegister.name,
      code: openSession.cashRegister.code,
    },
  }));

  const productOptions = products.map((product) => ({
    id: product.id,
    name: product.name,
    sku: product.sku,
  }));

  const openComandasView = openComandas.map((comanda) => ({
    id: comanda.id,
    number: comanda.number,
    isWalkIn: comanda.isWalkIn,
    customerName: comanda.customer?.fullName ?? comanda.customerNameSnapshot ?? "Cliente nao informado",
    subtotalAmount: Number(comanda.subtotalAmount),
    itemCount: comanda.items.length,
    openedAt: comanda.openedAt.toISOString(),
    items: comanda.items.map((item) => ({
      id: item.id,
      productId: item.productId,
      quantity: item.quantity,
      lineTotal: Number(item.lineTotal),
      product: {
        name: item.product.name,
        sku: item.product.sku,
      },
    })),
  }));

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="space-y-3 border-b border-border/70 pb-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <CardTitle>Comandas abertas</CardTitle>
              <CardDescription>{openComandasView.length} comanda(s) ativa(s).</CardDescription>
            </div>
            {canManage ? <CreateComandaDialog customers={customerOptions} /> : null}
          </div>
        </CardHeader>
        <CardContent>
          <OpenComandasBoard
            openComandas={openComandasView}
            products={productOptions}
            openSessions={openSessionOptions}
            canManage={canManage}
          />
        </CardContent>
      </Card>

      {canManage ? (
        <Card>
          <CardHeader className="border-b border-border/70 pb-4">
            <CardTitle>Nova venda</CardTitle>
            <CardDescription>
              Fluxo de balcao com adicao de itens, ajuste de quantidade e validacao de pagamentos em tempo real.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {openSessions.length === 0 ? (
              <div className="space-y-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
                <p className="text-sm text-amber-800">
                  Nenhum caixa aberto. Abra uma sessao para habilitar o registro de vendas no PDV.
                </p>
                <Link
                  href="/admin/cash"
                  className="inline-flex h-9 items-center justify-center rounded-xl bg-primary px-3 text-sm font-medium text-primary-foreground shadow-lg shadow-primary/25"
                >
                  Abrir caixa agora
                </Link>
              </div>
            ) : openComandasView.length === 0 ? (
              <p className="rounded-xl border border-border/80 bg-muted/35 px-3 py-2 text-sm text-muted-foreground">
                Abra e monte ao menos uma comanda antes de registrar a venda.
              </p>
            ) : (
              <CreateSaleForm
                openSessions={openSessionOptions}
                openComandas={openComandasView.map((comanda) => ({
                  id: comanda.id,
                  number: comanda.number,
                  customerName: comanda.customerName,
                  subtotalAmount: comanda.subtotalAmount,
                  itemCount: comanda.itemCount,
                }))}
              />
            )}
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader className="border-b border-border/70 pb-4">
          <CardTitle>Vendas recentes</CardTitle>
          <CardDescription>{sales.length} venda(s) encontrada(s).</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Venda</TableHead>
                <TableHead>Data</TableHead>
                <TableHead>Caixa</TableHead>
                <TableHead>Operador</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Itens</TableHead>
                <TableHead className="text-right">Total (R$)</TableHead>
                <TableHead>Acoes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sales.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-sm text-zinc-500">
                    Nenhuma venda registrada.
                  </TableCell>
                </TableRow>
              ) : null}
              {sales.map((sale) => (
                <TableRow key={sale.id}>
                  <TableCell className="font-medium text-zinc-900">
                    {sale.saleNumber}
                    {sale.customerName ? <p className="text-xs text-zinc-500">{sale.customerName}</p> : null}
                  </TableCell>
                  <TableCell>{dateFormatter.format(sale.createdAt)}</TableCell>
                  <TableCell>{sale.cashSession.cashRegister.name}</TableCell>
                  <TableCell>{sale.operator.name}</TableCell>
                  <TableCell>
                    <Badge
                      className={
                        sale.status === SaleStatus.COMPLETED
                          ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-100"
                          : "bg-rose-100 text-rose-700 hover:bg-rose-100"
                      }
                    >
                      {sale.status === SaleStatus.COMPLETED ? "Concluida" : "Cancelada"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">{sale.items.length}</TableCell>
                  <TableCell className="text-right">{formatCurrency(Number(sale.totalAmount))}</TableCell>
                  <TableCell>
                    {canCancel && sale.status === SaleStatus.COMPLETED ? (
                      <CancelSaleForm saleId={sale.id} />
                    ) : (
                      <span className="text-xs text-zinc-500">-</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
