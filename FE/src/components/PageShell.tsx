"use client";

import { motion } from "framer-motion";

type PageShellProps = {
  children: React.ReactNode;
  className?: string;
};

export function PageShell({ children, className = "" }: PageShellProps) {
  return (
    <main className={`flex flex-1 flex-col items-center justify-center px-4 py-10 sm:px-6 ${className}`}>
      {children}
    </main>
  );
}

type ElevatedCardProps = {
  children: React.ReactNode;
  className?: string;
  delay?: number;
};

type CardSize = "md" | "lg";

export function ElevatedCard({
  children,
  className = "",
  delay = 0,
  size = "md",
}: ElevatedCardProps & { size?: CardSize }) {
  const max = size === "lg" ? "max-w-lg" : "max-w-md";
  return (
    <motion.div
      initial={{ opacity: 0, y: 16, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: "spring", stiffness: 380, damping: 28, delay }}
      className={`relative w-full ${max} overflow-hidden rounded-3xl border border-slate-200/80 bg-white/95 p-6 shadow-[0_22px_50px_-12px_rgba(15,23,42,0.12)] backdrop-blur-sm sm:p-8 ${className}`}
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 z-10 h-1 bg-gradient-to-r from-emerald-500 via-teal-400 to-amber-400" />
      <div className="relative pt-1">{children}</div>
    </motion.div>
  );
}
