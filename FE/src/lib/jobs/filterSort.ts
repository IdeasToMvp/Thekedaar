import type { JobListing, JobSortKey } from "./types";

export type JobFeedFilters = {
  city: string;
  category: string;
};

export function filterJobs(jobs: JobListing[], f: JobFeedFilters): JobListing[] {
  return jobs.filter((j) => {
    if (f.city && j.city !== f.city) return false;
    if (f.category && j.category !== f.category) return false;
    return true;
  });
}

export function sortJobs(jobs: JobListing[], sort: JobSortKey): JobListing[] {
  const copy = [...jobs];
  if (sort === "newest") {
    copy.sort((a, b) => new Date(b.postedAt).getTime() - new Date(a.postedAt).getTime());
  } else if (sort === "salary_high") {
    copy.sort((a, b) => b.salaryPerMonth - a.salaryPerMonth);
  } else {
    copy.sort((a, b) => a.salaryPerMonth - b.salaryPerMonth);
  }
  return copy;
}

export function uniqueCities(jobs: JobListing[]): string[] {
  return [...new Set(jobs.map((j) => j.city))].sort();
}

export function uniqueCategories(jobs: JobListing[]): string[] {
  return [...new Set(jobs.map((j) => j.category))].sort();
}
