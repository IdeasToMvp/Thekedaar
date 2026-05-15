export type FeedWorker = {
  id: string;
  displayName: string;
  avatarKey: string;
  role: string;
  skills: string[];
  city: string;
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
  error?: string;
  hint?: string;
};
