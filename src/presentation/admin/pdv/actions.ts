"use server";

import { revalidatePath } from "next/cache";

import { requirePermission } from "@/application/auth/guards";
import {
  addComandaItemRecord,
  cancelSaleRecord,
  closeComandaRecord,
  createComandaRecord,
  createSaleRecord,
  removeComandaItemRecord,
} from "@/application/pdv/pdv-service";
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

export async function createComandaAction(
  prevState: ActionState = initialActionState,
  formData: FormData,
): Promise<ActionState> {
  void prevState;
  try {
    const session = await requirePermission(PERMISSIONS.PDV_MANAGE);
    await createComandaRecord(formData, session.user.id);
    revalidatePath("/admin/pdv");
    return { status: "success", message: "Comanda criada com sucesso." };
  } catch (error) {
    return { status: "error", message: toActionErrorMessage(error) };
  }
}

export async function addComandaItemAction(
  prevState: ActionState = initialActionState,
  formData: FormData,
): Promise<ActionState> {
  void prevState;
  try {
    const session = await requirePermission(PERMISSIONS.PDV_MANAGE);
    await addComandaItemRecord(formData, session.user.id);
    revalidatePath("/admin/pdv");
    revalidatePath("/admin/products");
    return { status: "success", message: "Item adicionado na comanda." };
  } catch (error) {
    return { status: "error", message: toActionErrorMessage(error) };
  }
}

export async function closeComandaAction(
  prevState: ActionState = initialActionState,
  formData: FormData,
): Promise<ActionState> {
  void prevState;
  try {
    const session = await requirePermission(PERMISSIONS.PDV_MANAGE);
    await closeComandaRecord(formData, session.user.id);
    revalidatePath("/admin/pdv");
    revalidatePath("/admin/stock");
    revalidatePath("/admin/products");
    revalidatePath("/admin/cash");
    revalidatePath("/admin");
    return { status: "success", message: "Comanda fechada e venda registrada." };
  } catch (error) {
    return { status: "error", message: toActionErrorMessage(error) };
  }
}

export async function removeComandaItemAction(formData: FormData) {
  try {
    const session = await requirePermission(PERMISSIONS.PDV_MANAGE);
    await removeComandaItemRecord(formData, session.user.id);
  } catch (error) {
    console.error("Falha ao remover item da comanda", error);
  }
  revalidatePath("/admin/pdv");
}
