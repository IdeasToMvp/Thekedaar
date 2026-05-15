"use client";

type Props = {
  onClick: () => void;
};

export function PostJobFab({ onClick }: Props) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="fixed bottom-6 right-4 z-40 flex items-center gap-2 rounded-full bg-brand-dark px-5 py-3.5 text-sm font-semibold text-white shadow-lg shadow-brand/30 transition hover:bg-brand sm:right-6"
    >
      <span className="text-lg leading-none" aria-hidden>
        +
      </span>
      Post a Job
    </button>
  );
}
