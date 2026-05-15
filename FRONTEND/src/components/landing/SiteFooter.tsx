export function SiteFooter() {
  return (
    <footer className="border-t border-border/60 bg-surface py-8">
      <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 text-sm text-muted sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <p>© {new Date().getFullYear()} Thekedaar</p>
        <p>Workers &amp; employers · WhatsApp-first · Gurugram &amp; NCR</p>
      </div>
    </footer>
  );
}
