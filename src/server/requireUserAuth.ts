import type { Request, Response, NextFunction } from "express";
import { isSupabaseConfigured, getServerSupabase } from "./supabase";

// Extend express Request with userId set by this middleware
declare global {
  namespace Express {
    interface Request {
      userId?: string;
    }
  }
}

const TIMEOUT_MS = 5000;

export async function requireUserAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
  if (!isSupabaseConfigured()) {
    res.status(503).json({ error: "PERSISTENCE_DISABLED", message: "Konto-Funktion ist nicht konfiguriert." });
    return;
  }

  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    res.status(401).json({ error: "AUTH_REQUIRED", message: "Anmeldung erforderlich." });
    return;
  }

  const jwt = authHeader.slice(7);
  const supabase = getServerSupabase()!;

  let timer: ReturnType<typeof setTimeout>;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error("auth_timeout")), TIMEOUT_MS);
  });

  try {
    const { data, error } = await Promise.race([
      supabase.auth.getUser(jwt),
      timeout,
    ]);
    clearTimeout(timer!);

    if (error || !data?.user) {
      res.status(401).json({ error: "AUTH_REQUIRED", message: "Token ungültig oder abgelaufen." });
      return;
    }

    req.userId = data.user.id;
    next();
  } catch {
    clearTimeout(timer!);
    res.status(401).json({ error: "AUTH_REQUIRED", message: "Authentifizierung fehlgeschlagen." });
  }
}
