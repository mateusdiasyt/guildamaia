import { CashMovementType, PaymentMethod, Prisma } from "@prisma/client";

import {
  closeCashSessionSchema,
  openCashSessionSchema,
  registerCashWithdrawalSchema,
} from "@/domain/cash/schemas";
import { emptyToUndefined } from "@/domain/shared/normalizers";
import { parseDecimalInput } from "@/lib/decimal";
import { createAuditLog } from "@/infrastructure/db/repositories/audit-log-repository";
import {
  closeCashSession,
  getCashSessionForClosing,
  listCashRegisters,
  listCashSessions,
  listOpenCashSessions,
  openCashSession,
  registerCashWithdrawal,
} from "@/infrastructure/db/repositories/cash-repository";
import { listCashAuditLogs as listCashAuditLogsRepository } from "@/infrastructure/db/repositories/audit-log-repository";

export async function getCashManagementData() {
  const [registers, sessions, openSessions] = await Promise.all([
    listCashRegisters(),
    listCashSessions(),
    listOpenCashSessions(),
  ]);

  return { registers, sessions, openSessions };
}

export async function getCashAuditLogs(search?: string) {
  const logs = await listCashAuditLogsRepository();
  const normalizedSearch = search?.trim().toLowerCase();

  if (!normalizedSearch) {
    return logs;
  }

  return logs.filter((log) => {
    const metadataText = log.metadata ? JSON.stringify(log.metadata).toLowerCase() : "";
    return [
      log.action,
      log.entity,
      log.entityId ?? "",
      log.user?.name ?? "",
      log.user?.email ?? "",
      metadataText,
    ]
      .join(" ")
      .toLowerCase()
      .includes(normalizedSearch);
  });
}

export async function openCashSessionRecord(input: FormData, actorId: string) {
  const parsed = openCashSessionSchema.parse({
    cashRegisterId: input.get("cashRegisterId"),
    openingAmount: input.get("openingAmount"),
    note: input.get("note"),
  });

  const openingAmount = parseDecimalInput(parsed.openingAmount);
  if (openingAmount.lessThan(0)) {
    throw new Error("Valor de abertura nao pode ser negativo.");
  }

  const created = await openCashSession({
    cashRegisterId: parsed.cashRegisterId,
    operatorId: actorId,
    openingAmount,
    note: emptyToUndefined(parsed.note),
  });

  await createAuditLog({
    userId: actorId,
    action: "cash.session.open",
    entity: "CashSession",
    entityId: created.id,
    metadata: {
      cashRegisterId: created.cashRegisterId,
      openingAmount: openingAmount.toString(),
    },
  });
}

export async function registerCashWithdrawalRecord(input: FormData, actorId: string) {
  const parsed = registerCashWithdrawalSchema.parse({
    cashSessionId: input.get("cashSessionId"),
    amount: input.get("amount"),
    reason: input.get("reason"),
  });

  const amount = parseDecimalInput(parsed.amount);
  if (amount.lessThanOrEqualTo(0)) {
    throw new Error("Valor de sangria deve ser maior que zero.");
  }

  const movement = await registerCashWithdrawal({
    cashSessionId: parsed.cashSessionId,
    operatorId: actorId,
    amount,
    reason: parsed.reason.trim(),
  });

  await createAuditLog({
    userId: actorId,
    action: "cash.withdrawal.create",
    entity: "CashMovement",
    entityId: movement.id,
    metadata: {
      cashSessionId: parsed.cashSessionId,
      type: CashMovementType.WITHDRAWAL,
      amount: amount.toString(),
    },
  });
}

export async function closeCashSessionRecord(input: FormData, actorId: string) {
  const parsed = closeCashSessionSchema.parse({
    cashSessionId: input.get("cashSessionId"),
    closingAmount: input.get("closingAmount"),
    note: input.get("note"),
  });

  const closingAmount = parseDecimalInput(parsed.closingAmount);
  if (closingAmount.lessThan(0)) {
    throw new Error("Valor de fechamento nao pode ser negativo.");
  }

  const session = await getCashSessionForClosing(parsed.cashSessionId);
  if (!session) {
    throw new Error("Sessao de caixa nao encontrada.");
  }

  if (session.status !== "OPEN") {
    throw new Error("A sessao selecionada ja esta fechada.");
  }

  const cashSalesTotal = session.sales.reduce((acc, sale) => {
    const cashPayments = sale.payments
      .filter((payment) => payment.method === PaymentMethod.CASH)
      .reduce((sum, payment) => sum.plus(payment.amount), new Prisma.Decimal(0));
    return acc.plus(cashPayments);
  }, new Prisma.Decimal(0));

  const withdrawalsTotal = session.movements
    .filter((movement) => movement.type === CashMovementType.WITHDRAWAL)
    .reduce((acc, movement) => acc.plus(movement.amount), new Prisma.Decimal(0));

  const expectedAmount = session.openingAmount.plus(cashSalesTotal).minus(withdrawalsTotal);
  const differenceAmount = closingAmount.minus(expectedAmount);

  const closed = await closeCashSession({
    cashSessionId: parsed.cashSessionId,
    expectedAmount,
    closingAmount,
    differenceAmount,
    note: emptyToUndefined(parsed.note),
  });

  await createAuditLog({
    userId: actorId,
    action: "cash.session.close",
    entity: "CashSession",
    entityId: closed.id,
    metadata: {
      expectedAmount: expectedAmount.toString(),
      closingAmount: closingAmount.toString(),
      differenceAmount: differenceAmount.toString(),
    },
  });
}
