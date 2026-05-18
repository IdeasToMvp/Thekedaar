"use client";

import Image from "next/image";

type Props = {
  visible: boolean;
  label?: string;
};

export function GlobalLoader({ visible, label = "Loading…" }: Props) {
  if (!visible) return null;

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/35 backdrop-blur-[2px]"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div className="flex flex-col items-center gap-3 rounded-2xl border border-white/20 bg-white/95 px-8 py-7 shadow-xl">
        <Image
          src="/thekedaar_loader.gif"
          alt=""
          width={72}
          height={72}
          unoptimized
          className="h-[72px] w-[72px]"
          priority
        />
        <p className="text-sm font-medium text-foreground">{label}</p>
      </div>
    </div>
  );
}
