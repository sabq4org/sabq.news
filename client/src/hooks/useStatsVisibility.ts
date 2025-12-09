import { useState, useEffect } from "react";

const STORAGE_KEY = "sabq_show_statistics";

export function useStatsVisibility() {
  const [showStats, setShowStats] = useState<boolean>(() => {
    if (typeof window === "undefined") return true;
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored === null ? true : stored === "true";
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, String(showStats));
  }, [showStats]);

  const toggleStats = () => setShowStats((prev) => !prev);

  return { showStats, setShowStats, toggleStats };
}
