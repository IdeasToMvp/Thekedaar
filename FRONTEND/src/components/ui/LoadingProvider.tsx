"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { GlobalLoader } from "./GlobalLoader";

type LoadingContextValue = {
  isLoading: boolean;
  startLoading: (label?: string) => void;
  stopLoading: () => void;
  withLoading: <T>(fn: () => Promise<T>, label?: string) => Promise<T>;
};

const LoadingContext = createContext<LoadingContextValue | null>(null);

export function LoadingProvider({ children }: { children: ReactNode }) {
  const countRef = useRef(0);
  const [isLoading, setIsLoading] = useState(false);
  const [label, setLabel] = useState("Loading…");

  const startLoading = useCallback((nextLabel?: string) => {
    countRef.current += 1;
    if (nextLabel) setLabel(nextLabel);
    setIsLoading(true);
  }, []);

  const stopLoading = useCallback(() => {
    countRef.current = Math.max(0, countRef.current - 1);
    if (countRef.current === 0) setIsLoading(false);
  }, []);

  const withLoading = useCallback(
    async <T,>(fn: () => Promise<T>, nextLabel?: string): Promise<T> => {
      startLoading(nextLabel);
      try {
        return await fn();
      } finally {
        stopLoading();
      }
    },
    [startLoading, stopLoading],
  );

  const value = useMemo(
    () => ({ isLoading, startLoading, stopLoading, withLoading }),
    [isLoading, startLoading, stopLoading, withLoading],
  );

  return (
    <LoadingContext.Provider value={value}>
      {children}
      <GlobalLoader visible={isLoading} label={label} />
    </LoadingContext.Provider>
  );
}

export function useGlobalLoading() {
  const ctx = useContext(LoadingContext);
  if (!ctx) {
    throw new Error("useGlobalLoading must be used within LoadingProvider");
  }
  return ctx;
}
