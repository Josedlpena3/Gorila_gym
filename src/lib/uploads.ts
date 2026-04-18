import { createHash } from "crypto";
import { AppError } from "@/lib/errors";
import { env } from "@/lib/env";

export type UploadCategory = "products" | "payment-proofs";

export type StoredUpload = {
  url: string;
  fileName: string;
  mimeType: string;
  size: number;
};

const IMAGE_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp"
]);

const MAX_UPLOAD_BYTES: Record<UploadCategory, number> = {
  products: 5 * 1024 * 1024,
  "payment-proofs": 8 * 1024 * 1024
};

function sanitizeFileName(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();
}

function getCloudinaryFolder(category: UploadCategory) {
  return `${env.cloudinaryUploadFolder}/${category}`.replace(/\/{2,}/g, "/");
}

function getUploadUnavailableMessage(category: UploadCategory) {
  if (category === "products") {
    return "La carga de imágenes no está disponible ahora. Podés guardar el producto sin imagen.";
  }

  return "La carga de archivos no está disponible ahora. Intentá nuevamente más tarde.";
}

function buildCloudinarySignature(params: Record<string, string>) {
  const signatureBase = Object.entries(params)
    .filter(([, value]) => value.length > 0)
    .sort(([leftKey], [rightKey]) => leftKey.localeCompare(rightKey))
    .map(([key, value]) => `${key}=${value}`)
    .join("&");

  return createHash("sha1")
    .update(`${signatureBase}${env.cloudinaryApiSecret}`)
    .digest("hex");
}

function isCloudinaryConfigured() {
  return Boolean(
    env.cloudinaryCloudName &&
      env.cloudinaryApiKey &&
      env.cloudinaryApiSecret
  );
}

function assertValidImage(input: {
  mimeType: string;
  size: number;
  category: UploadCategory;
}) {
  if (!IMAGE_MIME_TYPES.has(input.mimeType)) {
    throw new AppError(
      "Formato inválido. Permitidos: jpg, jpeg, png o webp.",
      400
    );
  }

  if (input.size <= 0) {
    throw new AppError("El archivo está vacío.", 400);
  }

  if (input.size > MAX_UPLOAD_BYTES[input.category]) {
    throw new AppError(
      `El archivo supera el máximo permitido de ${
        MAX_UPLOAD_BYTES[input.category] / (1024 * 1024)
      } MB.`,
      400
    );
  }
}

async function uploadToCloudinary(
  file: File,
  category: UploadCategory
): Promise<StoredUpload> {
  if (!isCloudinaryConfigured()) {
    throw new AppError(getUploadUnavailableMessage(category), 503);
  }

  const timestamp = Math.floor(Date.now() / 1000).toString();
  const folder = getCloudinaryFolder(category);
  const signature = buildCloudinarySignature({
    folder,
    timestamp
  });
  const formData = new FormData();

  formData.append("file", file);
  formData.append("api_key", env.cloudinaryApiKey);
  formData.append("timestamp", timestamp);
  formData.append("folder", folder);
  formData.append("signature", signature);

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${env.cloudinaryCloudName}/image/upload`,
    {
      method: "POST",
      body: formData,
      cache: "no-store"
    }
  );

  const payload = (await response.json().catch(() => null)) as
    | {
        secure_url?: string;
        original_filename?: string;
        public_id?: string;
        format?: string;
      }
    | null;

  if (!response.ok || typeof payload?.secure_url !== "string") {
    throw new AppError("No se pudo completar la carga del archivo.", 503);
  }

  const baseFileName =
    sanitizeFileName(payload.original_filename || file.name || payload.public_id || "") ||
    `${category}-${timestamp}`;
  const extension =
    typeof payload.format === "string" && payload.format.length > 0
      ? `.${payload.format}`
      : "";

  return {
    url: payload.secure_url,
    fileName: `${baseFileName}${extension}`,
    mimeType: file.type,
    size: file.size
  };
}

export async function storeUploadedFile(
  file: File,
  category: UploadCategory
) {
  assertValidImage({
    mimeType: file.type,
    size: file.size,
    category
  });

  return uploadToCloudinary(file, category);
}

export function isStoredUploadUrl(value: string) {
  if (value.startsWith("/uploads/")) {
    return true;
  }

  try {
    const url = new URL(value);
    return url.hostname === "res.cloudinary.com";
  } catch {
    return false;
  }
}
