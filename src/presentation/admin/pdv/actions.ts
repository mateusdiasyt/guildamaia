"use server";

import { revalidatePath } from "next/cache";

import { requirePermission } from "@/application/auth/guards";
import { cancelSaleRecord, createSaleRecord } from "@/application/pdv/pdv-service";
import { PERMISSIONS } from "@/domain/auth/permissions";
import { initialActionState, toActionErrorMessage, type ActionState } from "@/presentation/admin/common/action-state";

export async function createSaleAction(
  prevState: ActionState = initialActionState,
  formData: FormData,
): Promise<ActionState> {
  void prevState;
  try {
    const session = await requirePermission(PERMISSIONS.PDV_MANAGE);
    await createSaleRecord(formData, session.user.id);
    revalidatePath("/admin/pdv");
    revalidatePath("/admin/stock");
    revalidatePath("/admin/products");
    revalidatePath("/admin/cash");
    revalidatePath("/admin");
    return { status: "success", message: "Venda registrada com sucesso." };
  } catch (error) {
    return { status: "error", message: toActionErrorMessage(error) };
  }
}

export async function cancelSaleAction(
  prevState: ActionState = initialActionState,
  formData: FormData,
): Promise<ActionState> {
  void prevState;
  try {
    const session = await requirePermission(PERMISSIONS.PDV_CANCEL);
    await cancelSaleRecord(formData, session.user.id);
    revalidatePath("/admin/pdv");
    revalidatePath("/admin/stock");
    revalidatePath("/admin/products");
    revalidatePath("/admin");
    return { status: "success", message: "Venda cancelada com sucesso." };
  } catch (error) {
    return { status: "error", message: toActionErrorMessage(error) };
  }
}
