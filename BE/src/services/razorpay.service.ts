import crypto from "crypto";
import Razorpay from "razorpay";
import { inrToPaise } from "../utils/creditPricing";

function razorpayClient(): Razorpay | null {
  const keyId = process.env.RAZORPAY_KEY_ID?.trim();
  const keySecret = process.env.RAZORPAY_KEY_SECRET?.trim();
  if (!keyId || !keySecret) return null;
  return new Razorpay({ key_id: keyId, key_secret: keySecret });
}

export function isRazorpayConfigured(): boolean {
  return Boolean(process.env.RAZORPAY_KEY_ID?.trim() && process.env.RAZORPAY_KEY_SECRET?.trim());
}

export function razorpayKeyId(): string | null {
  return process.env.RAZORPAY_KEY_ID?.trim() || null;
}

export async function createTopUpOrder(input: {
  userId: string;
  amountInr: number;
}): Promise<{ orderId: string; amountPaise: number; currency: string; keyId: string }> {
  const client = razorpayClient();
  const keyId = razorpayKeyId();
  if (!client || !keyId) {
    throw new Error("Razorpay is not configured on the server");
  }

  const amountPaise = inrToPaise(input.amountInr);
  const order = await client.orders.create({
    amount: amountPaise,
    currency: "INR",
    receipt: `topup_${input.userId.slice(0, 8)}_${Date.now()}`,
    notes: {
      userId: input.userId,
      purpose: "theke_credits_topup",
    },
  });

  return {
    orderId: order.id,
    amountPaise: Number(order.amount),
    currency: order.currency,
    keyId,
  };
}

export async function fetchTopUpOrder(orderId: string): Promise<{
  id: string;
  amount: number | string;
  notes?: Record<string, string>;
}> {
  const client = razorpayClient();
  if (!client) throw new Error("Razorpay is not configured on the server");
  const order = await client.orders.fetch(orderId);
  return {
    id: order.id,
    amount: order.amount,
    notes: (order.notes ?? {}) as Record<string, string>,
  };
}

export function verifyPaymentSignature(input: {
  orderId: string;
  paymentId: string;
  signature: string;
}): boolean {
  const secret = process.env.RAZORPAY_KEY_SECRET?.trim();
  if (!secret) return false;
  const body = `${input.orderId}|${input.paymentId}`;
  const expected = crypto.createHmac("sha256", secret).update(body).digest("hex");
  return expected === input.signature;
}

export async function fetchPayment(paymentId: string): Promise<{
  id: string;
  method: string;
  status: string;
  order_id: string | null;
}> {
  const client = razorpayClient();
  if (!client) throw new Error("Razorpay is not configured on the server");

  const payment = await client.payments.fetch(paymentId);
  return {
    id: payment.id,
    method: String(payment.method ?? ""),
    status: String(payment.status ?? ""),
    order_id: payment.order_id ? String(payment.order_id) : null,
  };
}

export function isUpiPayment(method: string | null | undefined): boolean {
  return (method ?? "").toLowerCase() === "upi";
}
