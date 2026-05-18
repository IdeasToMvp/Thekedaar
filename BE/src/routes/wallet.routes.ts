import { Router } from "express";
import { z } from "zod";
import { requireSession, type RequestWithSession } from "../middleware/requireSession";
import { isWalletError } from "../errors/walletErrors";
import { inrToPaise, MIN_TOPUP_PAISE } from "../utils/creditPricing";
import { creditTopUp, listWalletTransactions } from "../services/wallet.service";
import {
  assertRecruiterWalletAccess,
  buildRecruiterBillingSnapshot,
} from "../services/recruiterBilling.service";
import {
  createTopUpOrder,
  fetchTopUpOrder,
  isRazorpayConfigured,
  razorpayKeyId,
  verifyPaymentSignature,
} from "../services/razorpay.service";
import { randomUUID } from "crypto";

const router = Router();

function walletErrorResponse(e: unknown, res: import("express").Response) {
  if (isWalletError(e)) {
    return res.status(e.statusCode).json({
      error: e.message,
      code: e.code,
      ...e.details,
    });
  }
  const msg = e instanceof Error ? e.message : "Wallet request failed";
  return res.status(400).json({ error: msg });
}

const TopUpSchema = z.object({
  amountInr: z.number().int().min(MIN_TOPUP_PAISE / 100).max(50_000),
});

const VerifyTopUpSchema = z.object({
  razorpay_order_id: z.string().min(1),
  razorpay_payment_id: z.string().min(1),
  razorpay_signature: z.string().min(1),
});

router.get("/", requireSession, async (req, res) => {
  const session = (req as RequestWithSession).session;
  try {
    await assertRecruiterWalletAccess(session.sub);
    const [billing, transactions] = await Promise.all([
      buildRecruiterBillingSnapshot(session.sub),
      listWalletTransactions(session.sub, 25),
    ]);
    return res.status(200).json({
      ok: true,
      billing,
      topUp: {
        razorpayEnabled: isRazorpayConfigured(),
        keyId: razorpayKeyId(),
        minAmountInr: MIN_TOPUP_PAISE / 100,
        devTopUpEnabled:
          process.env.WALLET_DEV_TOPUP === "true" ||
          (process.env.NODE_ENV !== "production" && process.env.WALLET_DEV_TOPUP !== "false"),
      },
      transactions: transactions.map((t) => ({
        id: t.id,
        type: t.type,
        amountPaise: t.amount_paise,
        amountInr: t.amount_paise / 100,
        balanceAfterInr: t.balance_after_paise / 100,
        createdAt: t.created_at,
        metadata: t.metadata,
      })),
    });
  } catch (e: unknown) {
    return walletErrorResponse(e, res);
  }
});

router.post("/topup/create-order", requireSession, async (req, res) => {
  const session = (req as RequestWithSession).session;
  const parsed = TopUpSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      error: `Minimum top-up is ₹${MIN_TOPUP_PAISE / 100}`,
    });
  }

  try {
    await assertRecruiterWalletAccess(session.sub);
    if (!isRazorpayConfigured()) {
      return res.status(503).json({
        error: "Online payments are not configured. Please try again later.",
        code: "RAZORPAY_NOT_CONFIGURED",
      });
    }

    const order = await createTopUpOrder({
      userId: session.sub,
      amountInr: parsed.data.amountInr,
    });

    return res.status(200).json({
      ok: true,
      orderId: order.orderId,
      amountInr: parsed.data.amountInr,
      amountPaise: order.amountPaise,
      currency: order.currency,
      keyId: order.keyId,
    });
  } catch (e: unknown) {
    return walletErrorResponse(e, res);
  }
});

router.post("/topup/verify", requireSession, async (req, res) => {
  const session = (req as RequestWithSession).session;
  const parsed = VerifyTopUpSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid payment details" });
  }

  try {
    await assertRecruiterWalletAccess(session.sub);
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = parsed.data;

    if (
      !verifyPaymentSignature({
        orderId: razorpay_order_id,
        paymentId: razorpay_payment_id,
        signature: razorpay_signature,
      })
    ) {
      return res.status(400).json({ error: "Payment verification failed", code: "INVALID_SIGNATURE" });
    }

    const order = await fetchTopUpOrder(razorpay_order_id);
    const orderUserId = order.notes?.userId;
    if (orderUserId && orderUserId !== session.sub) {
      return res.status(403).json({ error: "Payment does not belong to this account" });
    }

    const amountPaise = Number(order.amount);
    const reference = `razorpay:${razorpay_payment_id}`;
    const { balance_paise } = await creditTopUp({
      userId: session.sub,
      amountPaise,
      reference,
      metadata: {
        orderId: razorpay_order_id,
        paymentId: razorpay_payment_id,
        amountInr: amountPaise / 100,
      },
    });

    const billing = await buildRecruiterBillingSnapshot(session.sub);
    return res.status(200).json({
      ok: true,
      credited: true,
      balanceInr: balance_paise / 100,
      billing,
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Could not verify payment";
    const code = e && typeof e === "object" && "code" in e ? String((e as { code: string }).code) : "";
    if (code === "23505" || msg.toLowerCase().includes("duplicate") || msg.includes("unique")) {
      const billing = await buildRecruiterBillingSnapshot(session.sub);
      return res.status(200).json({ ok: true, credited: false, alreadyCredited: true, billing });
    }
    return walletErrorResponse(e, res);
  }
});

/** Dev-only instant top-up (no Razorpay). */
router.post("/topup/dev", requireSession, async (req, res) => {
  const session = (req as RequestWithSession).session;
  const parsed = TopUpSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      error: `Minimum top-up is ₹${MIN_TOPUP_PAISE / 100}`,
    });
  }

  const devAllowed =
    process.env.WALLET_DEV_TOPUP === "true" ||
    (process.env.NODE_ENV !== "production" && process.env.WALLET_DEV_TOPUP !== "false");

  if (!devAllowed) {
    return res.status(404).json({ error: "Not found" });
  }

  try {
    await assertRecruiterWalletAccess(session.sub);
    const amountPaise = inrToPaise(parsed.data.amountInr);
    const reference = `dev-topup:${randomUUID()}`;
    const { balance_paise } = await creditTopUp({
      userId: session.sub,
      amountPaise,
      reference,
      metadata: { amountInr: parsed.data.amountInr, mode: "dev" },
    });

    const billing = await buildRecruiterBillingSnapshot(session.sub);
    return res.status(200).json({
      ok: true,
      credited: true,
      balanceInr: balance_paise / 100,
      billing,
    });
  } catch (e: unknown) {
    return walletErrorResponse(e, res);
  }
});

export default router;
