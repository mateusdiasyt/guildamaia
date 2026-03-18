"use client";

import Link from "next/link";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { CreateComandaForm } from "@/presentation/admin/pdv/create-comanda-form";

type CustomerOption = {
  id: string;
  fullName: string;
  documentType: "CPF" | "RG";
  documentNumber: string;
};

type CreateComandaDialogProps = {
  customers: CustomerOption[];
};

export function CreateComandaDialog({ customers }: CreateComandaDialogProps) {
  return (
    <Dialog>
      <DialogTrigger render={<Button type="button" size="sm" className="gap-2" />}>
        <Plus className="h-4 w-4" />
        Nova comanda
      </DialogTrigger>
      <DialogContent className="max-w-[min(920px,95vw)] gap-0 border-border/80 bg-card p-0 sm:max-w-[min(920px,95vw)]">
        <DialogHeader className="border-b border-border/70 px-5 py-4 pr-14">
          <DialogTitle>Nova comanda</DialogTitle>
          <DialogDescription>
            Abra comandas numeradas de 0 a 200 e vincule um cliente cadastrado ou atendimento avulso.
          </DialogDescription>
        </DialogHeader>
        <div className="max-h-[78vh] overflow-y-auto p-5">
          <CreateComandaForm customers={customers} />
          {customers.length === 0 ? (
            <div className="mt-3 rounded-xl border border-border/70 bg-card/55 px-4 py-3">
              <p className="text-sm text-muted-foreground">
                Nenhum cliente cadastrado. Para comanda nominal, cadastre clientes na aba correspondente.
              </p>
              <Link
                href="/admin/customers"
                className="mt-2 inline-flex h-8 items-center justify-center rounded-lg border border-border/70 bg-background/70 px-3 text-xs font-medium text-foreground transition-colors hover:bg-muted/50"
              >
                Ir para clientes
              </Link>
            </div>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}
