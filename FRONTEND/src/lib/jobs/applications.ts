import type { FeedJob } from "./types";

export type ApplicationStatus = "pending" | "approved" | "rejected";

export type ContactDetails = {
  name: string;
  phone: string;
  city?: string | null;
  sector?: string | null;
  fullAddress?: string | null;
  workAddress?: string | null;
};

export type JobApplication = {
  id: string;
  jobId: string;
  workerId: string;
  status: ApplicationStatus;
  appliedAt: string;
  updatedAt: string;
  job: FeedJob;
  worker?: {
    id: string;
    name: string;
    phone: string;
    city: string | null;
    sector: string | null;
    skills: string[];
    age: number | null;
    experienceYears: number | null;
    availability: string | null;
    fullAddress?: string | null;
  };
  employerContact?: ContactDetails;
};

export type WorkerApplicationsResponse = {
  applications: JobApplication[];
  error?: string;
};

export type IncomingApplicationsResponse = {
  applications: JobApplication[];
  error?: string;
};
