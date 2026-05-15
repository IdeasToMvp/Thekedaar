import type { Metadata } from "next";
import { FeedUserProvider } from "@/components/feed/FeedUserProvider";

export const metadata: Metadata = {
  title: "Job feed — Thekedaar",
  description: "Browse jobs and apply or contact employers on WhatsApp.",
};

export default function FeedLayout({ children }: { children: React.ReactNode }) {
  return <FeedUserProvider>{children}</FeedUserProvider>;
}
