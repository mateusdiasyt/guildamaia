"use server";

import { revalidatePath } from "next/cache";

import { requirePermission } from "@/application/auth/guards";
import { registerStockMovementRecord, storeStockInvoiceXmlRecord } from "@/application/stock/stock-service";
import { PERMISSIONS } from "@/domain/auth/permissions";
import { initialActionState, toActionErrorMessage, type ActionState } from "@/presentation/admin/common/action-state";

export async function createStockMovementAction(
  prevState: ActionState = initialActionState,
  formData: FormData,
): Promise<ActionState> {
  void prevState;
  try {
    const session = await requirePermission(PERMISSIONS.STOCK_MANAGE);
    await registerStockMovementRecord(formData, session.user.id);
    revalidatePath("/admin/stock");
    revalidatePath("/admin/products");
    return { status: "success", message: "Movimentacao registrada com sucesso." };
  } catch (error) {
    return { status: "error", message: toActionErrorMessage(error) };
  }
}

export async function uploadStockInvoiceXmlAction(
  prevState: ActionState = initialActionState,
  formData: FormData,
): Promise<ActionState> {
  void prevState;
  try {
    const session = await requirePermission(PERMISSIONS.STOCK_MANAGE);
    await storeStockInvoiceXmlRecord(formData, session.user.id);
    revalidatePath("/admin/stock");
    return {
      status: "success",
      message: "XML salvo com sucesso. Nenhum produto foi importado automaticamente.",
    };
  } catch (error) {
    return { status: "error", message: toActionErrorMessage(error) };
  }
}
