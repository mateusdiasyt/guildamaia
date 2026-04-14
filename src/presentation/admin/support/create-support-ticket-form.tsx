"use client";

import { SupportTicketPriority } from "@prisma/client";
import { useActionState, useEffect, useRef } from "react";

import { ActionFeedback } from "@/components/admin/action-feedback";
import { FormSubmitButton } from "@/components/admin/form-submit-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { initialActionState } from "@/presentation/admin/common/action-state";
import { createSupportTicketAction } from "@/presentation/admin/support/actions";

const priorityLabels: Record<SupportTicketPriority, string> = {
  LOW: "Baixa",
  MEDIUM: "Media",
  HIGH: "Alta",
  URGENT: "Urgente",
};

export function CreateSupportTicketForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction] = useActionState(createSupportTicketAction, initialActionState);

  useEffect(() => {
    if (state.status === "success") {
      formRef.current?.reset();
    }
  }, [state.status]);

  return (
    <form ref={formRef} action={formAction} className="grid gap-4">
      <div className="space-y-2">
        <Label htmlFor="title">Titulo</Label>
        <Input id="title" name="title" placeholder="Ex.: Ajustar relatorio do caixa" required />
      </div>

      <div className="space-y-2">
        <Label htmlFor="priority">Prioridade</Label>
        <select id="priority" name="priority" className="admin-native-select" defaultValue={SupportTicketPriority.MEDIUM}>
          {Object.values(SupportTicketPriority).map((priority) => (
            <option key={priority} value={priority}>
              {priorityLabels[priority]}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Detalhes</Label>
        <Textarea
          id="description"
          name="description"
          rows={6}
          placeholder="Descreva o problema, a tela afetada, o comportamento esperado e qualquer contexto que me ajude a resolver depois."
          required
        />
      </div>

      <div className="flex flex-col items-start gap-3">
        <FormSubmitButton>Abrir ticket</FormSubmitButton>
        <ActionFeedback state={state} />
      </div>
    </form>
  );
}
