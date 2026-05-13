import { Router } from "express";
import { z } from "zod";
import { exchangeMagicLinkToken, signSessionJwt, verifySessionJwt } from "../services/magicLink.service";

const router = Router();

const ExchangeSchema = z.object({
  token: z.string().min(40),
});

router.post("/exchange", async (req, res) => {
  const parsed = ExchangeSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid request" });
  }

  try {
    const claims = await exchangeMagicLinkToken(parsed.data.token);
    const sessionToken = signSessionJwt(claims);
    return res.status(200).json({ sessionToken, user: claims });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Exchange failed";
    const status =
      msg.includes("expired") ? 410 :
      msg.includes("used") ? 409 :
      msg.includes("Invalid") ? 401 : 400;
    return res.status(status).json({ error: msg });
  }
});

router.get("/me", (req, res) => {
  const auth = req.headers.authorization;
  if (!auth?.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  const raw = auth.slice("Bearer ".length).trim();
  if (!raw) return res.status(401).json({ error: "Unauthorized" });
  try {
    const user = verifySessionJwt(raw);
    return res.status(200).json({ user });
  } catch {
    return res.status(401).json({ error: "Invalid session" });
  }
});

export default router;

