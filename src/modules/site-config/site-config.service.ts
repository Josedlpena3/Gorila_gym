import { z } from "zod";
import { logAdminAction } from "@/lib/audit";
import { AppError } from "@/lib/errors";
import { prisma } from "@/lib/prisma";
import type { SiteConfigDto } from "@/types";

function normalizeWhatsappNumber(value: string) {
  return value.replace(/[^\d]/g, "");
}

function isAllowedGoogleMapsEmbed(value: string) {
  const normalized = value.trim();

  return (
    /^<iframe\b[\s\S]*<\/iframe>$/i.test(normalized) &&
    /src=(["'])https:\/\/www\.google\.com\/maps\/embed\?[^"']+\1/i.test(normalized) &&
    !/<script\b/i.test(normalized) &&
    !/\son\w+=/i.test(normalized) &&
    !/javascript:/i.test(normalized) &&
    !/<(?!\/?iframe\b)[^>]+>/i.test(normalized)
  );
}

const siteConfigSchema = z.object({
  address: z.string().trim().min(1, "La dirección es obligatoria."),
  googleMapsEmbed: z
    .string()
    .trim()
    .min(1, "El embed de Google Maps es obligatorio.")
    .refine(
      isAllowedGoogleMapsEmbed,
      "El embed debe ser un iframe válido de Google Maps."
    ),
  whatsappNumber: z
    .string()
    .trim()
    .min(8, "El número de WhatsApp es obligatorio.")
    .transform(normalizeWhatsappNumber)
    .refine(
      (value) => value.length >= 10,
      "El número de WhatsApp no es válido."
    ),
  whatsappMessage: z
    .string()
    .trim()
    .min(1, "El mensaje de WhatsApp es obligatorio.")
    .max(500, "El mensaje de WhatsApp es demasiado largo.")
});

async function getSiteConfigRecord() {
  const siteConfig = await prisma.siteConfig.findFirst({
    orderBy: {
      createdAt: "asc"
    }
  });

  if (!siteConfig) {
    throw new AppError("Configuración del sitio no encontrada", 404);
  }

  return siteConfig;
}

function mapSiteConfig(input: {
  address: string;
  googleMapsEmbed: string;
  whatsappNumber: string;
  whatsappMessage: string;
}): SiteConfigDto {
  return siteConfigSchema.parse({
    address: input.address,
    googleMapsEmbed: input.googleMapsEmbed,
    whatsappNumber: input.whatsappNumber,
    whatsappMessage: input.whatsappMessage
  });
}

export async function getSiteConfig() {
  const siteConfig = await getSiteConfigRecord();

  return mapSiteConfig(siteConfig);
}

export async function upsertSiteConfig(input: unknown, adminUserId: string) {
  const data = siteConfigSchema.parse(input);
  const existingSiteConfig = await prisma.siteConfig.findFirst({
    orderBy: {
      createdAt: "asc"
    }
  });

  const siteConfig = existingSiteConfig
    ? await prisma.siteConfig.update({
        where: { id: existingSiteConfig.id },
        data
      })
    : await prisma.siteConfig.create({
        data
      });

  await logAdminAction({
    adminUserId,
    action: existingSiteConfig ? "SITE_CONFIG_UPDATED" : "SITE_CONFIG_CREATED",
    entity: "site_config",
    entityId: siteConfig.id,
    metadata: {
      address: data.address,
      whatsappNumber: data.whatsappNumber
    }
  });

  return mapSiteConfig(siteConfig);
}
