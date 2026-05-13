import { Router } from "express";
import { z } from "zod";
import { exchangeMagicLinkToken, signSessionJwt } from "../services/magicLink.service";

const router = Router();

const ExchangeSchema = z.object({
  token: z.string().min(10),
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
  } catch (e: any) {
    const msg = e?.message ?? "Exchange failed";
    const status =
      msg.includes("expired") ? 410 :
      msg.includes("used") ? 409 :
      msg.includes("Invalid") ? 401 : 400;
    return res.status(status).json({ error: msg });
  }
});

export default router;

