import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign in — Thekedaar",
  description: "Sign in with your WhatsApp number. We send you a one-time link — no password.",
};

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return children;
}
