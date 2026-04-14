import Link from "next/link";

import { CashSessionStatus, PaymentMethod } from "@prisma/client";
import { Search } from "lucide-react";

import { requirePermission } from "@/application/auth/guards";
import { getCashAuditLogs, getCashManagementData } from "@/application/cash/cash-service";
import { PageHeader } from "@/components/admin/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { hasPermission, PERMISSIONS } from "@/domain/auth/permissions";
import { formatCurrency } from "@/lib/format";
import { CashWithdrawalForm } from "@/presentation/admin/cash/cash-withdrawal-form";
import { CloseCashSessionForm } from "@/presentation/admin/cash/close-cash-session-form";
import { OpenCashSessionForm } from "@/presentation/admin/cash/open-cash-session-form";

const dateFormatter = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "short",
  timeStyle: "short",
});

type CashPageProps = {
  searchParams: Promise<{
    tab?: string;
    q?: string;
  }>;
};

function formatLogAction(action: string) {
  return action
    .split(".")
    .map((part) => part[0]?.toUpperCase() + part.slice(1))
    .join(" / ");
}

function formatMetadataValue(value: unknown) {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  if (typeof value === "boolean") {
    return value ? "sim" : "nao";
  }

  return String(value);
}

function summarizeMetadata(metadata: unknown) {
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) {
    return "Sem detalhes adicionais.";
  }

  const entries = Object.entries(metadata as Record<string, unknown>)
    .map(([key, value]) => {
      const formattedValue = formatMetadataValue(value);
      if (!formattedValue) {
        return null;
      }

      return `${key}: ${formattedValue}`;
    })
    .filter(Boolean)
    .slice(0, 4);

  return entries.length > 0 ? entries.join(" • ") : "Sem detalhes adicionais.";
}

