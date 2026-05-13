import Link from "next/link";

export default function Home() {
  return (
    <main className="flex-1 flex items-center justify-center p-6">
      <div className="w-full max-w-md rounded-2xl border border-black/10 bg-white p-6 shadow-sm">
        <div className="text-sm font-medium text-black/70">Thekedaar</div>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">Recruit or find work via WhatsApp</h1>
        <p className="mt-2 text-sm text-black/70">
          Login with your mobile number. Use the same number you use on WhatsApp.
        </p>

        <div className="mt-6 flex gap-3">
          <Link
            href="/login"
            className="inline-flex items-center justify-center rounded-xl bg-black px-4 py-2 text-sm font-medium text-white hover:bg-black/90"
          >
            Continue
          </Link>
          <Link
            href="/app"
            className="inline-flex items-center justify-center rounded-xl border border-black/15 px-4 py-2 text-sm font-medium hover:bg-black/5"
          >
            Dashboard
          </Link>
        </div>
      </div>
    </main>
  );
}

