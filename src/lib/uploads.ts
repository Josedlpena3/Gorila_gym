import { v2 as cloudinary, type UploadApiResponse } from "cloudinary";
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

function getUploadFailureMessage() {
  return "No se pudo subir la imagen.";
}

let cloudinaryConfigured = false;

function isCloudinaryConfigured() {
  return Boolean(
    env.cloudinaryCloudName &&
      env.cloudinaryApiKey &&
      env.cloudinaryApiSecret
  );
}

function ensureCloudinaryConfigured() {
  if (!isCloudinaryConfigured()) {
    throw new AppError(getUploadFailureMessage(), 500);
  }

  if (!cloudinaryConfigured) {
    cloudinary.config({
      cloud_name: env.cloudinaryCloudName,
      api_key: env.cloudinaryApiKey,
      api_secret: env.cloudinaryApiSecret,
      secure: true
    });
    cloudinaryConfigured = true;
  }
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
  ensureCloudinaryConfigured();
  const folder = getCloudinaryFolder(category);
  const buffer = Buffer.from(await file.arrayBuffer());
  const originalName =
    sanitizeFileName(file.name.replace(/\.[^.]+$/, "")) || `${category}-${Date.now()}`;
  const payload = await new Promise<UploadApiResponse>((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: "image",
        use_filename: true,
        unique_filename: true,
        filename_override: originalName
      },
      (error, result) => {
        if (error || !result) {
          reject(error ?? new Error("cloudinary_upload_failed"));
          return;
        }

        resolve(result);
      }
    );

    uploadStream.end(buffer);
  }).catch((error) => {
    console.error("[cloudinary] error al subir imagen", {
      message: error instanceof Error ? error.message : "unknown_error"
    });
    throw new AppError(getUploadFailureMessage(), 500);
  });

  const baseFileName =
    sanitizeFileName(payload.original_filename || file.name || payload.public_id || "") ||
    `${category}-${Date.now()}`;
  const extension = payload.format ? `.${payload.format}` : "";

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
  try {
    const url = new URL(value);
    return url.hostname === "res.cloudinary.com";
  } catch {
    return false;
  }
}
