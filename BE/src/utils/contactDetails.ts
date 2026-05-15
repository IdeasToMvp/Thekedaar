import { supabaseAdmin } from "../services/supabase.service";
import { getUserById } from "../services/user.service";
import { sendWhatsAppText } from "../services/whatsapp.service";
import { formatPublicLocation } from "./publicLocation";

export type ContactParty = {
  name: string;
  phone: string;
  city?: string | null;
  sector?: string | null;
  fullAddress?: string | null;
  /** Job site / workplace address (employer listings) */
  workAddress?: string | null;
};

export function formatContactBlock(party: ContactParty, heading: string): string {
  const lines: string[] = [`*${heading}*`, `Name: ${party.name}`, `Phone: ${party.phone}`];
  const area = formatPublicLocation(party.city, party.sector);
  if (area) lines.push(`Area: ${area}`);
  if (party.workAddress?.trim()) lines.push(`Work address: ${party.workAddress.trim()}`);
  else if (party.fullAddress?.trim()) lines.push(`Address: ${party.fullAddress.trim()}`);
  return lines.join("\n");
}

export async function sendHireContactDetailsWhatsApp(employerId: string, workerId: string): Promise<void> {
  const employer = await getUserById(employerId);
  const sb = supabaseAdmin();
  const { data, error } = await sb
    .from("worker_profiles")
    .select("user_id, users!inner(id, name, city, sector, phone, full_address)")
    .eq("user_id", workerId)
    .maybeSingle();
  if (error) throw error;
  if (!employer || !data) return;

  const users = data.users as
    | { name: string | null; city: string | null; sector: string | null; phone: string; full_address: string | null }
    | { name: string | null; city: string | null; sector: string | null; phone: string; full_address: string | null }[];
  const u = Array.isArray(users) ? users[0] : users;

  const employerParty: ContactParty = {
    name: employer.name?.trim() || `Employer ${employer.phone.slice(-4)}`,
    phone: employer.phone,
    city: employer.city,
    sector: employer.sector,
    fullAddress: employer.full_address ?? null,
  };
  const workerParty: ContactParty = {
    name: u.name?.trim() || `Worker ${u.phone.slice(-4)}`,
    phone: u.phone,
    city: u.city,
    sector: u.sector,
    fullAddress: u.full_address ?? null,
  };

  const empDigits = employer.phone.replace(/\D/g, "");
  const workerDigits = u.phone.replace(/\D/g, "");

  if (empDigits.length >= 10) {
    try {
      await sendWhatsAppText(
        empDigits,
        `Contact unlocked — Thekedaar\n\nYou hired *${workerParty.name}*.\n\n${formatContactBlock(workerParty, "Worker contact")}`,
      );
    } catch {
      /* non-blocking */
    }
  }
  if (workerDigits.length >= 10) {
    try {
      await sendWhatsAppText(
        workerDigits,
        `An employer reached out on Thekedaar.\n\n${formatContactBlock(employerParty, "Employer contact")}`,
      );
    } catch {
      /* non-blocking */
    }
  }
}

export async function fetchJobWorkAddress(jobId: string): Promise<string | null> {
  const sb = supabaseAdmin();
  const { data, error } = await sb.from("jobs").select("full_address").eq("id", jobId).maybeSingle();
  if (error) throw error;
  const addr = (data as { full_address: string | null } | null)?.full_address;
  return addr?.trim() || null;
}
