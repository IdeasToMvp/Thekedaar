"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { MeResponse, MeUser } from "@/lib/auth/types";
import { ACTIVE_MARKET } from "@/lib/launch";

type FeedUserContextValue = {
  user: MeUser | null;
  userLoading: boolean;
  cityId: string;
  setCityId: (id: string) => void;
  refreshUser: () => Promise<void>;
  setUser: (user: MeUser | null) => void;
};

const FeedUserContext = createContext<FeedUserContextValue | null>(null);

export function FeedUserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<MeUser | null>(null);
  const [userLoading, setUserLoading] = useState(true);
  const [cityId, setCityId] = useState(ACTIVE_MARKET.defaultCityId);

  const refreshUser = useCallback(async () => {
    const r = await fetch("/api/auth/me");
    const data = (await r.json()) as MeResponse;
    if (data?.user) {
      const u = { ...data.user };
      if (data.recruiter_profile) u.can_hire = true;
      if (data.worker_profile) u.can_seek = true;
      setUser(u);
    } else {
      setUser(null);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    setUserLoading(true);
    refreshUser()
      .catch(() => {
        if (!cancelled) setUser(null);
      })
      .finally(() => {
        if (!cancelled) setUserLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [refreshUser]);

  const value = useMemo(
    () => ({ user, userLoading, cityId, setCityId, refreshUser, setUser }),
    [user, userLoading, cityId, refreshUser],
  );

  return <FeedUserContext.Provider value={value}>{children}</FeedUserContext.Provider>;
}

export function useFeedUser() {
  const ctx = useContext(FeedUserContext);
  if (!ctx) {
    throw new Error("useFeedUser must be used within FeedUserProvider");
  }
  return ctx;
}
