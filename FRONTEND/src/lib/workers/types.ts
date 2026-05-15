export type FeedWorker = {
  id: string;
  displayName: string;
  avatarKey: string;
  role: string;
  skills: string[];
  city: string;
  sector?: string;
  publicLocation?: string;
  age?: number | null;
  gender?: string | null;
  hasAadhaar?: boolean | null;
  expectedSalary: number;
  experienceYears: number | null;
  availability: string;
  listedAt: string;
  contactWaDigits?: string;
  isOwnProfile?: boolean;
};

export type WorkersFeedResponse = {
  workers: FeedWorker[];
  total: number;
  offset: number;
  limit: number;
  hasMore: boolean;
  authenticated?: boolean;
  contactedWorkerIds?: string[];
  error?: string;
  hint?: string;
};

export type HiredWorker = FeedWorker & {
  phone: string;
  contactWaDigits: string;
  hiredAt: string;
};

export type WorkerHireLimits = {
  plan: string;
  workerContacts: { used: number; max: number; remaining: number };
  contactedWorkerIds: string[];
};

export type WorkerHireResponse = {
  ok?: boolean;
  recorded?: boolean;
  worker?: HiredWorker;
  limits?: WorkerHireLimits;
  error?: string;
};

export type ContactedWorkersResponse = {
  contacted: { workerId: string; hiredAt: string; worker: HiredWorker }[];
  limits?: WorkerHireLimits;
  error?: string;
};
