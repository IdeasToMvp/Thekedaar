import { Suspense } from "react";
import { LoginTokenClient } from "@/components/auth/LoginTokenClient";

export default function LoginTokenPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-background text-sm text-muted">
          Signing you in…
        </div>
      }
    >
      <LoginTokenClient />
    </Suspense>
  );
}
