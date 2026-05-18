const steps = [
  {
    title: "Message on WhatsApp",
    body: "Say you want work or want to hire. We guide you in Hindi or English — no forms to memorize.",
  },
  {
    title: "Use the app",
    body: "Sign in on the website to browse jobs, apply, post listings, and manage applications — all tied to your WhatsApp number.",
  },
  {
    title: "Sign in to apply or post",
    body: "When you are ready to contact an employer or publish a job, sign in with your WhatsApp link.",
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="border-b border-border/60 bg-background py-16 sm:py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">How Thekedaar works</h2>
        <p className="mt-2 max-w-xl text-muted">Simple steps for workers and employers.</p>
        <ol className="mt-10 grid gap-6 sm:grid-cols-3">
          {steps.map((step, i) => (
            <li
              key={step.title}
              className="rounded-2xl border border-border bg-surface p-6 shadow-sm shadow-slate-900/5"
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand/10 text-sm font-bold text-brand">
                {i + 1}
              </span>
              <h3 className="mt-4 font-semibold text-foreground">{step.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">{step.body}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
