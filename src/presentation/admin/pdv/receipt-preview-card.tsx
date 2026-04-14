import Link from "next/link";

import { PaymentMethod, SaleStatus } from "@prisma/client";
import { ArrowLeft } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency } from "@/lib/format";
import { PrintReceiptButton } from "@/presentation/admin/pdv/print-receipt-button";

type ReceiptSale = {
  id: string;
  saleNumber: string;
  customerName: string | null;
  status: SaleStatus;
  subtotalAmount: { toString(): string };
  discountAmount: { toString(): string };
  totalAmount: { toString(): string };
  createdAt: Date;
  operator: {
    name: string;
  };
  cashSession: {
    cashRegister: {
      name: string;
      code: string;
    };
  };
  items: Array<{
    id: string;
    productNameSnapshot: string;
    skuSnapshot: string;
    quantity: number;
    unitPrice: { toString(): string };
    lineTotal: { toString(): string };
  }>;
  payments: Array<{
    id: string;
    method: PaymentMethod;
    amount: { toString(): string };
  }>;
};

type ReceiptPreviewCardProps = {
  sale: ReceiptSale;
  cashReceived?: number;
};

const paymentLabels: Record<PaymentMethod, string> = {
  CASH: "Dinheiro",
  PIX: "Pix",
  CREDIT_CARD: "Cartao de credito",
  DEBIT_CARD: "Cartao de debito",
};

const receiptDateFormatter = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "short",
  timeStyle: "medium",
});

function toNumber(value: { toString(): string } | string | number | null | undefined) {
  if (value === null || value === undefined) {
    return 0;
  }

  if (typeof value === "number") {
    return value;
  }

  return Number(value.toString());
}

export function ReceiptPreviewCard({ sale, cashReceived }: ReceiptPreviewCardProps) {
  const cashPaymentTotal = sale.payments
    .filter((payment) => payment.method === PaymentMethod.CASH)
    .reduce((sum, payment) => sum + toNumber(payment.amount), 0);
  const computedChange = cashReceived && cashReceived > cashPaymentTotal ? cashReceived - cashPaymentTotal : 0;

  return (
    <section className="print:block">
      <Card className="overflow-hidden border-border/80 bg-white text-black shadow-[0_28px_60px_-28px_rgba(0,0,0,0.45)] print:border-none print:shadow-none">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-black/10 px-5 py-4 print:hidden">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-black/55">Comprovante</p>
            <h2 className="text-xl font-semibold text-black">Venda finalizada</h2>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href="/admin/pdv"
              className="inline-flex h-9 items-center justify-center gap-2 rounded-xl border border-black/10 px-3 text-sm font-medium text-black transition-colors hover:bg-black/5"
            >
              <ArrowLeft className="h-4 w-4" />
              Voltar ao PDV
            </Link>
            <PrintReceiptButton />
          </div>
        </div>

        <CardContent className="mx-auto max-w-[620px] space-y-6 px-5 py-6 sm:px-8 print:max-w-none print:px-0">
          <div className="space-y-1 border-b border-dashed border-black/20 pb-5">
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-black/55">Guilda Maia</p>
            <h3 className="text-3xl font-semibold tracking-[-0.02em] text-black">Comprovante de venda</h3>
            <p className="text-sm text-black/70">Cupom operacional para conferencia e impressao do caixa.</p>
          </div>

          <div className="grid gap-4 border-b border-dashed border-black/20 pb-5 sm:grid-cols-2">
            <div className="space-y-1.5 text-sm">
              <p className="font-semibold text-black">{sale.saleNumber}</p>
              <p className="text-black/70">{sale.customerName || "Comanda avulsa"}</p>
              <p className="text-black/70">
                Caixa {sale.cashSession.cashRegister.name} ({sale.cashSession.cashRegister.code})
              </p>
            </div>
            <div className="space-y-1.5 text-sm sm:text-right">
              <p className="text-black/70">{receiptDateFormatter.format(sale.createdAt)}</p>
              <p className="text-black/70">Operador: {sale.operator.name}</p>
              <p className="font-medium text-black">{sale.status === SaleStatus.COMPLETED ? "Concluida" : "Cancelada"}</p>
            </div>
          </div>

          <div className="space-y-3 border-b border-dashed border-black/20 pb-5">
            <div className="grid grid-cols-[56px_minmax(0,1fr)_108px] gap-3 text-xs font-semibold uppercase tracking-[0.14em] text-black/55">
              <span>Item</span>
              <span>Descricao</span>
              <span className="text-right">Valor</span>
            </div>
            {sale.items.map((item, index) => (
              <div
                key={item.id}
                className="grid grid-cols-[56px_minmax(0,1fr)_108px] gap-3 text-sm text-black"
              >
                <span>{String(index + 1).padStart(3, "0")}</span>
                <div className="min-w-0">
                  <p className="font-medium">{item.productNameSnapshot}</p>
                  <p className="text-xs text-black/60">
                    {item.quantity}x • {item.skuSnapshot} • {formatCurrency(toNumber(item.unitPrice))}
                  </p>
                </div>
                <span className="text-right font-semibold">{formatCurrency(toNumber(item.lineTotal))}</span>
              </div>
            ))}
          </div>

          <div className="space-y-3 border-b border-dashed border-black/20 pb-5">
            {sale.payments.map((payment) => (
              <div key={payment.id} className="flex items-center justify-between gap-3 text-sm">
                <span className="text-black/70">{paymentLabels[payment.method]}</span>
                <span className="font-medium text-black">{formatCurrency(toNumber(payment.amount))}</span>
              </div>
            ))}
            {cashReceived ? (
              <div className="flex items-center justify-between gap-3 text-sm">
                <span className="text-black/70">Recebido em dinheiro</span>
                <span className="font-medium text-black">{formatCurrency(cashReceived)}</span>
              </div>
            ) : null}
            {computedChange > 0 ? (
              <div className="flex items-center justify-between gap-3 text-sm">
                <span className="text-black/70">Troco</span>
                <span className="font-medium text-black">{formatCurrency(computedChange)}</span>
              </div>
            ) : null}
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between gap-3 text-sm text-black/70">
              <span>Subtotal</span>
              <span>{formatCurrency(toNumber(sale.subtotalAmount))}</span>
            </div>
            <div className="flex items-center justify-between gap-3 text-sm text-black/70">
              <span>Desconto</span>
              <span>{formatCurrency(toNumber(sale.discountAmount))}</span>
            </div>
            <div className="flex items-center justify-between gap-3 border-t border-black/15 pt-3 text-[1.7rem] font-semibold tracking-[-0.03em] text-black">
              <span>Total</span>
              <span>{formatCurrency(toNumber(sale.totalAmount))}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
