import { randomUUID } from "crypto";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { AppError } from "@/lib/errors";

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

const EXTENSION_BY_MIME: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp"
};

const MIME_BY_EXTENSION: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp"
};

function getUploadDirectory(category: UploadCategory) {
  return path.join(process.cwd(), "public", "uploads", category);
}

function sanitizeFileName(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();
}

function getExtension(fileName: string, mimeType: string) {
  const extension = path.extname(fileName);

  if (extension) {
    return extension.toLowerCase();
  }

  return EXTENSION_BY_MIME[mimeType] ?? ".bin";
}

function inferMimeType(fileName: string, mimeType: string) {
  if (mimeType) {
    return mimeType;
  }

  return MIME_BY_EXTENSION[path.extname(fileName).toLowerCase()] ?? "";
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

async function writeUpload(input: {
  buffer: Buffer;
  originalName: string;
  mimeType: string;
  category: UploadCategory;
}) {
  assertValidImage({
    mimeType: input.mimeType,
    size: input.buffer.length,
    category: input.category
  });

  const directory = getUploadDirectory(input.category);
  await mkdir(directory, { recursive: true });

  const baseName =
    sanitizeFileName(path.basename(input.originalName, path.extname(input.originalName))) ||
    input.category;
  const fileName = `${baseName}-${randomUUID()}${getExtension(
    input.originalName,
    input.mimeType
  )}`;
  const absolutePath = path.join(directory, fileName);

  await writeFile(absolutePath, input.buffer);

  return {
    url: `/uploads/${input.category}/${fileName}`,
    fileName,
    mimeType: input.mimeType,
    size: input.buffer.length
  } satisfies StoredUpload;
}

export async function storeUploadedFile(
  file: File,
  category: UploadCategory
) {
  const buffer = Buffer.from(await file.arrayBuffer());

  return writeUpload({
    buffer,
    originalName: file.name,
    mimeType: file.type,
    category
  });
}

export async function importRemoteImage(
  sourceUrl: string,
  category: UploadCategory
) {
  let parsedUrl: URL;

  try {
    parsedUrl = new URL(sourceUrl);
  } catch {
    throw new AppError("La URL de la imagen no es válida.", 400);
  }

  if (!["http:", "https:"].includes(parsedUrl.protocol)) {
    throw new AppError("La URL de la imagen debe ser pública y usar http o https.", 400);
  }

  const response = await fetch(sourceUrl);

  if (!response.ok) {
    throw new AppError("No se pudo descargar la imagen desde la URL indicada.", 400);
  }

  const contentType =
    response.headers.get("content-type")?.split(";")[0]?.trim() ?? "";
  const buffer = Buffer.from(await response.arrayBuffer());
  const originalName = path.basename(parsedUrl.pathname) || `${category}.jpg`;

  return writeUpload({
    buffer,
    originalName,
    mimeType: inferMimeType(originalName, contentType),
    category
  });
}

export function isStoredUploadUrl(value: string) {
  return value.startsWith("/uploads/");
}
