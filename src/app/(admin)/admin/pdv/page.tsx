import Link from "next/link";
import { SaleStatus } from "@prisma/client";

import { requirePermission } from "@/application/auth/guards";
import { getPdvData } from "@/application/pdv/pdv-service";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { hasPermission, PERMISSIONS } from "@/domain/auth/permissions";
import { formatCurrency } from "@/lib/format";
import { AddComandaItemForm } from "@/presentation/admin/pdv/add-comanda-item-form";
import { CancelSaleForm } from "@/presentation/admin/pdv/cancel-sale-form";
import { CloseComandaForm } from "@/presentation/admin/pdv/close-comanda-form";
import { CreateComandaForm } from "@/presentation/admin/pdv/create-comanda-form";
import { CreateSaleForm } from "@/presentation/admin/pdv/create-sale-form";
import { removeComandaItemAction } from "@/presentation/admin/pdv/actions";

const dateFormatter = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "short",
  timeStyle: "short",
});

export default async function PdvPage() {
  const session = await requirePermission(PERMISSIONS.PDV_VIEW);
  const { openSessions, products, sales, customers, openComandas } = await getPdvData();
  const canManage = hasPermission(session.user.permissions, PERMISSIONS.PDV_MANAGE);
  const canCancel = hasPermission(session.user.permissions, PERMISSIONS.PDV_CANCEL);

  return (
    <div className="space-y-6">
      {canManage ? (
        <Card>
          <CardHeader className="border-b border-border/70 pb-4">
            <CardTitle>Nova comanda</CardTitle>
            <CardDescription>
              Abra comandas numeradas de 0 a 200 e vincule um cliente cadastrado ou atendimento avulso.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <CreateComandaForm
              customers={customers.map((customer) => ({
                id: customer.id,
                fullName: customer.fullName,
                documentType: customer.documentType,
                documentNumber: customer.documentNumber,
              }))}
            />
            {customers.length === 0 ? (
              <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
                <p className="text-sm text-amber-800">
                  Nenhum cliente cadastrado. Para comanda nominal, cadastre clientes na aba correspondente.
                </p>
                <Link
                  href="/admin/customers"
                  className="mt-2 inline-flex h-9 items-center justify-center rounded-xl bg-primary px-3 text-sm font-medium text-primary-foreground shadow-lg shadow-primary/25"
                >
                  Ir para clientes
                </Link>
              </div>
            ) : null}
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader className="border-b border-border/70 pb-4">
          <CardTitle>Comandas abertas</CardTitle>
          <CardDescription>{openComandas.length} comanda(s) ativa(s).</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {openComandas.length === 0 ? (
            <p className="rounded-xl border border-dashed border-border/80 bg-muted/35 px-3 py-4 text-sm text-muted-foreground">
              Nenhuma comanda aberta no momento.
            </p>
          ) : (
            openComandas.map((comanda) => (
              <div key={comanda.id} className="rounded-2xl border border-border/75 bg-card/85 p-4">
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2 border-b border-border/70 pb-3">
                  <div>
                    <p className="text-base font-semibold text-foreground">Comanda #{comanda.number}</p>
                    <p className="text-sm text-muted-foreground">
                      {comanda.isWalkIn
                        ? "Comanda avulsa"
                        : comanda.customer?.fullName ?? comanda.customerNameSnapshot ?? "Cliente nao informado"}
                    </p>
                  </div>
                  <Badge className="bg-primary/15 text-primary hover:bg-primary/15">
                    Subtotal {formatCurrency(Number(comanda.subtotalAmount))}
                  </Badge>
                </div>

                <div className="space-y-3">
                  {comanda.items.length === 0 ? (
                    <p className="rounded-xl border border-dashed border-border px-3 py-4 text-sm text-muted-foreground">
                      Nenhum item adicionado nesta comanda.
                    </p>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Produto</TableHead>
                          <TableHead>SKU</TableHead>
                          <TableHead className="text-right">Qtd</TableHead>
                          <TableHead className="text-right">Total</TableHead>
                          <TableHead className="text-right">Acoes</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {comanda.items.map((item) => (
                          <TableRow key={item.id}>
                            <TableCell>{item.product.name}</TableCell>
                            <TableCell>{item.product.sku}</TableCell>
                            <TableCell className="text-right">{item.quantity}</TableCell>
                            <TableCell className="text-right">{formatCurrency(Number(item.lineTotal))}</TableCell>
                            <TableCell className="text-right">
                              {canManage ? (
                                <form action={removeComandaItemAction}>
                                  <input type="hidden" name="comandaId" value={comanda.id} />
                                  <input type="hidden" name="productId" value={item.productId} />
                                  <Button type="submit" variant="outline" size="sm">
                                    Remover
                                  </Button>
                                </form>
                              ) : (
                                <span className="text-xs text-zinc-500">-</span>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}

                  {canManage ? (
                    <div className="rounded-xl border border-border/75 bg-background/60 p-3">
                      <p className="mb-3 text-sm font-semibold text-foreground">Adicionar produto</p>
                      <AddComandaItemForm
                        comandaId={comanda.id}
                        products={products.map((product) => ({
                          id: product.id,
                          name: product.name,
                          sku: product.sku,
                        }))}
                      />
                    </div>
                  ) : null}

                  {canManage ? (
                    openSessions.length === 0 ? (
                      <p className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700">
                        Abra uma sessao de caixa para fechar a comanda.
                      </p>
                    ) : (
                      <div className="rounded-xl border border-border/75 bg-background/60 p-3">
                        <p className="mb-3 text-sm font-semibold text-foreground">Fechamento da comanda</p>
                        <CloseComandaForm
                          comandaId={comanda.id}
                          openSessions={openSessions.map((openSession) => ({
                            id: openSession.id,
                            cashRegister: {
                              name: openSession.cashRegister.name,
                              code: openSession.cashRegister.code,
                            },
                          }))}
                        />
                      </div>
                    )
                  ) : null}
                </div>
              </div>
            ))
          )}
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
            ) : products.length === 0 ? (
              <p className="rounded-xl border border-border/80 bg-muted/35 px-3 py-2 text-sm text-muted-foreground">
                Cadastre produtos ativos antes de registrar vendas.
              </p>
            ) : (
              <CreateSaleForm
                openSessions={openSessions.map((openSession) => ({
                  id: openSession.id,
                  cashRegister: {
                    name: openSession.cashRegister.name,
                    code: openSession.cashRegister.code,
                  },
                }))}
                products={products.map((product) => ({
                  id: product.id,
                  name: product.name,
                  sku: product.sku,
                  salePrice: product.salePrice.toString(),
                  currentStock: product.currentStock,
                  category: {
                    id: product.category.id,
                    name: product.category.name,
                    slug: product.category.slug,
                  },
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
