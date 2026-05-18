export class WalletError extends Error {
  readonly code: string;
  readonly statusCode: number;
  readonly details?: Record<string, unknown>;

  constructor(
    code: string,
    message: string,
    statusCode = 400,
    details?: Record<string, unknown>,
  ) {
    super(message);
    this.name = "WalletError";
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
  }
}

export class InsufficientCreditsError extends WalletError {
  constructor(requiredPaise: number, balancePaise: number) {
    super(
      "INSUFFICIENT_CREDITS",
      `Not enough Theke Credits. Need ₹${(requiredPaise / 100).toFixed(0)}, you have ₹${(balancePaise / 100).toFixed(0)}.`,
      402,
      { requiredPaise, balancePaise },
    );
  }
}

export function isWalletError(e: unknown): e is WalletError {
  return e instanceof WalletError;
}
