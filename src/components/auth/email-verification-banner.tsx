"use client";

import { EmailVerificationNotice } from "@/components/auth/email-verification-notice";
import { useSession } from "@/components/auth/session-provider";

/**
 * Muestra el aviso de verificación de email leyendo la sesión del cliente, para
 * que el layout raíz no necesite consultarla en el servidor.
 */
export function EmailVerificationBanner() {
  const { user, status } = useSession();

  if (status === "loading" || !user || user.emailVerified) {
    return null;
  }

  return (
    <div className="page-shell pt-6">
      <EmailVerificationNotice email={user.email} />
    </div>
  );
}
