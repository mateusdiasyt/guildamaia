"use client";

import { CircleX } from "lucide-react";
import { useActionState, useState } from "react";

import { ActionFeedback } from "@/components/admin/action-feedback";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { initialActionState } from "@/presentation/admin/common/action-state";
import { cancelSaleAction } from "@/presentation/admin/pdv/actions";

type CancelSaleFormProps = {
  saleId: string;
};

export function CancelSaleForm({ saleId }: CancelSaleFormProps) {
  const [open, setOpen] = useState(false);
  const [state, formAction] = useActionState(cancelSaleAction, initialActionState);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button type="button" variant="outline" size="icon-sm" className="text-destructive hover:text-destructive" />}>
        <CircleX className="h-4 w-4" />
      </DialogTrigger>
      <DialogContent className="max-w-[min(560px,95vw)] gap-0 border-border/80 bg-card p-0 sm:max-w-[min(560px,95vw)]">
        <DialogHeader className="border-b border-border/70 px-5 py-4 pr-14">
          <DialogTitle>Cancelar venda</DialogTitle>
          <DialogDescription>
            Informe o motivo e confirme para cancelar esta venda e retornar os itens ao estoque.
          </DialogDescription>
        </DialogHeader>
        <form action={formAction} className="space-y-3 p-5">
          <input type="hidden" name="saleId" value={saleId} />

          <div className="space-y-2">
            <Label htmlFor={`cancel-sale-reason-${saleId}`}>Motivo</Label>
            <Textarea
              id={`cancel-sale-reason-${saleId}`}
              name="cancelReason"
              rows={4}
              placeholder="Descreva o motivo do cancelamento"
              required
            />
          </div>

          <Button type="submit" variant="destructive" size="sm">
            Confirmar cancelamento
          </Button>
          <ActionFeedback state={state} />
        </form>
      </DialogContent>
    </Dialog>
  );
}
