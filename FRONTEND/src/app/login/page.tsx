import { redirect } from "next/navigation";
import { AuthShell } from "@/components/auth/AuthShell";
import { LoginForm } from "@/components/auth/LoginForm";
import { getSessionUser } from "@/lib/auth/session";
import { defaultReturnAfterAuth, normalizeReturnTo } from "@/lib/signIn";

type Props = {
  searchParams: Promise<{ returnTo?: string; intent?: string; jobId?: string }>;
};

function safeReturnTo(path: string | undefined, intent?: "apply" | "hire"): string {
  if (path && path.startsWith("/") && !path.startsWith("/login")) {
    return normalizeReturnTo(path, intent);
  }
  return defaultReturnAfterAuth(intent);
}

export default async function LoginPage({ searchParams }: Props) {
  const params = await searchParams;
  const intent = params.intent === "apply" || params.intent === "hire" ? params.intent : undefined;
  const returnTo = safeReturnTo(typeof params.returnTo === "string" ? params.returnTo : undefined, intent);
  const jobId = typeof params.jobId === "string" ? params.jobId : undefined;

  const user = await getSessionUser();
  if (user) {
    redirect(returnTo);
  }

  let subtitle =
    "Already on Thekedaar? Enter your WhatsApp number for a login link. New here? Send Hi on WhatsApp to get started.";
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
