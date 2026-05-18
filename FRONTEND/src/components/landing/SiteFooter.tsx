import Link from "next/link";

const FOOTER_LINKS = [
  { href: "/#about", label: "About" },
  { href: "/#faq", label: "FAQ" },
  { href: "/#contact", label: "Contact" },
  { href: "/#privacy", label: "Privacy" },
  { href: "/privacy", label: "Privacy policy" },
] as const;

export function SiteFooter() {
  return (
    <footer className="border-t border-border/60 bg-surface py-10">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <nav className="flex flex-wrap gap-x-6 gap-y-2 text-sm font-medium text-muted">
          {FOOTER_LINKS.map(({ href, label }) => (
            <Link key={href + label} href={href} className="hover:text-foreground">
              {label}
            </Link>
          ))}
        </nav>
        <div className="mt-6 flex flex-col gap-2 border-t border-border/60 pt-6 text-sm text-muted sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} Thekedaar</p>
          <p>Workers &amp; employers · WhatsApp-first · Gurugram &amp; NCR</p>
        </div>
      </div>
    </footer>
  );
}
