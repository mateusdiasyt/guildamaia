"use client";

import { useActionState, useEffect, useRef } from "react";

import { ActionFeedback } from "@/components/admin/action-feedback";
import { FormSubmitButton } from "@/components/admin/form-submit-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { initialActionState } from "@/presentation/admin/common/action-state";
import { createSystemUpdateAction } from "@/presentation/admin/updates/actions";

export function CreateSystemUpdateForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction] = useActionState(createSystemUpdateAction, initialActionState);

  useEffect(() => {
    if (state.status === "success") {
      formRef.current?.reset();
    }
  }, [state.status]);

  return (
    <form ref={formRef} action={formAction} className="grid gap-4">
      <div className="space-y-2">
        <Label htmlFor="title">Titulo da atualizacao</Label>
        <Input id="title" name="title" placeholder="Ex.: Novo fluxo de XML no estoque" required />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Descricao</Label>
        <Textarea
          id="description"
          name="description"
          rows={5}
          placeholder="Descreva o que mudou, impacto para operacao e pontos de atencao."
          required
        />
      </div>

      <div className="flex flex-col items-start gap-3">
        <FormSubmitButton>Publicar atualizacao</FormSubmitButton>
        <ActionFeedback state={state} />
      </div>
    </form>
  );
}
