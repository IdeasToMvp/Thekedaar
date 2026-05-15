import type { NextFunction, Request, Response } from "express";
import { verifySessionJwt } from "../services/magicLink.service";
import type { RequestWithSession } from "./requireSession";

/** Attach session when a valid Bearer token is present; otherwise continue anonymously. */
export function optionalSession(req: Request, _res: Response, next: NextFunction) {
  const auth = req.headers.authorization;
  if (!auth?.startsWith("Bearer ")) {
    return next();
  }
  const raw = auth.slice("Bearer ".length).trim();
  if (!raw) return next();
  try {
    (req as RequestWithSession).session = verifySessionJwt(raw);
  } catch {
    // Invalid token — treat as guest for public feed browsing.
  }
  return next();
}
