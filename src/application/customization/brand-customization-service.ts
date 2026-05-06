import { updateBrandCustomizationSchema } from "@/domain/customization/schemas";
import { brandCustomizationDefaults } from "@/domain/customization/defaults";
import { createAuditLog } from "@/infrastructure/db/repositories/audit-log-repository";
import {
  getBrandCustomization,
  isMissingBrandCustomizationTableError,
  upsertBrandCustomization,
} from "@/infrastructure/db/repositories/brand-customization-repository";

type Rgb = {
  r: number;
  g: number;
  b: number;
};

export const defaultBrandCustomization = {
  ...brandCustomizationDefaults,
  logoDataUrl: null as string | null,
  faviconDataUrl: null as string | null,
};

export type BrandCustomizationSnapshot = {
  primaryColor: string;
  accentColor: string;
  backgroundColor: string;
  foregroundColor: string;
  logoDataUrl: string | null;
  faviconDataUrl: string | null;
  updatedAt: Date | null;
  setupPending: boolean;
};

function normalizeHex(hexColor: string) {
  return hexColor.trim().toUpperCase();
}

function hexToRgb(hexColor: string): Rgb {
  const normalized = normalizeHex(hexColor).replace("#", "");
  const r = Number.parseInt(normalized.slice(0, 2), 16);
  const g = Number.parseInt(normalized.slice(2, 4), 16);
  const b = Number.parseInt(normalized.slice(4, 6), 16);

  return {
    r,
    g,
    b,
  };
}

function rgbToHex(rgb: Rgb) {
  const toHex = (value: number) => value.toString(16).padStart(2, "0");
  return `#${toHex(rgb.r)}${toHex(rgb.g)}${toHex(rgb.b)}`.toUpperCase();
}

function mixHex(baseColor: string, mixColor: string, mixRatio: number) {
  const base = hexToRgb(baseColor);
  const mix = hexToRgb(mixColor);
  const ratio = Math.max(0, Math.min(1, mixRatio));

  return rgbToHex({
    r: Math.round(base.r * (1 - ratio) + mix.r * ratio),
    g: Math.round(base.g * (1 - ratio) + mix.g * ratio),
    b: Math.round(base.b * (1 - ratio) + mix.b * ratio),
  });
}

function contrastTextColor(backgroundColor: string) {
  const { r, g, b } = hexToRgb(backgroundColor);
  const luminance = (r * 0.299 + g * 0.587 + b * 0.114) / 255;
  return luminance > 0.58 ? "#101010" : "#F8F4EA";
}

function normalizeImageDataUrl(value?: string) {
  const normalized = value?.trim();
  return normalized ? normalized : null;
}

function validateImageDataUrl(value: string | null, fieldLabel: string, maxLength: number) {
  if (!value) {
    return;
  }

  if (!value.startsWith("data:image/") || !value.includes(";base64,")) {
    throw new Error(`${fieldLabel} invalido. Envie um arquivo de imagem valido.`);
  }

  if (value.length > maxLength) {
    throw new Error(`${fieldLabel} muito grande. Envie um arquivo menor.`);
  }
}

function customizationTableError(error: unknown): never {
  if (isMissingBrandCustomizationTableError(error)) {
    throw new Error("Modulo de personalizacao aguardando sincronizacao do banco. Rode o db:push no ambiente atual.");
  }

  throw error instanceof Error ? error : new Error("Nao foi possivel carregar a personalizacao.");
}

export async function getBrandCustomizationSnapshot(): Promise<BrandCustomizationSnapshot> {
  try {
    const current = await getBrandCustomization();

    if (!current) {
      return {
        ...defaultBrandCustomization,
        updatedAt: null,
        setupPending: false,
      };
    }

    return {
      primaryColor: normalizeHex(current.primaryColor),
      accentColor: normalizeHex(current.accentColor),
      backgroundColor: normalizeHex(current.backgroundColor),
      foregroundColor: normalizeHex(current.foregroundColor),
      logoDataUrl: current.logoDataUrl,
      faviconDataUrl: current.faviconDataUrl,
      updatedAt: current.updatedAt,
      setupPending: false,
    };
  } catch (error) {
    if (isMissingBrandCustomizationTableError(error)) {
      console.warn("[CUSTOMIZATION] Tabela BrandCustomization ainda nao existe neste banco.");

      return {
        ...defaultBrandCustomization,
        updatedAt: null,
        setupPending: true,
      };
    }

    throw error;
  }
}

