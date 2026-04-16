const WHATSAPP_PHONE_ALLOWED_CHARS = /^[+\d\s()-]+$/;

export function normalizeWhatsAppPhone(value: string) {
  const trimmedValue = value.trim();
  const digits = trimmedValue.replace(/\D/g, "");

  if (digits.length === 0) {
    return "";
  }

  return trimmedValue.startsWith("+") ? `+${digits}` : digits;
}

export function isValidWhatsAppPhone(value: string) {
  const trimmedValue = value.trim();

  if (!trimmedValue || !WHATSAPP_PHONE_ALLOWED_CHARS.test(trimmedValue)) {
    return false;
  }

  const plusMatches = trimmedValue.match(/\+/g) ?? [];

  if (plusMatches.length > 1 || (plusMatches.length === 1 && !trimmedValue.startsWith("+"))) {
    return false;
  }

  const digits = trimmedValue.replace(/\D/g, "");
  return digits.length >= 10 && digits.length <= 15;
}
