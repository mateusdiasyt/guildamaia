import { RecordStatus } from "@prisma/client";
import { z } from "zod";

import { createAuditLog } from "@/infrastructure/db/repositories/audit-log-repository";
import {
  createCustomer,
  listCustomers,
  updateCustomer,
  updateCustomerStatus,
} from "@/infrastructure/db/repositories/customer-repository";
import { createCustomerSchema, sanitizeDocumentNumber, updateCustomerSchema } from "@/domain/customers/schemas";
import { emptyToUndefined } from "@/domain/shared/normalizers";

export async function getCustomers(search?: string) {
  return listCustomers(search);
}

export async function createCustomerRecord(input: FormData, actorId?: string) {
  const parsed = createCustomerSchema.parse({
    fullName: input.get("fullName"),
    birthDate: input.get("birthDate"),
    documentType: input.get("documentType"),
    documentNumber: input.get("documentNumber"),
    phone: input.get("phone"),
    email: input.get("email"),
    status: input.get("status"),
  });

  const created = await createCustomer({
    fullName: parsed.fullName.trim(),
    birthDate: new Date(`${parsed.birthDate}T00:00:00.000Z`),
    documentType: parsed.documentType,
    documentNumber: sanitizeDocumentNumber(parsed.documentNumber),
    phone: emptyToUndefined(parsed.phone),
    email: emptyToUndefined(parsed.email)?.toLowerCase(),
    status: parsed.status,
  });

  await createAuditLog({
    userId: actorId,
    action: "customers.create",
    entity: "Customer",
    entityId: created.id,
    metadata: {
      fullName: created.fullName,
      birthDate: created.birthDate,
      documentType: created.documentType,
      documentNumber: created.documentNumber,
    },
  });
}

const updateCustomerStatusSchema = z.object({
  customerId: z.string().min(1, "Cliente obrigatorio"),
  status: z.nativeEnum(RecordStatus),
});

export async function updateCustomerStatusRecord(input: FormData, actorId?: string) {
  const parsed = updateCustomerStatusSchema.parse({
    customerId: input.get("customerId"),
    status: input.get("status"),
  });

  const updated = await updateCustomerStatus(parsed);

  await createAuditLog({
    userId: actorId,
    action: "customers.status.update",
    entity: "Customer",
    entityId: updated.id,
    metadata: {
      status: updated.status,
    },
  });
}

export async function updateCustomerRecord(input: FormData, actorId?: string) {
  const parsed = updateCustomerSchema.parse({
    customerId: input.get("customerId"),
    fullName: input.get("fullName"),
    birthDate: input.get("birthDate"),
    documentType: input.get("documentType"),
    documentNumber: input.get("documentNumber"),
    phone: input.get("phone"),
    email: input.get("email"),
    status: input.get("status"),
  });

  const updated = await updateCustomer({
    customerId: parsed.customerId,
    fullName: parsed.fullName.trim(),
    birthDate: new Date(`${parsed.birthDate}T00:00:00.000Z`),
    documentType: parsed.documentType,
    documentNumber: sanitizeDocumentNumber(parsed.documentNumber),
    phone: emptyToUndefined(parsed.phone),
    email: emptyToUndefined(parsed.email)?.toLowerCase(),
    status: parsed.status,
  });

  await createAuditLog({
    userId: actorId,
    action: "customers.update",
    entity: "Customer",
    entityId: updated.id,
    metadata: {
      fullName: updated.fullName,
      birthDate: updated.birthDate,
      documentType: updated.documentType,
      documentNumber: updated.documentNumber,
      status: updated.status,
    },
  });
}
