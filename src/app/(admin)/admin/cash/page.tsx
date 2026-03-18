import { CashSessionStatus, PaymentMethod } from "@prisma/client";

import { requirePermission } from "@/application/auth/guards";
import { getCashManagementData } from "@/application/cash/cash-service";
import { PageHeader } from "@/components/admin/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { hasPermission, PERMISSIONS } from "@/domain/auth/permissions";
import { formatCurrency } from "@/lib/format";
import { CashWithdrawalForm } from "@/presentation/admin/cash/cash-withdrawal-form";
import { CloseCashSessionForm } from "@/presentation/admin/cash/close-cash-session-form";
import { OpenCashSessionForm } from "@/presentation/admin/cash/open-cash-session-form";

const dateFormatter = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "short",
  timeStyle: "short",
});

export default async function CashPage() {
  const session = await requirePermission(PERMISSIONS.CASH_VIEW);
  const { registers, sessions, openSessions } = await getCashManagementData();
  const canManage = hasPermission(session.user.permissions, PERMISSIONS.CASH_MANAGE);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Modulo ERP"
        title="Caixa"
        description="Abertura, fechamento e sangria com rastreabilidade operacional."
      />

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
                <p className="text-sm text-zinc-600">Nenhuma sessao aberta para registrar sangria.</p>
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
                <p className="text-sm text-zinc-600">Nenhuma sessao aberta para fechar.</p>
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
                  <TableCell colSpan={9} className="text-center text-sm text-zinc-500">
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
                    <TableCell className="font-medium text-zinc-900">
                      {cashSession.cashRegister.name}
                      <p className="text-xs text-zinc-500">{cashSession.cashRegister.code}</p>
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
    </div>
  );
}
