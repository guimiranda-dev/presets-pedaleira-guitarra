"use client";

import { useEffect, useState } from "react";
import type { AuthUser } from "@/types/auth";

async function post<T>(path: string, data?: unknown): Promise<T> {
  const response = await fetch(path, {
    method: "POST", credentials: "same-origin", cache: "no-store",
    headers: { "Content-Type": "application/json" }, body: JSON.stringify(data ?? {}),
  });
  const result = await response.json();
  if (!response.ok) throw new Error(result.error || "Não foi possível concluir o acesso.");
  return result as T;
}

export function useEmailAuth() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/auth/session", { credentials: "same-origin", cache: "no-store", signal: controller.signal })
      .then(async (response) => {
        if (response.status === 401) return null;
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || "Não foi possível restaurar sua sessão.");
        return result.user as AuthUser;
      }).then((current) => { if (!controller.signal.aborted) setUser(current); })
      .catch((reason: unknown) => { if (!controller.signal.aborted) setError(reason instanceof Error ? reason.message : "Acesso indisponível."); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, []);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown((value) => Math.max(0, value - 1)), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  async function requestCode(email: string) {
    if (busy || cooldown > 0) return false;
    setBusy(true); setError("");
    try {
      await post("/api/auth/otp/request", { email });
      setCooldown(60);
      return true;
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Não foi possível enviar o código.");
      return false;
    } finally { setBusy(false); }
  }

  async function verifyCode(email: string, code: string) {
    if (busy) return;
    setBusy(true); setError("");
    try {
      const result = await post<{ user: AuthUser }>("/api/auth/otp/verify", { email, code });
      setUser(result.user);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Não foi possível verificar o código.");
    } finally { setBusy(false); }
  }

  async function logout() {
    setBusy(true); setError("");
    try { await post("/api/auth/logout"); setUser(null); }
    catch { setError("Não foi possível sair. Tente novamente."); }
    finally { setBusy(false); }
  }

  return { user, loading, busy, error, cooldown, requestCode, verifyCode, logout };
}
