import { Prisma } from "@prisma/client";

import { createStockMovementSchema } from "@/domain/stock/schemas";
import { createAuditLog } from "@/infrastructure/db/repositories/audit-log-repository";
import { listProductOptions } from "@/infrastructure/db/repositories/product-repository";
import {
  listStockMovements,
  registerStockMovement,
} from "@/infrastructure/db/repositories/stock-repository";

export async function getStockMovements() {
  return listStockMovements();
}

export async function getStockFormOptions() {
  return listProductOptions();
}

export async function registerStockMovementRecord(input: FormData, actorId?: string) {
  const parsed = createStockMovementSchema.parse({
    productId: input.get("productId"),
    type: input.get("type"),
    quantity: input.get("quantity"),
    unitCost: input.get("unitCost"),
    note: input.get("note"),
  });

  const movement = await registerStockMovement({
    productId: parsed.productId,
    type: parsed.type,
    quantity: parsed.quantity,
    unitCost: parsed.unitCost ? new Prisma.Decimal(parsed.unitCost) : undefined,
    note: parsed.note || undefined,
    operatorId: actorId,
  });

  await createAuditLog({
    userId: actorId,
    action: "stock.movement.create",
    entity: "StockMovement",
    entityId: movement.id,
    metadata: {
      productId: movement.productId,
      type: movement.type,
      quantity: movement.quantity,
      resultingStock: movement.resultingStock,
    },
  });
}
