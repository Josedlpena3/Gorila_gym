import { z } from "zod";
import { logAdminAction } from "@/lib/audit";
import { prisma } from "@/lib/prisma";
import type { SiteConfigDto } from "@/types";

const DEFAULT_SITE_CONFIG: SiteConfigDto = {
  address: "Rio de Janeiro 1725, Villa Allende, Córdoba",
  googleMapsUrl:
    "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3409.1325460175212!2d-64.2776806!3d-31.300081499999997!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x94329cf75ca7fb19%3A0x942d968762389d9a!2sVilla%20Allende%20Shopping%20-%20VAS!5e0!3m2!1ses!2sar!4v1776644156188!5m2!1ses!2sar",
  whatsappNumber: "5493513552255",
  whatsappMessage: "Hola, quiero consultar por productos"
};

function normalizeWhatsappNumber(value: string) {
  return value.replace(/[^\d]/g, "");
}

function normalizeGoogleMapsUrl(value: string) {
  const normalized = value.trim();

  if (normalized.length === 0) {
    return normalized;
  }

  const url = new URL(normalized);
  const allowedHosts = new Set(["www.google.com", "google.com", "maps.google.com"]);

  if (url.protocol !== "https:" || !allowedHosts.has(url.hostname)) {
    throw new Error("invalid_google_maps_host");
  }

  if (!url.pathname.startsWith("/maps")) {
    throw new Error("invalid_google_maps_path");
  }

  return url.toString();
}

const siteConfigSchema = z.object({
  address: z.string().trim().min(1, "La dirección es obligatoria."),
  googleMapsUrl: z
    .string()
    .trim()
    .min(1, "La URL de Google Maps es obligatoria.")
    .transform((value, context) => {
      try {
        return normalizeGoogleMapsUrl(value);
      } catch {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          message: "La URL de Google Maps no es válida."
        });
        return z.NEVER;
      }
    }),
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
  googleMapsUrl: string;
  whatsappNumber: string;
  whatsappMessage: string;
}): SiteConfigDto {
  return siteConfigSchema.parse({
    address: input.address,
    googleMapsUrl: input.googleMapsUrl,
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
