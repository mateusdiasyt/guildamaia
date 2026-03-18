"use client";

import { PaymentMethod } from "@prisma/client";
import { ListFilter, Minus, Plus, Search, ShoppingCart, Trash2 } from "lucide-react";
import { useActionState, useMemo, useState } from "react";
import { useFormStatus } from "react-dom";

import { ActionFeedback } from "@/components/admin/action-feedback";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/format";
import { initialActionState } from "@/presentation/admin/common/action-state";
import { createSaleAction } from "@/presentation/admin/pdv/actions";

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
  salePrice: string;
  currentStock: number;
  category: {
    id: string;
    name: string;
    slug: string;
  };
};

type CreateSaleFormProps = {
  openSessions: OpenSessionOption[];
  products: ProductOption[];
};

type CartLine = {
  productId: string;
  quantity: number;
};

type PaymentLine = {
  id: number;
  method: PaymentMethod;
  amount: string;
};

const paymentLabels: Record<PaymentMethod, string> = {
  CASH: "Dinheiro",
  PIX: "Pix",
  CREDIT_CARD: "Cartao credito",
  DEBIT_CARD: "Cartao debito",
};

function paymentTemplate(method: PaymentMethod = PaymentMethod.CASH): PaymentLine {
  return {
    id: Math.floor(Math.random() * 1_000_000_000),
    method,
    amount: "",
  };
}

function parseMoneyToCents(value: string | number) {
  if (typeof value === "number") {
    return Math.round(value * 100);
  }

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

function centsToCurrency(valueInCents: number) {
  return formatCurrency(valueInCents / 100);
}

function SubmitSaleButton({ disabled }: { disabled: boolean }) {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" className="h-11 w-full text-sm font-semibold" disabled={pending || disabled}>
      {pending ? "Registrando venda..." : "Registrar venda"}
    </Button>
  );
}