export default async function CashPage({ searchParams }: CashPageProps) {
  const session = await requirePermission(PERMISSIONS.CASH_VIEW);
  const { tab, q } = await searchParams;
  const selectedTab = tab === "logs" ? "logs" : "operations";
  const search = q?.trim() || undefined;
  const [{ registers, sessions, openSessions }, logs] = await Promise.all([
    getCashManagementData(),
    getCashAuditLogs(search),
  ]);
  const canManage = hasPermission(session.user.permissions, PERMISSIONS.CASH_MANAGE);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Modulo ERP"
        title="Caixa"
        description="Abertura, fechamento, sangria e rastreabilidade completa das operacoes de caixa e PDV."
      />

      <Tabs defaultValue={selectedTab} className="gap-4">
        <TabsList variant="line" className="border-b border-border/70 p-0">
          <TabsTrigger value="operations">Operacoes</TabsTrigger>
          <TabsTrigger value="logs">Logs do caixa</TabsTrigger>
        </TabsList>

        <TabsContent value="operations" className="space-y-6">
          {canManage ? (
            <section className="grid gap-4 xl:grid-cols-3">
              <Card>
                <CardHeader>
                  <CardTitle>Abrir caixa</CardTitle>
                  <CardDescription>Inicie uma nova sessao para um caixa sem operacao aberta.</CardDescription>
                </CardHeader>
                <CardContent>
                  <OpenCashSessionForm
                    registers={registers.map((register) => ({
                      id: register.id,
                      name: register.name,
                      code: register.code,
                    }))}
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Registrar sangria</CardTitle>
                  <CardDescription>Retire valor em dinheiro de uma sessao de caixa aberta.</CardDescription>
                </CardHeader>
                <CardContent>
                  {openSessions.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Nenhuma sessao aberta para registrar sangria.</p>
                  ) : (
                    <CashWithdrawalForm
                      openSessions={openSessions.map((openSession) => ({
                        id: openSession.id,
                        cashRegister: {
                          name: openSession.cashRegister.name,
                          code: openSession.cashRegister.code,
                        },
                      }))}
                    />
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Fechar caixa</CardTitle>
                  <CardDescription>Encerramento com valor contado e diferenca do esperado.</CardDescription>
                </CardHeader>
                <CardContent>
                  {openSessions.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Nenhuma sessao aberta para fechar.</p>
                  ) : (
                    <CloseCashSessionForm
                      openSessions={openSessions.map((openSession) => ({
                        id: openSession.id,
                        cashRegister: {
                          name: openSession.cashRegister.name,
                          code: openSession.cashRegister.code,
                        },
                        operator: {
                          name: openSession.operator.name,
                        },
                      }))}
                    />
                  )}
                </CardContent>
              </Card>
            </section>
          ) : null}

          <Card>
            <CardHeader>
              <CardTitle>Historico de sessoes</CardTitle>
              <CardDescription>{sessions.length} sessao(oes) encontrada(s).</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Caixa</TableHead>
                    <TableHead>Operador</TableHead>
                    <TableHead>Abertura</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Abertura (R$)</TableHead>
                    <TableHead className="text-right">Dinheiro vendas (R$)</TableHead>
                    <TableHead className="text-right">Sangrias (R$)</TableHead>
                    <TableHead className="text-right">Esperado (R$)</TableHead>
                    <TableHead className="text-right">Fechado (R$)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sessions.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center text-sm text-muted-foreground">
                        Nenhuma sessao de caixa encontrada.
                      </TableCell>
                    </TableRow>
                  ) : null}
                  {sessions.map((cashSession) => {
                    const cashSales = cashSession.sales.reduce((acc, sale) => {
                      const cashPayments = sale.payments
                        .filter((payment) => payment.method === PaymentMethod.CASH)
                        .reduce((sum, payment) => sum + Number(payment.amount), 0);
                      return acc + cashPayments;
                    }, 0);
                    const withdrawals = cashSession.movements.reduce(
                      (acc, movement) => acc + Number(movement.amount),
                      0,
                    );

                    return (
                      <TableRow key={cashSession.id}>
                        <TableCell className="font-medium text-foreground">
                          {cashSession.cashRegister.name}
                          <p className="text-xs text-muted-foreground">{cashSession.cashRegister.code}</p>
                        </TableCell>
                        <TableCell>{cashSession.operator.name}</TableCell>
                        <TableCell>{dateFormatter.format(cashSession.openedAt)}</TableCell>
                        <TableCell>
                          <Badge
                            className={
                              cashSession.status === CashSessionStatus.OPEN
                                ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-100"
                                : "bg-zinc-100 text-zinc-600 hover:bg-zinc-100"
                            }
                          >
                            {cashSession.status === CashSessionStatus.OPEN ? "Aberto" : "Fechado"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">{formatCurrency(Number(cashSession.openingAmount))}</TableCell>
                        <TableCell className="text-right">{formatCurrency(cashSales)}</TableCell>
                        <TableCell className="text-right">{formatCurrency(withdrawals)}</TableCell>
                        <TableCell className="text-right">
                          {cashSession.expectedAmount ? formatCurrency(Number(cashSession.expectedAmount)) : "-"}
                        </TableCell>
                        <TableCell className="text-right">
                          {cashSession.closingAmount ? formatCurrency(Number(cashSession.closingAmount)) : "-"}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="logs">
          <Card>
            <CardHeader className="border-b border-border/70 pb-4">
              <CardTitle>Logs operacionais</CardTitle>
              <CardDescription>
                Rastreia movimentacoes do caixa e do PDV, incluindo comanda criada, editada, cancelada e finalizada.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 pt-4">
              <form method="GET" className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_auto_auto]">
                <input type="hidden" name="tab" value="logs" />
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    name="q"
                    defaultValue={search ?? ""}
                    placeholder="Buscar por acao, comanda, venda, operador ou metadados"
                    className="pl-9"
                  />
                </div>
                <Button type="submit" variant="secondary">
                  Pesquisar
                </Button>
                <Link
                  href="/admin/cash?tab=logs"
                  className="inline-flex h-9 items-center justify-center rounded-xl border border-border/80 bg-background/85 px-3 text-sm font-medium text-foreground shadow-sm transition-colors hover:border-border hover:bg-muted/70"
                >
                  Limpar
                </Link>
              </form>

              <div className="rounded-2xl border border-border/75 bg-background/30">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data</TableHead>
                      <TableHead>Acao</TableHead>
                      <TableHead>Usuario</TableHead>
                      <TableHead>Alvo</TableHead>
                      <TableHead>Detalhes</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {logs.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center text-sm text-muted-foreground">
                          Nenhum log encontrado com o filtro atual.
                        </TableCell>
                      </TableRow>
                    ) : null}
                    {logs.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell className="whitespace-nowrap">{dateFormatter.format(log.createdAt)}</TableCell>
                        <TableCell>
                          <Badge
                            className={
                              log.action.startsWith("cash.")
                                ? "bg-sky-100 text-sky-700 hover:bg-sky-100"
                                : "bg-amber-100 text-amber-700 hover:bg-amber-100"
                            }
                          >
                            {formatLogAction(log.action)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm text-foreground">{log.user?.name ?? "Sistema"}</div>
                          {log.user?.email ? <p className="text-xs text-muted-foreground">{log.user.email}</p> : null}
                        </TableCell>
                        <TableCell>
                          <div className="text-sm text-foreground">{log.entity}</div>
                          {log.entityId ? <p className="text-xs text-muted-foreground">{log.entityId}</p> : null}
                        </TableCell>
                        <TableCell className="max-w-[420px] text-sm text-muted-foreground">
                          {summarizeMetadata(log.metadata)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
