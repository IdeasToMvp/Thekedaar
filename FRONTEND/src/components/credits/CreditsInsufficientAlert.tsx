import Link from "next/link";

type Props = {
  message: string;
  className?: string;
};

export function CreditsInsufficientAlert({ message, className = "" }: Props) {
  return (
    <div
      className={`rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-950 ${className}`}
      role="alert"
    >
      <p>{message}</p>
      <Link href="/feed/wallet" className="mt-1 inline-block font-semibold text-brand hover:underline">
        Add Theke Credits →
      </Link>
    </div>
  );
}