export function CreateSaleForm({ openSessions, products }: CreateSaleFormProps) {
  const [state, formAction] = useActionState(createSaleAction, initialActionState);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [cartLines, setCartLines] = useState<CartLine[]>([]);
  const [paymentLines, setPaymentLines] = useState<PaymentLine[]>([paymentTemplate()]);
  const [discountAmount, setDiscountAmount] = useState("0.00");

  const productMap = useMemo(() => new Map(products.map((product) => [product.id, product])), [products]);

  const categoryOptions = useMemo(() => {
    const bySlug = new Map<string, { slug: string; name: string; count: number }>();
    for (const product of products) {
      const existing = bySlug.get(product.category.slug);
      if (existing) {
        existing.count += 1;
      } else {
        bySlug.set(product.category.slug, {
          slug: product.category.slug,
          name: product.category.name,
          count: 1,
        });
      }
    }

    return [
      { slug: "all", name: "Todos produtos", count: products.length },
      ...Array.from(bySlug.values()).sort((a, b) => a.name.localeCompare(b.name)),
    ];
  }, [products]);

  const filteredProducts = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return products.filter((product) => {
      const inCategory = selectedCategory === "all" || product.category.slug === selectedCategory;
      if (!inCategory) {
        return false;
      }

      if (!normalizedSearch) {
        return true;
      }

      return (
        product.name.toLowerCase().includes(normalizedSearch) ||
        product.sku.toLowerCase().includes(normalizedSearch)
      );
    });
  }, [products, searchTerm, selectedCategory]);

  const cartCount = useMemo(
    () => cartLines.reduce((accumulator, line) => accumulator + line.quantity, 0),
    [cartLines],
  );

  const subtotalInCents = useMemo(
    () =>
      cartLines.reduce((accumulator, line) => {
        const product = productMap.get(line.productId);
        if (!product) {
          return accumulator;
        }
        return accumulator + parseMoneyToCents(product.salePrice) * line.quantity;
      }, 0),
    [cartLines, productMap],
  );

  const discountInCents = Math.max(0, parseMoneyToCents(discountAmount));
  const totalInCents = Math.max(subtotalInCents - discountInCents, 0);
  const paidInCents = paymentLines.reduce(
    (accumulator, payment) => accumulator + Math.max(0, parseMoneyToCents(payment.amount)),
    0,
  );
  const remainingInCents = totalInCents - paidInCents;
  const paymentIsBalanced = Math.abs(remainingInCents) <= 1;
  const canSubmitSale = cartLines.length > 0 && paymentIsBalanced && paidInCents > 0;

  function addProductToCart(productId: string) {
    setCartLines((current) => {
      const product = productMap.get(productId);
      if (!product || product.currentStock <= 0) {
        return current;
      }

      const existingLine = current.find((line) => line.productId === productId);
      if (!existingLine) {
        return [...current, { productId, quantity: 1 }];
      }

      if (existingLine.quantity >= product.currentStock) {
        return current;
      }

      return current.map((line) =>
        line.productId === productId
          ? {
              ...line,
              quantity: line.quantity + 1,
            }
          : line,
      );
    });
  }

  function increaseLine(productId: string) {
    const product = productMap.get(productId);
    if (!product) {
      return;
    }

    setCartLines((current) =>
      current.map((line) => {
        if (line.productId !== productId) {
          return line;
        }

        if (line.quantity >= product.currentStock) {
          return line;
        }

        return {
          ...line,
          quantity: line.quantity + 1,
        };
      }),
    );
  }

  function decreaseLine(productId: string) {
    setCartLines((current) =>
      current
        .map((line) =>
          line.productId === productId
            ? {
                ...line,
                quantity: line.quantity - 1,
              }
            : line,
        )
        .filter((line) => line.quantity > 0),
    );
  }

  function removeLine(productId: string) {
    setCartLines((current) => current.filter((line) => line.productId !== productId));
  }

  function addPaymentLine() {
    setPaymentLines((current) => [...current, paymentTemplate(PaymentMethod.PIX)]);
  }

  function removePaymentLine(lineId: number) {
    setPaymentLines((current) => (current.length === 1 ? current : current.filter((line) => line.id !== lineId)));
  }

  function updatePaymentMethod(lineId: number, method: PaymentMethod) {
    setPaymentLines((current) =>
      current.map((line) =>
        line.id === lineId
          ? {
              ...line,
              method,
            }
          : line,
      ),
    );
  }

  function updatePaymentAmount(lineId: number, amount: string) {
    setPaymentLines((current) =>
      current.map((line) =>
        line.id === lineId
          ? {
              ...line,
              amount,
            }
          : line,
      ),
    );
  }

  return (
    <form action={formAction} className="space-y-4">
      <div className="grid gap-4 xl:grid-cols-[15rem_minmax(0,1fr)_24rem]">
        <section className="admin-form-section h-fit space-y-4 xl:sticky xl:top-24">
          <div className="flex items-center gap-2 border-b border-border/70 pb-3">
            <ListFilter className="h-4 w-4 text-primary" />
            <p className="text-sm font-semibold text-foreground">Categorias</p>
          </div>

          <div className="space-y-1">
            {categoryOptions.map((category) => (
              <button
                key={category.slug}
                type="button"
                className={cn(
                  "flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm transition-colors",
                  selectedCategory === category.slug
                    ? "bg-primary/12 font-semibold text-primary"
                    : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
                )}
                onClick={() => setSelectedCategory(category.slug)}
              >
                <span>{category.name}</span>
                <span className="text-xs">{category.count}</span>
              </button>
            ))}
          </div>
        </section>

        <section className="admin-form-section space-y-4">
          <div className="flex items-center gap-2 rounded-xl border border-border/80 bg-background/70 px-3 py-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome ou SKU"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              className="h-8 border-none bg-transparent px-0 shadow-none focus-visible:ring-0"
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-2 2xl:grid-cols-3">
            {filteredProducts.length === 0 ? (
              <div className="col-span-full rounded-xl border border-border/70 bg-muted/25 p-4 text-sm text-muted-foreground">
                Nenhum produto encontrado para o filtro aplicado.
              </div>
            ) : (
              filteredProducts.map((product) => {
                const unitPriceInCents = parseMoneyToCents(product.salePrice);
                const isOutOfStock = product.currentStock <= 0;

                return (
                  <button
                    key={product.id}
                    type="button"
                    onClick={() => addProductToCart(product.id)}
                    disabled={isOutOfStock}
                    className={cn(
                      "rounded-2xl border border-border/80 bg-card/90 p-3 text-left shadow-sm transition-all",
                      isOutOfStock
                        ? "cursor-not-allowed opacity-60"
                        : "hover:-translate-y-0.5 hover:border-primary/45 hover:shadow-md",
                    )}
                  >
                    <div className="mb-3 flex h-24 items-center justify-center rounded-xl bg-muted/35">
                      <span className="text-sm font-semibold uppercase tracking-[0.08em] text-primary/70">
                        {product.category.name}
                      </span>
                    </div>
                    <p className="truncate text-sm font-semibold text-foreground">{product.name}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">{product.sku}</p>
                    <div className="mt-3 flex items-end justify-between">
                      <p className="text-sm font-semibold text-foreground">{centsToCurrency(unitPriceInCents)}</p>
                      <p
                        className={cn(
                          "text-xs",
                          isOutOfStock ? "text-rose-600" : "text-emerald-700",
                        )}
                      >
                        estoque {product.currentStock}
                      </p>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </section>

        <section className="admin-form-section h-fit space-y-4 xl:sticky xl:top-24">
          <div className="flex items-center justify-between border-b border-border/70 pb-3">
            <div className="flex items-center gap-2">
              <ShoppingCart className="h-4 w-4 text-primary" />
              <p className="text-sm font-semibold text-foreground">Carrinho</p>
            </div>
            <p className="text-sm font-semibold text-primary">{cartCount} item(s)</p>
          </div>

          <div className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="cashSessionId">Sessao de caixa</Label>
              <select id="cashSessionId" name="cashSessionId" className="admin-native-select" defaultValue={openSessions[0]?.id} required>
                {openSessions.map((session) => (
                  <option key={session.id} value={session.id}>
                    {session.cashRegister.name} ({session.cashRegister.code})
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="customerName">Cliente (opcional)</Label>
              <Input id="customerName" name="customerName" placeholder="Nome do cliente" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="discountAmount">Desconto (R$)</Label>
              <Input
                id="discountAmount"
                name="discountAmount"
                value={discountAmount}
                onChange={(event) => setDiscountAmount(event.target.value)}
                placeholder="0.00"
                required
              />
            </div>
          </div>

          <div className="max-h-80 space-y-2 overflow-y-auto pr-1">
            {cartLines.length === 0 ? (
              <p className="rounded-xl border border-dashed border-border px-3 py-4 text-center text-sm text-muted-foreground">
                Adicione produtos para iniciar a venda.
              </p>
            ) : (
              cartLines.map((line) => {
                const product = productMap.get(line.productId);
                if (!product) {
                  return null;
                }

                const unitPriceInCents = parseMoneyToCents(product.salePrice);
                const lineTotalInCents = unitPriceInCents * line.quantity;

                return (
                  <div key={line.productId} className="rounded-xl border border-border/80 bg-background/70 p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-semibold text-foreground">{product.name}</p>
                        <p className="text-xs text-muted-foreground">{product.sku}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeLine(line.productId)}
                        className="rounded-lg p-1 text-rose-700 transition-colors hover:bg-rose-100"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>

                    <div className="mt-3 flex items-center justify-between">
                      <div className="inline-flex items-center gap-1 rounded-lg border border-border/80 bg-card p-1">
                        <button
                          type="button"
                          onClick={() => decreaseLine(line.productId)}
                          className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                        >
                          <Minus className="h-4 w-4" />
                        </button>
                        <span className="min-w-8 text-center text-sm font-semibold text-foreground">{line.quantity}</span>
                        <button
                          type="button"
                          onClick={() => increaseLine(line.productId)}
                          className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                        >
                          <Plus className="h-4 w-4" />
                        </button>
                      </div>
                      <p className="text-sm font-semibold text-foreground">{centsToCurrency(lineTotalInCents)}</p>
                    </div>

                    <input type="hidden" name="itemProductId" value={line.productId} />
                    <input type="hidden" name="itemQuantity" value={line.quantity} />
                  </div>
                );
              })
            )}
          </div>

          <div className="space-y-2 rounded-xl border border-border/80 bg-background/70 p-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-foreground">Pagamentos</p>
              <Button type="button" variant="outline" size="sm" onClick={addPaymentLine}>
                <Plus className="h-4 w-4" />
                Adicionar
              </Button>
            </div>

            <div className="space-y-2">
              {paymentLines.map((payment) => (
                <div key={payment.id} className="grid gap-2 md:grid-cols-[1fr,110px,auto]">
                  <select
                    name="paymentMethod"
                    className="admin-native-select"
                    value={payment.method}
                    onChange={(event) => updatePaymentMethod(payment.id, event.target.value as PaymentMethod)}
                  >
                    {Object.values(PaymentMethod).map((method) => (
                      <option key={method} value={method}>
                        {paymentLabels[method]}
                      </option>
                    ))}
                  </select>
                  <Input
                    name="paymentAmount"
                    value={payment.amount}
                    onChange={(event) => updatePaymentAmount(payment.id, event.target.value)}
                    placeholder="0.00"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => removePaymentLine(payment.id)}
                    disabled={paymentLines.length <= 1}
                    className="text-rose-700 hover:bg-rose-100 hover:text-rose-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-1 rounded-xl border border-border/80 bg-muted/35 p-3">
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>Subtotal</span>
              <span>{centsToCurrency(subtotalInCents)}</span>
            </div>
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>Desconto</span>
              <span>{centsToCurrency(discountInCents)}</span>
            </div>
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>Pago</span>
              <span>{centsToCurrency(paidInCents)}</span>
            </div>
            <div className="mt-2 flex items-center justify-between border-t border-border/70 pt-2 text-base font-semibold text-foreground">
              <span>Total</span>
              <span>{centsToCurrency(totalInCents)}</span>
            </div>
          </div>

          {!paymentIsBalanced ? (
            <p className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700">
              Ajuste os pagamentos:{" "}
              {remainingInCents > 0 ? "faltam" : "ha excesso de"}{" "}
              {centsToCurrency(Math.abs(remainingInCents))}.
            </p>
          ) : null}

          <SubmitSaleButton disabled={!canSubmitSale} />
          <ActionFeedback state={state} />
        </section>
      </div>
    </form>
  );
}
