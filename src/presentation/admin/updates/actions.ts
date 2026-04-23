"use server";

import { revalidatePath } from "next/cache";

import { requirePermission } from "@/application/auth/guards";
import { createSystemUpdateRecord } from "@/application/updates/system-update-service";
import { PERMISSIONS } from "@/domain/auth/permissions";
import { initialActionState, toActionErrorMessage, type ActionState } from "@/presentation/admin/common/action-state";

export async function createSystemUpdateAction(
  prevState: ActionState = initialActionState,
  formData: FormData,
): Promise<ActionState> {
  void prevState;
  try {
    const session = await requirePermission(PERMISSIONS.DASHBOARD_VIEW);
    const actorName = session.user.name ?? session.user.email ?? "Usuario do painel";
    await createSystemUpdateRecord(formData, {
      id: session.user.id,
      name: actorName,
    });
    revalidatePath("/admin/updates");
    return { status: "success", message: "Atualizacao registrada com sucesso." };
  } catch (error) {
    return { status: "error", message: toActionErrorMessage(error) };
  }
}
