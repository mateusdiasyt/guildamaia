"use client";

import { CustomerDocumentType, RecordStatus } from "@prisma/client";
import { PencilLine } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { updateCustomerAction } from "@/presentation/admin/customers/actions";
import { CreateCustomerForm } from "@/presentation/admin/customers/create-customer-form";

type EditCustomerDialogProps = {
  customer: {
    id: string;
    fullName: string;
    birthDate: string;
    documentType: CustomerDocumentType;
    documentNumber: string;
    phone?: string | null;
    email?: string | null;
    status: RecordStatus;
  };
};

export function EditCustomerDialog({ customer }: EditCustomerDialogProps) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button type="button" variant="outline" size="sm" className="gap-1.5" />}>
        <PencilLine className="h-4 w-4" />
        Editar
      </DialogTrigger>
      <DialogContent className="max-w-[min(900px,95vw)] gap-0 border-border/80 bg-card p-0 sm:max-w-[min(900px,95vw)]">
        <DialogHeader className="border-b border-border/70 px-5 py-4 pr-14">
          <DialogTitle>Editar cliente</DialogTitle>
          <DialogDescription>Ajuste os dados do cliente sem perder o historico de comandas.</DialogDescription>
        </DialogHeader>
        <div className="max-h-[78vh] overflow-y-auto p-5">
          <CreateCustomerForm
            action={updateCustomerAction}
            submitLabel="Salvar alteracoes"
            initialData={{
              customerId: customer.id,
              fullName: customer.fullName,
              birthDate: customer.birthDate,
              documentType: customer.documentType,
              documentNumber: customer.documentNumber,
              phone: customer.phone,
              email: customer.email,
              status: customer.status,
            }}
            onSuccess={() => setOpen(false)}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
