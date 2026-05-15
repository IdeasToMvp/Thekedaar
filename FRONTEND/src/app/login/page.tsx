import { AuthShell } from "@/components/auth/AuthShell";
import { LoginForm } from "@/components/auth/LoginForm";

type Props = {
  searchParams: Promise<{ returnTo?: string; intent?: string; jobId?: string }>;
};

export default async function LoginPage({ searchParams }: Props) {
  const params = await searchParams;
  const returnTo = typeof params.returnTo === "string" ? params.returnTo : "/feed";
  const intent = params.intent === "apply" || params.intent === "hire" ? params.intent : undefined;
  const jobId = typeof params.jobId === "string" ? params.jobId : undefined;

  let subtitle =
    "Enter the mobile number you use on WhatsApp. We will send you a one-time link to sign in — no password.";
  if (intent === "apply" && jobId) {
    subtitle = "Sign in to apply for this job or contact the employer on WhatsApp.";
  } else if (intent === "hire") {
    subtitle = "Sign in to post jobs and manage your listings.";
  }

  return (
    <AuthShell title="Sign in with WhatsApp" subtitle={subtitle}>
      <LoginForm returnTo={returnTo} intent={intent} jobId={jobId} />
    </AuthShell>
  );
}
