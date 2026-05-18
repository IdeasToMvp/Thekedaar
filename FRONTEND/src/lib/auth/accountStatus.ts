export type AccountStatus = "active" | "paused" | "deleted" | "banned";

export function isAccountActive(status: AccountStatus | undefined): boolean {
  return !status || status === "active";
}

export function isAccountPaused(status: AccountStatus | undefined): boolean {
  return status === "paused";
}
