export type AppMode = "worker" | "recruiter";

export type MeUser = {
  id: string;
  sub: string;
  phone: string;
  name: string | null;
  city: string | null;
  current_mode: AppMode;
  can_seek: boolean;
  can_hire: boolean;
};

export type RecruiterProfile = {
  user_id: string;
  business_name: string | null;
  hiring_type: string | null;
  company_name: string | null;
};

export type MeResponse = {
  user: MeUser;
  recruiter_profile?: RecruiterProfile | null;
  worker_profile?: unknown | null;
};
