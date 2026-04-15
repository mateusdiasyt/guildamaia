"use client";

import { SupportTicketStatus } from "@prisma/client";
import { useActionState } from "react";

import { ActionFeedback } from "@/components/admin/action-feedback";
import { FormSubmitButton } from "@/components/admin/form-submit-button";
import { Label } from "@/components/ui/label";
import { initialActionState } from "@/presentation/admin/common/action-state";
import { updateSupportTicketStatusAction } from "@/presentation/admin/support/actions";

type UpdateSupportTicketStatusFormProps = {
  ticketId: string;
  status: SupportTicketStatus;
};

const statusLabels: Record<SupportTicketStatus, string> = {
  OPEN: "Aberto",
  IN_PROGRESS: "Em andamento",
  RESOLVED: "Resolvido",
};

export function UpdateSupportTicketStatusForm({
  ticketId,
  status,
}: UpdateSupportTicketStatusFormProps) {
  const [state, formAction] = useActionState(updateSupportTicketStatusAction, initialActionState);

  return (
    <form action={formAction} className="w-full max-w-[156px] space-y-2">
      <input type="hidden" name="ticketId" value={ticketId} />
      <div className="space-y-1.5">
        <Label htmlFor={`support-status-${ticketId}`} className="text-[11px] uppercase tracking-[0.14em]">
          Status
        </Label>
        <div className="space-y-2">
          <select
            id={`support-status-${ticketId}`}
            name="status"
            className="admin-native-select w-full min-w-0"
            defaultValue={status}
          >
            {Object.values(SupportTicketStatus).map((statusOption) => (
              <option key={statusOption} value={statusOption}>
                {statusLabels[statusOption]}
              </option>
            ))}
          </select>
          <FormSubmitButton>Salvar</FormSubmitButton>
        </div>
      </div>
      <ActionFeedback state={state} />
    </form>
  );
}
