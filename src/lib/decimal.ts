import { Prisma } from "@prisma/client";

export function parseDecimalInput(value: string) {
  const normalized = value.replace(",", ".").trim();
  return new Prisma.Decimal(normalized);
}

export function toDecimal(value: number | string | Prisma.Decimal) {
  if (value instanceof Prisma.Decimal) {
    return value;
  }

  return new Prisma.Decimal(value);
}

export function decimalZero() {
  return new Prisma.Decimal(0);
}
