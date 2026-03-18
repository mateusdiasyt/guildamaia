const currencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

export function formatCurrency(value: number | string) {
  const numericValue = Number(value);
  if (Number.isNaN(numericValue)) {
    return "R$ 0,00";
  }

  return currencyFormatter.format(numericValue);
}
