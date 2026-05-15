export function formatRelativeTime(iso: string): string {
  const then = new Date(iso).getTime();
  const now = Date.now();
  const sec = Math.floor((now - then) / 1000);
  if (sec < 60) return "just now";
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.floor(hr / 24);
  if (day < 7) return `${day}d ago`;
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

export function formatSalary(amount: number): string {
  if (!amount || amount <= 0) return "Negotiable";
  if (amount >= 100000) return `₹${(amount / 100000).toFixed(1)}L/mo`;
  return `₹${amount.toLocaleString("en-IN")}/mo`;
}
