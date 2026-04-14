"use client";

import Image from "next/image";
import Link from "next/link";

import { PaymentMethod } from "@prisma/client";
import {
  Loader2,
  Plus,
  Receipt,
  Search,
  Trash2,
  UserRound,
  Wallet,
  X,
} from "lucide-react";
import { useActionState, useDeferredValue, useState, useTransition } from "react";

import { ActionFeedback } from "@/components/admin/action-feedback";
import { FormSubmitButton } from "@/components/admin/form-submit-button";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { formatCurrency } from "@/lib/format";
import { initialActionState } from "@/presentation/admin/common/action-state";
import {
  addComandaItemRequest,
  cancelComandaAction,
  closeComandaAction,
  removeComandaItemAction,
  updateComandaCustomerAction,
  updateComandaItemAction,
} from "@/presentation/admin/pdv/actions";

type CustomerOption = {
  id: string;
  fullName: string;
  documentType: "CPF" | "RG";
  documentNumber: string;
};

type OpenSessionOption = {
  id: string;
  cashRegister: {
    name: string;
    code: string;
  };
};

type ProductOption = {
  id: string;
  name: string;
  sku: string;
  imageUrl?: string | null;
  salePrice: number;
  currentStock: number;
  category: {
    id: string;
    name: string;
    slug: string;
  };
};

type SelectedComanda = {
  id: string;
  number: number;
  isWalkIn: boolean;
  customerId: string | null;
  customerName: string;
  subtotalAmount: number;
  itemCount: number;
  openedAt: string;
  items: Array<{
    id: string;
    productId: string;
    quantity: number;
    lineTotal: number;
    product: {
      name: string;
      sku: string;
      imageUrl?: string | null;
      currentStock: number;
      category: {
        id: string;
        name: string;
        slug: string;
      };
    };
  }>;
};

type CreateSaleFormProps = {
  customers: CustomerOption[];
  openSessions: OpenSessionOption[];
  products: ProductOption[];
  selectedComanda: SelectedComanda;
  canManage: boolean;
  onClose: () => void;
};

type PaymentLine = {
  id: number;
  method: PaymentMethod;
  amount: string;
};

const paymentLabels: Record<PaymentMethod, string> = {
  CASH: "Dinheiro",
  PIX: "Pix",
  CREDIT_CARD: "Cartao de credito",
  DEBIT_CARD: "Cartao de debito",
};

const dateFormatter = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "short",
  timeStyle: "short",
});

const quantityInputClassName =
  "[appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none";

function parseMoneyToCents(value: string) {
  const trimmed = value.trim();
  if (!trimmed) {
    return 0;
  }

  let normalized = trimmed.replace(/\s/g, "");
  if (normalized.includes(",") && normalized.includes(".")) {
    normalized = normalized.replace(/\./g, "").replace(",", ".");
  } else if (normalized.includes(",")) {
    normalized = normalized.replace(",", ".");
  }

  const parsed = Number(normalized);
  if (!Number.isFinite(parsed)) {
    return 0;
  }

  return Math.round(parsed * 100);
}

function formatMoneyInput(valueInCents: number) {
  return (valueInCents / 100).toFixed(2);
}

