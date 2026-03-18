"use server";

import { revalidatePath } from "next/cache";

import { requirePermission } from "@/application/auth/guards";
import { createProductRecord, updateProductStatusRecord } from "@/application/catalog/product-service";
import { PERMISSIONS } from "@/domain/auth/permissions";
import { initialActionState, toActionErrorMessage, type ActionState } from "@/presentation/admin/common/action-state";

export async function createProductAction(
  prevState: ActionState = initialActionState,
  formData: FormData,
): Promise<ActionState> {
  void prevState;
  try {
    const session = await requirePermission(PERMISSIONS.PRODUCTS_MANAGE);
    await createProductRecord(formData, session.user.id);
    revalidatePath("/admin/products");
    return { status: "success", message: "Produto criado com sucesso." };
  } catch (error) {
    return { status: "error", message: toActionErrorMessage(error) };
  }
}

export async function toggleProductStatusAction(formData: FormData) {
  const session = await requirePermission(PERMISSIONS.PRODUCTS_MANAGE);
  await updateProductStatusRecord(formData, session.user.id);
  revalidatePath("/admin/products");
}
