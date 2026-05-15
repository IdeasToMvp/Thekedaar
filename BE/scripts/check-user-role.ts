/**
 * Diagnose user role for a phone number.
 * Usage: cd BE && npx ts-node --transpile-only scripts/check-user-role.ts 8872730235
 */
import dotenv from "dotenv";
import path from "path";
import { normalizePhoneForWhatsApp } from "../src/utils/phone";
import { getUserByPhone, getUserWithProfiles } from "../src/services/user.service";
import { listRecruiterOwnListings } from "../src/services/jobs.service";

dotenv.config({ path: path.join(__dirname, "../.env") });

async function main() {
  const raw = process.argv[2] ?? "8872730235";
  const normalized = normalizePhoneForWhatsApp(raw);
  if (!normalized) {
    console.error("Invalid phone");
    process.exit(1);
  }

  console.log("Normalized phone:", normalized);

  const user = await getUserByPhone(normalized);
  if (!user) {
    const alt = await getUserByPhone(raw.replace(/\D/g, ""));
    console.log("No user for normalized phone.");
    if (alt) console.log("Found user with raw digits:", alt.phone, alt.id);
    process.exit(1);
  }

  const full = await getUserWithProfiles(user.id);
  const listings = await listRecruiterOwnListings(user.id);

  console.log({
    id: user.id,
    phone: user.phone,
    name: user.name,
    current_mode: user.current_mode,
    has_worker_profile: Boolean(full?.worker_profile),
    has_recruiter_profile: Boolean(full?.recruiter_profile),
    can_hire: Boolean(full?.recruiter_profile),
    listing_count: listings.length,
  });
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
