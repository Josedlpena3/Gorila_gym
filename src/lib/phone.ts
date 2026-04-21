export function extractPhoneDigits(value: string) {
  return value.replace(/\D/g, "");
}

export function normalizePhone(phone: string): string {
  const cleaned = extractPhoneDigits(phone);

  if (!cleaned) {
    return "";
  }

  if (cleaned.startsWith("54")) {
    return cleaned;
  }

  if (cleaned.startsWith("9")) {
    return `54${cleaned}`;
  }

  return `549${cleaned}`;
}

export function isValidPhone(value: string) {
  const cleaned = extractPhoneDigits(value);
  return cleaned.length >= 8;
}

export const normalizeWhatsAppPhone = normalizePhone;
export const isValidWhatsAppPhone = isValidPhone;
