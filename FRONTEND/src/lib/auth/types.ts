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

export type MeResponse = {
  user: MeUser;
};
