"use client";

import React, { useEffect, useState } from "react";
import OnboardingTour from "./OnboardingTour";
import { hasCompletedOnboarding } from "@/lib/onboarding";

/**
 * OnboardingGate — client wrapper kiểm tra localStorage rồi render tour nếu cần.
 *
 * Dashboard page (server component) bọc nội dung bằng gate này.
 * Gate chỉ hiện tour ở client (sau mount) để tránh hydration mismatch —
 * server render không có tour, client kiểm tra localStorage rồi quyết.
 *
 * @module onboarding/OnboardingGate
 */
export default function OnboardingGate({ children }: { children: React.ReactNode }) {
  const [showTour, setShowTour] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (!hasCompletedOnboarding()) {
      setShowTour(true);
    }
  }, []);

  return (
    <>
      {children}
      {mounted && showTour && <OnboardingTour onComplete={() => setShowTour(false)} />}
    </>
  );
}
