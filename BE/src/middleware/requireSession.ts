import type { NextFunction, Request, Response } from "express";
import { verifySessionJwt, type SessionClaims } from "../services/magicLink.service";

export type RequestWithSession = Request & { session: SessionClaims };

export function requireSession(req: Request, res: Response, next: NextFunction) {
  const auth = req.headers.authorization;
  if (!auth?.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  const raw = auth.slice("Bearer ".length).trim();
  if (!raw) return res.status(401).json({ error: "Unauthorized" });
  try {
    (req as RequestWithSession).session = verifySessionJwt(raw);
    return next();
  } catch {
    return res.status(401).json({ error: "Invalid session" });
  }
}