export async function updateBrandCustomizationRecord(
  input: FormData,
  actor: { id?: string; name: string },
) {
  const parsed = updateBrandCustomizationSchema.parse({
    primaryColor: input.get("primaryColor"),
    accentColor: input.get("accentColor"),
    backgroundColor: input.get("backgroundColor"),
    foregroundColor: input.get("foregroundColor"),
    logoDataUrl: input.get("logoDataUrl"),
    faviconDataUrl: input.get("faviconDataUrl"),
  });

  const logoDataUrl = normalizeImageDataUrl(parsed.logoDataUrl);
  const faviconDataUrl = normalizeImageDataUrl(parsed.faviconDataUrl);

  validateImageDataUrl(logoDataUrl, "Logo", 700_000);
  validateImageDataUrl(faviconDataUrl, "Favicon", 220_000);

  let updated: Awaited<ReturnType<typeof upsertBrandCustomization>>;

  try {
    updated = await upsertBrandCustomization({
      primaryColor: normalizeHex(parsed.primaryColor),
      accentColor: normalizeHex(parsed.accentColor),
      backgroundColor: normalizeHex(parsed.backgroundColor),
      foregroundColor: normalizeHex(parsed.foregroundColor),
      logoDataUrl,
      faviconDataUrl,
      updatedById: actor.id,
      updatedByName: actor.name,
    });
  } catch (error) {
    customizationTableError(error);
  }

  await createAuditLog({
    userId: actor.id,
    action: "customization.brand.update",
    entity: "BrandCustomization",
    entityId: updated.id,
    metadata: {
      primaryColor: updated.primaryColor,
      accentColor: updated.accentColor,
      backgroundColor: updated.backgroundColor,
      foregroundColor: updated.foregroundColor,
      hasLogo: Boolean(updated.logoDataUrl),
      hasFavicon: Boolean(updated.faviconDataUrl),
    },
  });

  return updated;
}

export function buildBrandThemeVariables(snapshot: Pick<
  BrandCustomizationSnapshot,
  "primaryColor" | "accentColor" | "backgroundColor" | "foregroundColor"
>) {
  const primaryColor = normalizeHex(snapshot.primaryColor);
  const accentColor = normalizeHex(snapshot.accentColor);
  const backgroundColor = normalizeHex(snapshot.backgroundColor);
  const foregroundColor = normalizeHex(snapshot.foregroundColor);

  return {
    "--background": backgroundColor,
    "--foreground": foregroundColor,
    "--card": mixHex(backgroundColor, "#FFFFFF", 0.045),
    "--card-foreground": foregroundColor,
    "--popover": mixHex(backgroundColor, "#FFFFFF", 0.065),
    "--popover-foreground": foregroundColor,
    "--primary": primaryColor,
    "--primary-foreground": contrastTextColor(primaryColor),
    "--secondary": mixHex(backgroundColor, "#FFFFFF", 0.085),
    "--secondary-foreground": mixHex(foregroundColor, backgroundColor, 0.12),
    "--muted": mixHex(backgroundColor, "#FFFFFF", 0.062),
    "--muted-foreground": mixHex(foregroundColor, backgroundColor, 0.48),
    "--accent": accentColor,
    "--accent-foreground": contrastTextColor(accentColor),
    "--border": mixHex(backgroundColor, foregroundColor, 0.16),
    "--input": mixHex(backgroundColor, foregroundColor, 0.17),
    "--ring": primaryColor,
    "--chart-1": primaryColor,
    "--chart-2": accentColor,
    "--chart-3": mixHex(accentColor, "#111111", 0.26),
    "--chart-4": mixHex(backgroundColor, "#111111", 0.25),
    "--chart-5": mixHex(primaryColor, "#FFFFFF", 0.28),
    "--sidebar": mixHex(backgroundColor, "#000000", 0.12),
    "--sidebar-foreground": foregroundColor,
    "--sidebar-primary": primaryColor,
    "--sidebar-primary-foreground": contrastTextColor(primaryColor),
    "--sidebar-accent": mixHex(backgroundColor, "#FFFFFF", 0.05),
    "--sidebar-accent-foreground": mixHex(foregroundColor, backgroundColor, 0.12),
    "--sidebar-border": mixHex(backgroundColor, foregroundColor, 0.14),
    "--sidebar-ring": primaryColor,
  } as Record<`--${string}`, string>;
}
