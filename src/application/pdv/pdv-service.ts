import { PaymentMethod, SaleStatus } from "@prisma/client";

import { cancelSaleSchema, createSaleSchema, saleItemSchema, salePaymentSchema } from "@/domain/pdv/schemas";
import { emptyToUndefined } from "@/domain/shared/normalizers";
import { parseDecimalInput } from "@/lib/decimal";
import { createAuditLog } from "@/infrastructure/db/repositories/audit-log-repository";
import {
  cancelSaleAndRestock,
  createSaleWithStockAdjustment,
  listPdvOpenSessions,
  listPdvProductOptions,
  listRecentSales,
} from "@/infrastructure/db/repositories/sale-repository";

function createSaleNumber() {
  const now = new Date();
  const datePart = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(
    now.getDate(),
  ).padStart(2, "0")}`;
  const randomPart = Math.random().toString(36).slice(2, 7).toUpperCase();
  return `VEN-${datePart}-${randomPart}`;
}

function parseItems(formData: FormData) {
  const productIds = formData.getAll("itemProductId").map((value) => String(value));
  const quantities = formData.getAll("itemQuantity").map((value) => Number(value));

  const items = productIds
    .map((productId, index) => ({
      productId,
      quantity: quantities[index],
    }))
    .filter((item) => item.productId);

  if (items.length === 0) {
    throw new Error("Informe ao menos um item para registrar a venda.");
  }

  return items.map((item) => saleItemSchema.parse(item));
}

function parsePayments(formData: FormData) {
  const methods = formData.getAll("paymentMethod").map((value) => String(value));
  const amounts = formData.getAll("paymentAmount").map((value) => String(value));

  const payments = methods
    .map((method, index) => ({
      method,
      amount: amounts[index] ?? "0",
    }))
    .filter((payment) => payment.method && payment.amount);

  if (payments.length === 0) {
    throw new Error("Informe ao menos um pagamento para registrar a venda.");
  }

  return payments.map((payment) => {
    const parsed = salePaymentSchema.parse({
      method: payment.method as PaymentMethod,
      amount: payment.amount,
    });

    const decimalAmount = parseDecimalInput(parsed.amount);
    if (decimalAmount.lessThanOrEqualTo(0)) {
      throw new Error("Os valores de pagamento devem ser maiores que zero.");
    }

    return {
      method: parsed.method,
      amount: decimalAmount,
    };
  });
}

export async function getPdvData() {
  const [openSessions, products, sales] = await Promise.all([
    listPdvOpenSessions(),
    listPdvProductOptions(),
    listRecentSales(),
  ]);

  return { openSessions, products, sales };
}

export async function createSaleRecord(input: FormData, actorId: string) {
  const parsed = createSaleSchema.parse({
    cashSessionId: input.get("cashSessionId"),
    customerName: input.get("customerName"),
    discountAmount: input.get("discountAmount") ?? "0",
  });

  const items = parseItems(input);
  const payments = parsePayments(input);
  const discountAmount = parseDecimalInput(parsed.discountAmount || "0");

  if (discountAmount.lessThan(0)) {
    throw new Error("Desconto invalido.");
  }

  const sale = await createSaleWithStockAdjustment({
    saleNumber: createSaleNumber(),
    cashSessionId: parsed.cashSessionId,
    operatorId: actorId,
    customerName: emptyToUndefined(parsed.customerName),
    discountAmount,
    items,
    payments,
  });

  await createAuditLog({
    userId: actorId,
    action: "pdv.sale.create",
    entity: "Sale",
    entityId: sale.id,
    metadata: {
      saleNumber: sale.saleNumber,
      itemCount: sale.items.length,
      totalAmount: sale.totalAmount.toString(),
    },
  });
}

export async function cancelSaleRecord(input: FormData, actorId: string) {
  const parsed = cancelSaleSchema.parse({
    saleId: input.get("saleId"),
    cancelReason: input.get("cancelReason"),
  });

  const cancelled = await cancelSaleAndRestock({
    saleId: parsed.saleId,
    cancelReason: parsed.cancelReason.trim(),
    cancelledById: actorId,
  });

  if (cancelled.status !== SaleStatus.CANCELLED) {
    throw new Error("Nao foi possivel cancelar a venda.");
  }

  await createAuditLog({
    userId: actorId,
    action: "pdv.sale.cancel",
    entity: "Sale",
    entityId: cancelled.id,
    metadata: {
      saleNumber: cancelled.saleNumber,
      cancelReason: parsed.cancelReason,
    },
  });
}