function productAvatarLabel(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

function ProductCardMedia({
  name,
  imageUrl,
}: {
  name: string;
  imageUrl?: string | null;
}) {
  if (!imageUrl) {
    return (
      <div className="flex aspect-square w-full items-center justify-center rounded-[1.4rem] border border-dashed border-border/75 bg-background/38 text-xl font-semibold tracking-[-0.04em] text-muted-foreground">
        {productAvatarLabel(name)}
      </div>
    );
  }

  return (
    <div className="relative aspect-square w-full overflow-hidden rounded-[1.4rem] border border-border/75 bg-background/30">
      <Image src={imageUrl} alt={name} fill className="object-cover" unoptimized />
    </div>
  );
}

export function CreateSaleForm({
  customers,
  openSessions,
  products,
  selectedComanda,
  canManage,
  onClose,
}: CreateSaleFormProps) {
  const [addState, setAddState] = useState(initialActionState);
  const [updateItemState, updateItemFormAction] = useActionState(updateComandaItemAction, initialActionState);
  const [removeItemState, removeItemFormAction] = useActionState(removeComandaItemAction, initialActionState);
  const [customerState, customerFormAction] = useActionState(updateComandaCustomerAction, initialActionState);
  const [saleState, saleFormAction] = useActionState(closeComandaAction, initialActionState);
  const [cancelState, cancelFormAction] = useActionState(cancelComandaAction, initialActionState);
  const [isAddingItem, startAddTransition] = useTransition();
  const [productSearch, setProductSearch] = useState("");
  const deferredProductSearch = useDeferredValue(productSearch);
  const [discountAmount, setDiscountAmount] = useState("0.00");
  const [cashReceived, setCashReceived] = useState("");
  const [paymentLineSeed, setPaymentLineSeed] = useState(1);
  const [optimisticItems, setOptimisticItems] = useState(selectedComanda.items);
  const [paymentLines, setPaymentLines] = useState<PaymentLine[]>([
    {
      id: 1,
      method: PaymentMethod.PIX,
      amount: formatMoneyInput(Math.round(selectedComanda.subtotalAmount * 100)),
    },
  ]);

  const optimisticSubtotalAmount = optimisticItems.reduce((sum, item) => sum + item.lineTotal, 0);
  const subtotalInCents = Math.round(optimisticSubtotalAmount * 100);
  const discountInCents = Math.max(0, parseMoneyToCents(discountAmount));
  const totalInCents = Math.max(subtotalInCents - discountInCents, 0);
  const paymentsTotalInCents = paymentLines.reduce(
    (acc, paymentLine) => acc + Math.max(0, parseMoneyToCents(paymentLine.amount)),
    0,
  );
  const hasOpenSessions = openSessions.length > 0;
  const hasCashPayment = paymentLines.some((paymentLine) => paymentLine.method === PaymentMethod.CASH);
  const cashPaymentTotalInCents = paymentLines.reduce((acc, paymentLine) => {
    if (paymentLine.method !== PaymentMethod.CASH) {
      return acc;
    }

    return acc + Math.max(0, parseMoneyToCents(paymentLine.amount));
  }, 0);
  const cashReceivedInCents = Math.max(0, parseMoneyToCents(cashReceived));
  const changeInCents = Math.max(cashReceivedInCents - cashPaymentTotalInCents, 0);
  const paymentDifferenceInCents = totalInCents - paymentsTotalInCents;
  const currentCustomerLabel =
    selectedComanda.customerName || (selectedComanda.isWalkIn ? "Comanda avulsa" : "Sem cliente");
  const normalizedSearch = deferredProductSearch.trim().toLowerCase();
  const filteredProducts = products.filter((product) => {
    if (!normalizedSearch) {
      return true;
    }

    return [product.name, product.category.name]
      .join(" ")
      .toLowerCase()
      .includes(normalizedSearch);
  });
  const productGroups = filteredProducts.reduce<
    Array<{
      id: string;
      name: string;
      products: ProductOption[];
    }>
  >((groups, product) => {
    const existingGroup = groups.find((group) => group.id === product.category.id);

    if (existingGroup) {
      existingGroup.products.push(product);
      return groups;
    }

    groups.push({
      id: product.category.id,
      name: product.category.name,
      products: [product],
    });
    return groups;
  }, []);
  const comandaItemMap = new Map(
    optimisticItems.map((item) => [
      item.productId,
      {
        quantity: item.quantity,
        lineTotal: item.lineTotal,
      },
    ]),
  );

  function updatePaymentLine(id: number, field: "method" | "amount", value: string) {
    setPaymentLines((currentLines) =>
      currentLines.map((line) =>
        line.id === id
          ? {
              ...line,
              [field]: field === "method" ? (value as PaymentMethod) : value,
            }
          : line,
      ),
    );
  }

  function addPaymentLine() {
    const nextSeed = paymentLineSeed + 1;
    setPaymentLineSeed(nextSeed);
    setPaymentLines((currentLines) => [
      ...currentLines,
      {
        id: nextSeed,
        method: PaymentMethod.CASH,
        amount: "0.00",
      },
    ]);
  }

  function handleAddItemSubmit(event: React.FormEvent<HTMLFormElement>, product: ProductOption) {
    event.preventDefault();

    const form = event.currentTarget;
    const formData = new FormData(form);
    const quantity = Number(formData.get("quantity") ?? 0);

    if (!Number.isFinite(quantity) || quantity < 1) {
      setAddState({
        status: "error",
        message: "Informe uma quantidade valida.",
      });
      return;
    }

    const previousItems = optimisticItems;

    setAddState(initialActionState);
    setOptimisticItems((currentItems) => {
      const existingItem = currentItems.find((item) => item.productId === product.id);

      if (existingItem) {
        return currentItems.map((item) =>
          item.productId === product.id
            ? {
                ...item,
                quantity: item.quantity + quantity,
                lineTotal: item.lineTotal + product.salePrice * quantity,
              }
            : item,
        );
      }

      return [
        ...currentItems,
        {
          id: `optimistic-${product.id}`,
          productId: product.id,
          quantity,
          lineTotal: product.salePrice * quantity,
          product: {
            name: product.name,
            sku: product.sku,
            imageUrl: product.imageUrl,
            currentStock: product.currentStock,
            category: product.category,
          },
        },
      ];
    });

    startAddTransition(async () => {
      const result = await addComandaItemRequest(formData);

      if (result.status === "error") {
        setOptimisticItems(previousItems);
      } else {
        form.reset();
      }

      setAddState(result);
    });
  }

  function removePaymentLine(id: number) {
    setPaymentLines((currentLines) => {
      if (currentLines.length === 1) {
        return currentLines;
      }

      return currentLines.filter((line) => line.id !== id);
    });
  }

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-start justify-between gap-4 rounded-[1.5rem] border border-border/75 bg-background/38 px-4 py-4">
        <div className="flex min-w-0 items-center gap-3">
          <div className="inline-flex h-12 min-w-12 items-center justify-center rounded-2xl border border-primary/28 bg-primary/10 px-3 font-mono text-lg font-semibold tracking-[-0.04em] text-foreground">
            #{selectedComanda.number}
          </div>
          <div className="min-w-0">
            <p className="truncate text-base font-semibold text-foreground">{currentCustomerLabel}</p>
            <p className="text-xs text-muted-foreground">
              {optimisticItems.length} item(ns) - aberta em {dateFormatter.format(new Date(selectedComanda.openedAt))}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="rounded-full border border-border/70 bg-background/68 px-3 py-1 text-sm font-semibold text-foreground">
            {formatCurrency(totalInCents / 100)}
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="rounded-full border border-border/70 bg-background/55"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Fechar painel da comanda</span>
          </Button>
        </div>
      </header>

      <div className="grid gap-4 2xl:grid-cols-[minmax(0,1.15fr)_380px]">
        <div className="space-y-4">
          <section className="admin-form-section space-y-4">
            <div className="flex items-center gap-2">
              <UserRound className="h-4 w-4 text-primary" />
              <p className="text-sm font-semibold text-foreground">Cliente da comanda</p>
            </div>

            {!canManage ? (
              <p className="text-sm text-muted-foreground">{currentCustomerLabel}</p>
            ) : (
              <form action={customerFormAction} className="grid gap-3 md:grid-cols-[minmax(0,1fr)_auto] md:items-end">
                <input type="hidden" name="comandaId" value={selectedComanda.id} />

                <div className="space-y-2">
                  <Label htmlFor={`customerId-${selectedComanda.id}`}>Cliente</Label>
                  <select
                    id={`customerId-${selectedComanda.id}`}
                    name="customerId"
                    className="admin-native-select"
                    defaultValue={selectedComanda.customerId ?? ""}
                  >
                    <option value="">Comanda avulsa</option>
                    {customers.map((customer) => (
                      <option key={customer.id} value={customer.id}>
                        {customer.fullName} ({customer.documentType}: {customer.documentNumber})
                      </option>
                    ))}
                  </select>
                </div>

                <FormSubmitButton>Salvar cliente</FormSubmitButton>
                <div className="md:col-span-2">
                  <ActionFeedback state={customerState} />
                </div>
              </form>
            )}
          </section>

          <section className="admin-form-section space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-foreground">Produtos</p>
                <p className="text-xs text-muted-foreground">Cards visuais por categoria com adicao rapida na comanda.</p>
              </div>
              <div className="relative w-full max-w-sm">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={productSearch}
                  onChange={(event) => setProductSearch(event.target.value)}
                  placeholder="Buscar produto ou categoria"
                  className="pl-9"
                />
              </div>
            </div>

            {productGroups.length === 0 ? (
              <p className="rounded-2xl border border-dashed border-border/75 bg-background/32 px-4 py-6 text-sm text-muted-foreground">
                Nenhum produto encontrado com este filtro.
              </p>
            ) : (
              <div className="admin-scrollbar max-h-[44rem] space-y-5 overflow-y-auto pr-1">
                {productGroups.map((group) => (
                  <div key={group.id} className="space-y-2.5">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                        {group.name}
                      </p>
                      <span className="text-xs text-muted-foreground">{group.products.length} item(ns)</span>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                      {group.products.map((product) => {
                        const currentItem = comandaItemMap.get(product.id);

                        return (
                          <form
                            key={product.id}
                            onSubmit={(event) => handleAddItemSubmit(event, product)}
                            className="group relative flex h-full flex-col gap-3 rounded-[1.45rem] border border-border/75 bg-background/30 p-3 transition-all duration-200 hover:border-primary/30 hover:bg-background/42"
                          >
                            <input type="hidden" name="comandaId" value={selectedComanda.id} />
                            <input type="hidden" name="productId" value={product.id} />

                            {currentItem ? (
                              <div className="absolute right-3 top-3 z-10 rounded-full border border-primary/30 bg-primary/12 px-2 py-0.5 text-[10px] font-medium text-primary">
                                {currentItem.quantity} na comanda
                              </div>
                            ) : null}

                            <ProductCardMedia name={product.name} imageUrl={product.imageUrl} />

                            <div className="space-y-1">
                              <p className="line-clamp-2 min-h-10 text-sm font-semibold leading-5 text-foreground">
                                {product.name}
                              </p>
                              <div className="space-y-0.5 text-xs text-muted-foreground">
                                <p className="font-medium text-foreground/88">{formatCurrency(product.salePrice)}</p>
                                <p>{product.currentStock} em estoque</p>
                              </div>
                            </div>

                            <div className="mt-auto flex items-end gap-2">
                              <div className="min-w-0 flex-1 space-y-1">
                                <Label htmlFor={`add-quantity-${selectedComanda.id}-${product.id}`}>Qtd</Label>
                                <Input
                                  id={`add-quantity-${selectedComanda.id}-${product.id}`}
                                  name="quantity"
                                  type="number"
                                  min={1}
                                  step={1}
                                  defaultValue={1}
                                  inputMode="numeric"
                                  className={quantityInputClassName}
                                  required
                                />
                              </div>
                              {canManage ? (
                                <Button type="submit" size="icon-sm" className="shrink-0 rounded-2xl" disabled={isAddingItem}>
                                  {isAddingItem ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                                  <span className="sr-only">Adicionar produto na comanda</span>
                                </Button>
                              ) : (
                                <Button type="button" variant="outline" size="icon-sm" className="shrink-0 rounded-2xl" disabled>
                                  <Plus className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          </form>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}

            <ActionFeedback state={addState} />
          </section>
        </div>

        <div className="space-y-4">
          <section className="admin-form-section space-y-4">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-semibold text-foreground">Itens da comanda</p>
              <span className="rounded-full border border-border/70 bg-background/70 px-2.5 py-1 text-xs font-medium text-foreground">
                {optimisticItems.length}
              </span>
            </div>

            {optimisticItems.length === 0 ? (
              <p className="rounded-2xl border border-dashed border-border/75 bg-background/32 px-4 py-6 text-sm text-muted-foreground">
                Adicione produtos para montar esta comanda.
              </p>
            ) : (
              <div className="space-y-2.5">
                {optimisticItems.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-[1.35rem] border border-border/75 bg-background/30 p-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <p className="min-w-0 truncate text-sm font-medium text-foreground">{item.product.name}</p>
                      <p className="shrink-0 text-sm font-semibold text-foreground">{formatCurrency(item.lineTotal)}</p>
                    </div>

                    <div className="mt-3 flex flex-wrap items-end gap-2">
                      {canManage ? (
                        <>
                          <form action={updateItemFormAction} className="flex flex-wrap items-end gap-2">
                            <input type="hidden" name="comandaId" value={selectedComanda.id} />
                            <input type="hidden" name="productId" value={item.productId} />
                            <div className="space-y-1">
                              <Label htmlFor={`item-quantity-${selectedComanda.id}-${item.productId}`}>Qtd</Label>
                              <Input
                                id={`item-quantity-${selectedComanda.id}-${item.productId}`}
                                name="quantity"
                                type="number"
                                min={1}
                                step={1}
                                defaultValue={item.quantity}
                                inputMode="numeric"
                                className={`w-24 ${quantityInputClassName}`}
                                required
                              />
                            </div>
                            <Button type="submit" size="icon-sm" className="rounded-2xl">
                              <Plus className="h-4 w-4" />
                              <span className="sr-only">Atualizar quantidade do item</span>
                            </Button>
                          </form>

                          <form action={removeItemFormAction}>
                            <input type="hidden" name="comandaId" value={selectedComanda.id} />
                            <input type="hidden" name="productId" value={item.productId} />
                            <Button type="submit" variant="outline" size="icon-sm" className="rounded-2xl">
                              <Trash2 className="h-4 w-4" />
                              <span className="sr-only">Remover item da comanda</span>
                            </Button>
                          </form>
                        </>
                      ) : (
                        <span className="text-xs text-muted-foreground">{item.quantity} unidade(s)</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="space-y-2">
              <ActionFeedback state={updateItemState} />
              <ActionFeedback state={removeItemState} />
            </div>
          </section>

          <section className="admin-form-section space-y-4">
            <p className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <Wallet className="h-4 w-4 text-primary" />
              Fechamento
            </p>

            {!canManage ? (
              <p className="rounded-2xl border border-dashed border-border/75 bg-background/32 px-4 py-4 text-sm text-muted-foreground">
                Modo leitura.
              </p>
            ) : !hasOpenSessions ? (
              <div className="space-y-3 rounded-2xl border border-amber-400/30 bg-amber-400/8 px-4 py-4">
                <p className="text-sm text-amber-100">Abra um caixa para finalizar esta comanda.</p>
                <Link
                  href="/admin/cash"
                  className="inline-flex h-9 items-center justify-center rounded-xl bg-primary px-3.5 text-sm font-medium text-primary-foreground shadow-lg shadow-primary/25"
                >
                  Abrir caixa
                </Link>
              </div>
            ) : (
              <form action={saleFormAction} className="space-y-4">
                <input type="hidden" name="comandaId" value={selectedComanda.id} />

                <div className="space-y-2">
                  <Label htmlFor={`cashSessionId-${selectedComanda.id}`}>Caixa</Label>
                  <select
                    id={`cashSessionId-${selectedComanda.id}`}
                    name="cashSessionId"
                    className="admin-native-select"
                    defaultValue={openSessions[0]?.id}
                    required
                  >
                    {openSessions.map((session) => (
                      <option key={session.id} value={session.id}>
                        {session.cashRegister.name} ({session.cashRegister.code})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`discountAmount-${selectedComanda.id}`}>Desconto (R$)</Label>
                  <Input
                    id={`discountAmount-${selectedComanda.id}`}
                    name="discountAmount"
                    value={discountAmount}
                    onChange={(event) => setDiscountAmount(event.target.value)}
                    placeholder="0.00"
                    required
                  />
                </div>

                <div className="space-y-3 rounded-[1.35rem] border border-border/75 bg-background/32 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="flex items-center gap-2 text-sm font-semibold text-foreground">
                      <Receipt className="h-4 w-4 text-primary" />
                      Formas de pagamento
                    </p>
                    <Button type="button" variant="outline" size="sm" className="gap-2" onClick={addPaymentLine}>
                      <Plus className="h-4 w-4" />
                      Adicionar
                    </Button>
                  </div>

                  <div className="space-y-3">
                    {paymentLines.map((paymentLine) => (
                      <div key={paymentLine.id} className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_140px_auto] sm:items-end">
                        <div className="space-y-2">
                          <Label htmlFor={`payment-method-${paymentLine.id}`}>Metodo</Label>
                          <select
                            id={`payment-method-${paymentLine.id}`}
                            name="paymentMethod"
                            className="admin-native-select"
                            value={paymentLine.method}
                            onChange={(event) => updatePaymentLine(paymentLine.id, "method", event.target.value)}
                            required
                          >
                            {Object.values(PaymentMethod).map((method) => (
                              <option key={method} value={method}>
                                {paymentLabels[method]}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor={`payment-amount-${paymentLine.id}`}>Valor (R$)</Label>
                          <Input
                            id={`payment-amount-${paymentLine.id}`}
                            name="paymentAmount"
                            value={paymentLine.amount}
                            onChange={(event) => updatePaymentLine(paymentLine.id, "amount", event.target.value)}
                            placeholder="0.00"
                            required
                          />
                        </div>

                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-sm"
                          className="rounded-full border border-border/70"
                          onClick={() => removePaymentLine(paymentLine.id)}
                          disabled={paymentLines.length === 1}
                        >
                          <Trash2 className="h-4 w-4" />
                          <span className="sr-only">Remover forma de pagamento</span>
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>

                {hasCashPayment ? (
                  <div className="space-y-2">
                    <Label htmlFor={`cashReceived-${selectedComanda.id}`}>Valor recebido em dinheiro (R$)</Label>
                    <Input
                      id={`cashReceived-${selectedComanda.id}`}
                      name="cashReceived"
                      value={cashReceived}
                      onChange={(event) => setCashReceived(event.target.value)}
                      placeholder="0.00"
                    />
                    <p className="text-xs text-muted-foreground">
                      Use este campo para calcular troco quando houver pagamento em dinheiro.
                    </p>
                  </div>
                ) : (
                  <input type="hidden" name="cashReceived" value="" />
                )}

                <div className="space-y-3 rounded-[1.35rem] border border-border/75 bg-background/32 p-4">
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span>Subtotal</span>
                    <span>{formatCurrency(subtotalInCents / 100)}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span>Desconto</span>
                    <span>{formatCurrency(discountInCents / 100)}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span>Pagamentos</span>
                    <span>{formatCurrency(paymentsTotalInCents / 100)}</span>
                  </div>
                  {hasCashPayment ? (
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <span>Troco</span>
                      <span>{formatCurrency(changeInCents / 100)}</span>
                    </div>
                  ) : null}
                  <div className="border-t border-border/70 pt-3">
                    <div className="flex items-center justify-between text-base font-semibold text-foreground">
                      <span>Total</span>
                      <span>{formatCurrency(totalInCents / 100)}</span>
                    </div>
                    <p className="mt-2 text-xs text-muted-foreground">
                      {paymentDifferenceInCents === 0
                        ? "Pagamentos conferem com o total da comanda."
                        : paymentDifferenceInCents > 0
                          ? `Falta ${formatCurrency(paymentDifferenceInCents / 100)} para fechar a venda.`
                          : `Pagamentos excedem em ${formatCurrency(Math.abs(paymentDifferenceInCents) / 100)}.`}
                    </p>
                  </div>
                </div>

                <FormSubmitButton>Fechar venda</FormSubmitButton>
                <ActionFeedback state={saleState} />
              </form>
            )}
          </section>

          {canManage ? (
            <section className="space-y-3 rounded-[1.35rem] border border-destructive/25 bg-destructive/6 p-4">
              <p className="flex items-center gap-2 text-sm font-semibold text-foreground">
                <Trash2 className="h-4 w-4 text-destructive" />
                Cancelar comanda
              </p>
              <form action={cancelFormAction} className="space-y-3">
                <input type="hidden" name="comandaId" value={selectedComanda.id} />
                <div className="space-y-2">
                  <Label htmlFor={`cancelReason-${selectedComanda.id}`}>Motivo</Label>
                  <Textarea
                    id={`cancelReason-${selectedComanda.id}`}
                    name="cancelReason"
                    rows={3}
                    placeholder="Descreva o motivo do cancelamento"
                    required
                  />
                </div>
                <Button type="submit" variant="destructive" className="gap-2">
                  Cancelar comanda
                </Button>
              </form>
              <ActionFeedback state={cancelState} />
            </section>
          ) : null}
        </div>
      </div>
    </div>
  );
}
