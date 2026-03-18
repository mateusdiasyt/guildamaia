import { Prisma, RecordStatus } from "@prisma/client";
import { z } from "zod";

import { createProductSchema } from "@/domain/catalog/schemas";
import { emptyToUndefined } from "@/domain/shared/normalizers";
import { createAuditLog } from "@/infrastructure/db/repositories/audit-log-repository";
import { listCategoryOptions } from "@/infrastructure/db/repositories/category-repository";
import {
  createProduct,
  listProductOptions,
  listProducts,
  updateProductStatus,
} from "@/infrastructure/db/repositories/product-repository";
import { listSupplierOptions } from "@/infrastructure/db/repositories/supplier-repository";

function calculateMargin(costPrice: Prisma.Decimal, salePrice: Prisma.Decimal) {
  if (salePrice.equals(0)) {
    return new Prisma.Decimal(0);
  }

  return salePrice.minus(costPrice).dividedBy(salePrice).times(100).toDecimalPlaces(2);
}

export async function getProducts(search?: string) {
  return listProducts(search);
}

export async function getProductOptions() {
  return listProductOptions();
}

export async function getProductFormOptions() {
  const [categories, suppliers] = await Promise.all([listCategoryOptions(), listSupplierOptions()]);
  return { categories, suppliers };
}

export async function createProductRecord(input: FormData, actorId?: string) {
  const parsed = createProductSchema.parse({
    name: input.get("name"),
    sku: input.get("sku"),
    description: input.get("description"),
    categoryId: input.get("categoryId"),
    supplierId: input.get("supplierId"),
    costPrice: input.get("costPrice"),
    salePrice: input.get("salePrice"),
    minStock: input.get("minStock"),
    currentStock: input.get("currentStock"),
    status: input.get("status"),
  });

  const costPrice = new Prisma.Decimal(parsed.costPrice);
  const salePrice = new Prisma.Decimal(parsed.salePrice);
  const marginPercent = calculateMargin(costPrice, salePrice);

  const created = await createProduct({
    name: parsed.name.trim(),
    sku: parsed.sku.trim(),
    description: emptyToUndefined(parsed.description),
    categoryId: parsed.categoryId,
    supplierId: emptyToUndefined(parsed.supplierId),
    costPrice,
    salePrice,
    marginPercent,
    minStock: parsed.minStock,
    currentStock: parsed.currentStock,
    status: parsed.status,
  });

  await createAuditLog({
    userId: actorId,
    action: "products.create",
    entity: "Product",
    entityId: created.id,
    metadata: {
      sku: created.sku,
      categoryId: created.categoryId,
      supplierId: created.supplierId,
    },
  });
}

const updateProductStatusSchema = z.object({
  productId: z.string().min(1, "Produto obrigatorio"),
  status: z.nativeEnum(RecordStatus),
});

export async function updateProductStatusRecord(input: FormData, actorId?: string) {
  const parsed = updateProductStatusSchema.parse({
    productId: input.get("productId"),
    status: input.get("status"),
  });

  const updated = await updateProductStatus(parsed);

  await createAuditLog({
    userId: actorId,
    action: "products.status.update",
    entity: "Product",
    entityId: updated.id,
    metadata: { status: updated.status },
  });
}
