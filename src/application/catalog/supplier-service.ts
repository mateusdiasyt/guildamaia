import { createSupplierSchema } from "@/domain/catalog/schemas";
import { emptyToUndefined } from "@/domain/shared/normalizers";
import { createAuditLog } from "@/infrastructure/db/repositories/audit-log-repository";
import {
  createSupplier,
  listSuppliers,
  updateSupplierStatus,
} from "@/infrastructure/db/repositories/supplier-repository";
import { RecordStatus } from "@prisma/client";
import { z } from "zod";

export async function getSuppliers(search?: string) {
  return listSuppliers(search);
}

export async function createSupplierRecord(input: FormData, actorId?: string) {
  const parsed = createSupplierSchema.parse({
    tradeName: input.get("tradeName"),
    legalName: input.get("legalName"),
    document: input.get("document"),
    email: input.get("email"),
    phone: input.get("phone"),
    status: input.get("status"),
  });

  const created = await createSupplier({
    tradeName: parsed.tradeName.trim(),
    legalName: emptyToUndefined(parsed.legalName),
    document: emptyToUndefined(parsed.document),
    email: emptyToUndefined(parsed.email)?.toLowerCase(),
    phone: emptyToUndefined(parsed.phone),
    status: parsed.status,
  });

  await createAuditLog({
    userId: actorId,
    action: "suppliers.create",
    entity: "Supplier",
    entityId: created.id,
    metadata: {
      tradeName: created.tradeName,
    },
  });
}

const updateSupplierStatusSchema = z.object({
  supplierId: z.string().min(1, "Fornecedor obrigatorio"),
  status: z.nativeEnum(RecordStatus),
});

export async function updateSupplierStatusRecord(input: FormData, actorId?: string) {
  const parsed = updateSupplierStatusSchema.parse({
    supplierId: input.get("supplierId"),
    status: input.get("status"),
  });

  const updated = await updateSupplierStatus(parsed);

  await createAuditLog({
    userId: actorId,
    action: "suppliers.status.update",
    entity: "Supplier",
    entityId: updated.id,
    metadata: { status: updated.status },
  });
}
