import type { NextFunction, Request, Response } from "express";
import { isAccountRestrictedError } from "../errors/accountErrors";
import { assertUserCanAuthenticate } from "../services/accountLifecycle.service";
import { verifySessionJwt, type SessionClaims } from "../services/magicLink.service";

export type RequestWithSession = Request & { session: SessionClaims };

export async function requireSession(req: Request, res: Response, next: NextFunction) {
  const auth = req.headers.authorization;
  if (!auth?.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  const raw = auth.slice("Bearer ".length).trim();
  if (!raw) return res.status(401).json({ error: "Unauthorized" });
  try {
    const session = verifySessionJwt(raw);
    await assertUserCanAuthenticate(session.sub);
    (req as RequestWithSession).session = session;
    return next();
  } catch (e: unknown) {
    if (isAccountRestrictedError(e)) {
      return res.status(e.statusCode).json({ error: e.message, code: e.code });
    }
    return res.status(401).json({ error: "Invalid session" });
  }
}
