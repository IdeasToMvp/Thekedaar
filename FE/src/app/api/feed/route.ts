import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { DUMMY_JOB_LISTINGS } from "@/lib/jobs/dummyJobs";
import { filterJobs, sortJobs, uniqueCategories, uniqueCities } from "@/lib/jobs/filterSort";
import type { JobSortKey } from "@/lib/jobs/types";

export const dynamic = "force-dynamic";

const SORT_VALUES = new Set<string>(["newest", "salary_high", "salary_low"]);

function parseSort(raw: string | null): JobSortKey {
  if (raw && SORT_VALUES.has(raw)) return raw as JobSortKey;
  return "newest";
}

/**
 * Server-side job feed (demo data). All filters and pagination are taken from the URL query string.
 * Requires session cookie (same as /app pages).
 */
export async function GET(req: NextRequest) {
  const cookieName = process.env.SESSION_COOKIE_NAME || "tk_session";
  const token = (await cookies()).get(cookieName)?.value;
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: { "Cache-Control": "no-store" } });
  }

  const { searchParams } = req.nextUrl;
  const offset = Math.max(0, Number.parseInt(searchParams.get("offset") ?? "0", 10) || 0);
  const limitRaw = Number.parseInt(searchParams.get("limit") ?? "8", 10) || 8;
  const limit = Math.min(50, Math.max(1, limitRaw));
  const city = searchParams.get("city") ?? "";
  const category = searchParams.get("category") ?? "";
  const sort = parseSort(searchParams.get("sort"));

  const filteredSorted = sortJobs(filterJobs(DUMMY_JOB_LISTINGS, { city, category }), sort);
  const total = filteredSorted.length;
  const jobs = filteredSorted.slice(offset, offset + limit);
  const hasMore = offset + jobs.length < total;

  return NextResponse.json(
    {
      jobs,
      total,
      offset,
      limit,
      hasMore,
      meta: {
        cities: uniqueCities(DUMMY_JOB_LISTINGS),
        categories: uniqueCategories(DUMMY_JOB_LISTINGS),
      },
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
