"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  type ReactNode,
} from "react";
import type { RewardEvent, RewardEventContextValue } from "@/lib/gamification/types";

const RewardEventContext = createContext<RewardEventContextValue | null>(null);

/**
 * RewardEventProvider — wraps the app to provide a pub/sub reward event system.
 *
 * Components can subscribe to events via `useRewardEvents()` hook.
 * The ExerciseEngineClient emits events after exercise submission,
 * and UI components (toasts, overlays, banners) react to them.
 *
 * @example
 * // In layout.tsx
 * <RewardEventProvider>
 *   {children}
 * </RewardEventProvider>
 */
export function RewardEventProvider({ children }: { children: ReactNode }) {
  const handlersRef = useRef<Set<(event: RewardEvent) => void>>(new Set());

  const subscribe = useCallback((handler: (event: RewardEvent) => void) => {
    handlersRef.current.add(handler);
    return () => {
      handlersRef.current.delete(handler);
    };
  }, []);

  const emit = useCallback((event: RewardEvent) => {
    for (const handler of handlersRef.current) {
      try {
        handler(event);
      } catch {
        // Silently ignore individual handler errors
      }
    }
  }, []);

  const value = useMemo<RewardEventContextValue>(
    () => ({ emit, subscribe }),
    [emit, subscribe],
  );

  return (
    <RewardEventContext value={value}>
      {children}
    </RewardEventContext>
  );
}

/**
 * Hook to access the reward event emitter/subscriber.
 * Must be used within a <RewardEventProvider>.
 */
export function useRewardEvents(): RewardEventContextValue {
  const ctx = useContext(RewardEventContext);
  if (!ctx) {
    throw new Error("useRewardEvents must be used within <RewardEventProvider>");
  }
  return ctx;
}
