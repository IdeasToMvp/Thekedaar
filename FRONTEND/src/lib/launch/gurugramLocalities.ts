/** @deprecated Import from ./cityLocalities.ts */
import { matchLocality as matchForCity } from "./cityLocalities";

export { GURUGRAM_LOCALITIES } from "./cityLocalities";

/** @deprecated use matchLocality(cityId, value) from ./cityLocalities */
export function matchLocality(value: string): string | null {
  return matchForCity("gurugram", value);
}
