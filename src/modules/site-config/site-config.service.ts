import { z } from "zod";
import { logAdminAction } from "@/lib/audit";
import { prisma } from "@/lib/prisma";
import type { SiteConfigDto } from "@/types";

const DEFAULT_SITE_CONFIG: SiteConfigDto = {
  address: "Rio de Janeiro 1725, Villa Allende, Córdoba",
  googleMapsEmbed:
    "<iframe src='https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3409.1325460175212!2d-64.2776806!3d-31.300081499999997!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x94329cf75ca7fb19%3A0x942d968762389d9a!2sVilla%20Allende%20Shopping%20-%20VAS!5e0!3m2!1ses!2sar!4v1776644156188!5m2!1ses!2sar' width='100%' height='350' style='border:0;border-radius:12px;' loading='lazy'></iframe>",
  whatsappNumber: "5493512288010",
  whatsappMessage: "Hola, quiero consultar por productos"
};

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
  return prisma.siteConfig.findFirst({
    orderBy: {
      createdAt: "asc"
    }
  });
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
  return getOrCreateSiteConfig();
}

export async function getOrCreateSiteConfig() {
  const siteConfig = await getSiteConfigRecord();

  if (siteConfig) {
    return mapSiteConfig(siteConfig);
  }

  const createdSiteConfig = await prisma.siteConfig.create({
    data: DEFAULT_SITE_CONFIG
  });

  return mapSiteConfig(createdSiteConfig);
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
