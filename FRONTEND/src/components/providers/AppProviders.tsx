"use client";

import type { ReactNode } from "react";
import { LoadingProvider } from "@/components/ui/LoadingProvider";

export function AppProviders({ children }: { children: ReactNode }) {
  return <LoadingProvider>{children}</LoadingProvider>;
}
