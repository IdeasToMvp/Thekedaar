import Link from "next/link";

const ICON_SRC = "/logo-icon.png";
const LOCKUP_SRC = "/logo-full.png";

type Props = {
  /** `lockup` = wordmark (logo-full.png), `icon` = app icon (logo-icon.png) */
  variant?: "icon" | "lockup";
  href?: string;
  className?: string;
  priority?: boolean;
};

export function ThekedaarLogo({ variant = "lockup", href = "/", className = "", priority }: Props) {
  const isIcon = variant === "icon";
  const src = isIcon ? ICON_SRC : LOCKUP_SRC;

  const img = (
    // Native img — reliable for files in /public (Next/Image import from public often breaks)
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt="Thekedaar"
      width={isIcon ? 36 : 160}
      height={isIcon ? 36 : 52}
      decoding="async"
      fetchPriority={priority ? "high" : "auto"}
      className={`block max-h-10 object-contain object-left ${isIcon ? "h-9 w-9 rounded-lg" : "h-9 w-auto max-w-[10.5rem] sm:h-10 sm:max-w-[11.5rem]"} ${className}`}
    />
  );

  if (!href) return img;

  return (
    <Link
      href={href}
      className="inline-flex shrink-0 items-center focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 rounded-lg"
    >
      {img}
    </Link>
  );
}
