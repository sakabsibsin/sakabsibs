import { useState, useCallback } from "react";

const KEY = "aurum_admin_session";
const TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

function isSessionValid(): boolean {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return false;
    const { expiresAt } = JSON.parse(raw) as { expiresAt: number };
    return Date.now() < expiresAt;
  } catch {
    return false;
  }
}

export function useAdminAuth() {
  const [isAuthed, setIsAuthed] = useState<boolean>(() => isSessionValid());

  const login = useCallback(async (password: string): Promise<boolean> => {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });

    if (!res.ok) return false;

    localStorage.setItem(KEY, JSON.stringify({ expiresAt: Date.now() + TTL_MS }));
    setIsAuthed(true);
    return true;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(KEY);
    setIsAuthed(false);
  }, []);

  return { isAuthed, login, logout };
}
