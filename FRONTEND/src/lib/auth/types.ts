export type AppMode = "worker" | "recruiter";

export type MeUser = {
  id: string;
  sub: string;
  phone: string;
  name: string | null;
  city: string | null;
  sector?: string | null;
  current_mode: AppMode;
  can_seek: boolean;
  can_hire: boolean;
};

export type WorkerProfile = {
  user_id: string;
  role: string | null;
  skills?: string[] | null;
  age: number | null;
  gender: string | null;
  has_aadhaar: boolean | null;
  experience_years: number | null;
  expected_salary: number | null;
  availability: string | null;
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
  worker_profile?: WorkerProfile | null;
  sessionToken?: string;
};

export type ProfilePatchBody = {
  name?: string | null;
  city?: string | null;
  sector?: string | null;
  current_mode?: AppMode;
  worker?: {
    role?: string | null;
    skills?: string[] | null;
    age?: number | null;
    gender?: "male" | "female" | "other" | "prefer_not_to_say" | null;
    has_aadhaar?: boolean | null;
    experience_years?: number | null;
    expected_salary?: number | null;
    availability?: string | null;
  };
  recruiter?: {
    business_name?: string | null;
    hiring_type?: string | null;
    company_name?: string | null;
  };
};
