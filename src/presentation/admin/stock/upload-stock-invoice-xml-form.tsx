"use client";

import { useActionState, useEffect, useRef } from "react";

import { ActionFeedback } from "@/components/admin/action-feedback";
import { FormSubmitButton } from "@/components/admin/form-submit-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { initialActionState } from "@/presentation/admin/common/action-state";
import { uploadStockInvoiceXmlAction } from "@/presentation/admin/stock/actions";

export function UploadStockInvoiceXmlForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction] = useActionState(uploadStockInvoiceXmlAction, initialActionState);

  useEffect(() => {
    if (state.status === "success") {
      formRef.current?.reset();
    }
  }, [state.status]);

  return (
    <form ref={formRef} action={formAction} className="grid gap-4">
      <div className="space-y-2">
        <Label htmlFor="xmlFile">Arquivo XML da NF-e</Label>
        <Input id="xmlFile" name="xmlFile" type="file" accept=".xml,text/xml,application/xml" required />
        <p className="text-xs text-muted-foreground">
          O sistema guarda o XML com metadados para auditoria. Esta etapa nao cria nem altera produtos automaticamente.
        </p>
      </div>

      <div className="flex flex-col items-start gap-3">
        <FormSubmitButton>Carregar XML</FormSubmitButton>
        <ActionFeedback state={state} />
      </div>
    </form>
  );
}
