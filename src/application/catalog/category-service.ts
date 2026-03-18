import { createCategorySchema } from "@/domain/catalog/schemas";
import { emptyToUndefined } from "@/domain/shared/normalizers";
import { createAuditLog } from "@/infrastructure/db/repositories/audit-log-repository";
import {
  createCategory,
  listCategories,
  updateCategoryStatus,
} from "@/infrastructure/db/repositories/category-repository";
import { RecordStatus } from "@prisma/client";
import { z } from "zod";

export async function getCategories(search?: string) {
  return listCategories(search);
}

export async function createCategoryRecord(input: FormData, actorId?: string) {
  const parsed = createCategorySchema.parse({
    name: input.get("name"),
    slug: input.get("slug"),
    description: input.get("description"),
    status: input.get("status"),
  });

  const created = await createCategory({
    name: parsed.name.trim(),
    slug: parsed.slug.trim(),
    description: emptyToUndefined(parsed.description),
    status: parsed.status,
  });

  await createAuditLog({
    userId: actorId,
    action: "categories.create",
    entity: "ProductCategory",
    entityId: created.id,
    metadata: {
      name: created.name,
      slug: created.slug,
    },
  });
}

const updateCategoryStatusSchema = z.object({
  categoryId: z.string().min(1, "Categoria obrigatoria"),
  status: z.nativeEnum(RecordStatus),
});

export async function updateCategoryStatusRecord(input: FormData, actorId?: string) {
  const parsed = updateCategoryStatusSchema.parse({
    categoryId: input.get("categoryId"),
    status: input.get("status"),
  });

  const updated = await updateCategoryStatus(parsed);

  await createAuditLog({
    userId: actorId,
    action: "categories.status.update",
    entity: "ProductCategory",
    entityId: updated.id,
    metadata: { status: updated.status },
  });
}
