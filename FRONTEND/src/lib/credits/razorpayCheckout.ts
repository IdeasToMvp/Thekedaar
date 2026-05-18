type CreateOrderResponse = {
  ok?: boolean;
  orderId: string;
  amountInr: number;
  keyId: string;
  error?: string;
  code?: string;
};

type RazorpayHandlerResponse = {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
};

type RazorpayConstructor = new (options: Record<string, unknown>) => { open: () => void };

declare global {
  interface Window {
    Razorpay?: RazorpayConstructor;
  }
}

function loadRazorpayScript(): Promise<boolean> {
  if (typeof window === "undefined") return Promise.resolve(false);
  if (window.Razorpay) return Promise.resolve(true);
  return new Promise((resolve) => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => resolve(Boolean(window.Razorpay));
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export async function openRazorpayTopUp(input: {
  amountInr: number;
  userName?: string | null;
  userPhone?: string;
}): Promise<{ ok: true; amountInr: number } | { ok: false; error: string }> {
  const orderResp = await fetch("/api/wallet/topup/create-order", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ amountInr: input.amountInr }),
  });
  const orderData = (await orderResp.json()) as CreateOrderResponse;
  if (!orderResp.ok) {
    return { ok: false, error: orderData.error || "Could not start payment" };
  }

  const loaded = await loadRazorpayScript();
  if (!loaded || !window.Razorpay) {
    return { ok: false, error: "Payment checkout could not load. Try again." };
  }

  return new Promise((resolve) => {
    const rzp = new window.Razorpay!({
      key: orderData.keyId,
      amount: orderData.amountInr * 100,
      currency: "INR",
      name: "Thekedaar",
      description: `Add ₹${input.amountInr} Theke Credits`,
      order_id: orderData.orderId,
      prefill: {
        name: input.userName || undefined,
        contact: input.userPhone || undefined,
      },
      theme: { color: "#0d9488" },
      handler: async (response: RazorpayHandlerResponse) => {
        const verifyResp = await fetch("/api/wallet/topup/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(response),
        });
        const verifyData = await verifyResp.json().catch(() => ({}));
        if (!verifyResp.ok) {
          resolve({
            ok: false,
            error: typeof verifyData?.error === "string" ? verifyData.error : "Payment verification failed",
          });
          return;
        }
        resolve({ ok: true, amountInr: input.amountInr });
      },
      modal: {
        ondismiss: () => resolve({ ok: false, error: "Payment cancelled" }),
      },
    });
    rzp.open();
  });
}
