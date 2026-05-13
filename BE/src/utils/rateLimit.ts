const buckets = new Map<string, number[]>();

function prune(ts: number[], windowMs: number, now: number) {
  const cutoff = now - windowMs;
  while (ts.length && ts[0]! < cutoff) ts.shift();
}

export function allowRateLimit(key: string, max: number, windowMs: number): boolean {
  const now = Date.now();
  let ts = buckets.get(key);
  if (!ts) {
    ts = [];
    buckets.set(key, ts);
  }
  prune(ts, windowMs, now);
  if (ts.length >= max) return false;
  ts.push(now);
  return true;
}
