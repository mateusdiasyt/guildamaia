import { z } from "zod";

const hexColorRegex = /^#[0-9a-fA-F]{6}$/;
const imageDataUrlRegex = /^data:image\/[a-zA-Z0-9.+-]+;base64,[a-zA-Z0-9+/=]+$/;

function optionalImageDataUrl(fieldLabel: string) {
  return z
    .string()
    .max(4_000_000, `${fieldLabel} muito grande.`)
    .optional()
    .or(z.literal(""))
    .refine((value) => !value || imageDataUrlRegex.test(value), `${fieldLabel} invalido.`);
}

export const updateBrandCustomizationSchema = z.object({
  primaryColor: z.string().regex(hexColorRegex, "Cor primaria invalida. Use #RRGGBB."),
  accentColor: z.string().regex(hexColorRegex, "Cor de destaque invalida. Use #RRGGBB."),
  backgroundColor: z.string().regex(hexColorRegex, "Cor de fundo invalida. Use #RRGGBB."),
  foregroundColor: z.string().regex(hexColorRegex, "Cor de texto invalida. Use #RRGGBB."),
  logoDataUrl: optionalImageDataUrl("Logo"),
  faviconDataUrl: optionalImageDataUrl("Favicon"),
});
