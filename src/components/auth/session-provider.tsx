"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode
} from "react";
import type { SessionUser } from "@/types";

export type SessionStatus = "loading" | "ready";

type SessionContextValue = {
  user: SessionUser | null;
  status: SessionStatus;
  refresh: () => Promise<void>;
};

const SessionContext = createContext<SessionContextValue>({
  user: null,
  status: "loading",
  refresh: async () => undefined
});

/**
 * Resuelve la sesión en el cliente para que el layout raíz no tenga que leer
 * cookies. Sin esa lectura, Next puede prerenderizar la home y las fichas de
 * producto en vez de recalcularlas contra la base en cada visita.
 *
 * Se monta una sola vez en el layout, así que sobrevive a las navegaciones del
 * lado del cliente: hay un fetch por carga completa de página, no por click.
 */
export function SessionProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [status, setStatus] = useState<SessionStatus>("loading");
  const requestIdRef = useRef(0);

  const refresh = useCallback(async () => {
    const requestId = ++requestIdRef.current;
    let nextUser: SessionUser | null = null;

    try {
      const response = await fetch("/api/users/me", { cache: "no-store" });

      if (response.ok) {
        nextUser = (await response.json()) as SessionUser;
      }
    } catch {
      nextUser = null;
    }

    // Descartar la respuesta si mientras tanto se disparó un refresh más nuevo
    // (login y logout la llaman, y pueden solaparse con la carga inicial).
    if (requestId !== requestIdRef.current) {
      return;
    }

    setUser(nextUser);
    setStatus("ready");
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return (
    <SessionContext.Provider value={{ user, status, refresh }}>
      {children}
    </SessionContext.Provider>
  );
}

export function useSession() {
  return useContext(SessionContext);
}
