// ============================================================
// useIsAdmin.js
// Verifica se o usuário logado é administrador
// ============================================================
//
// Regra (mesma usada no Dashboard): é admin quem tiver o e-mail
// igual a VITE_ADMIN_EMAIL OU uma linha em public.app_admins.
// A checagem real de permissão continua no banco (RLS) — este
// hook só controla o que a interface mostra.
// ============================================================

import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient.js";

const ADMIN_EMAIL_FALLBACK =
  (import.meta.env.VITE_ADMIN_EMAIL || "").toLowerCase() || null;

export function useIsAdmin(currentUser) {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const email = currentUser?.email;
    if (!email) {
      setIsAdmin(false);
      setLoading(false);
      return undefined;
    }

    let isMounted = true;
    setLoading(true);

    const check = async () => {
      if (ADMIN_EMAIL_FALLBACK && email.toLowerCase() === ADMIN_EMAIL_FALLBACK) {
        if (isMounted) {
          setIsAdmin(true);
          setLoading(false);
        }
        return;
      }

      if (!supabase) {
        if (isMounted) {
          setIsAdmin(false);
          setLoading(false);
        }
        return;
      }

      try {
        const { data, error } = await supabase
          .from("app_admins")
          .select("email")
          .ilike("email", email)
          .limit(1);
        if (!isMounted) return;
        setIsAdmin(!error && Array.isArray(data) && data.length > 0);
      } catch (error) {
        console.error("Erro ao verificar admin:", error);
        if (isMounted) setIsAdmin(false);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    check();
    return () => {
      isMounted = false;
    };
  }, [currentUser?.email]);

  return { isAdmin, loading };
}
