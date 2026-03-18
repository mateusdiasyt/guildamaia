"use client";

import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { CreateCustomerForm } from "@/presentation/admin/customers/create-customer-form";

export function CreateCustomerDialog() {
  return (
    <Dialog>
      <DialogTrigger render={<Button type="button" size="sm" className="gap-2" />}>
        <Plus className="h-4 w-4" />
        Novo cadastro
      </DialogTrigger>
      <DialogContent className="max-w-[min(900px,95vw)] gap-0 border-border/80 bg-card p-0 sm:max-w-[min(900px,95vw)]">
        <DialogHeader className="border-b border-border/70 px-5 py-4 pr-14">
          <DialogTitle>Novo cliente local</DialogTitle>
          <DialogDescription>
            Cadastro para atendimento no PDV e uso em comanda. Este registro nao cria usuario do sistema.
          </DialogDescription>
        </DialogHeader>
        <div className="max-h-[78vh] overflow-y-auto p-5">
          <CreateCustomerForm />
        </div>
      </DialogContent>
    </Dialog>
  );
}
