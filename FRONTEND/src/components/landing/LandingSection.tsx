type Props = {
  id: string;
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
};

export function LandingSection({ id, title, description, children, className = "" }: Props) {
  return (
    <section id={id} className={`scroll-mt-20 border-b border-border/60 py-16 sm:py-20 ${className}`}>
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">{title}</h2>
        {description ? <p className="mt-2 max-w-2xl text-muted">{description}</p> : null}
        <div className="mt-10">{children}</div>
      </div>
    </section>
  );
}
