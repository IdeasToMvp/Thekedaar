export type AccountRestrictionCode = "ACCOUNT_BANNED" | "ACCOUNT_DELETED";

export class AccountRestrictedError extends Error {
  readonly statusCode = 403;
  readonly code: AccountRestrictionCode;

  constructor(code: AccountRestrictionCode, message: string) {
    super(message);
    this.name = "AccountRestrictedError";
    this.code = code;
  }
}

export function isAccountRestrictedError(e: unknown): e is AccountRestrictedError {
  return e instanceof AccountRestrictedError;
}
