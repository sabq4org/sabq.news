import { createContext, useContext, useCallback, useState, useEffect } from "react";

type AnnouncementPriority = "polite" | "assertive" | "off";

type Announcement = {
  id: string;
  message: string;
  priority: AnnouncementPriority;
  timestamp: number;
};

type LiveRegionProviderProps = {
  children: React.ReactNode;
};

type LiveRegionProviderState = {
  announce: (message: string, priority?: AnnouncementPriority) => void;
  announcePolite: (message: string) => void;
  announceAssertive: (message: string) => void;
  clearAnnouncements: () => void;
};

const LiveRegionContext = createContext<LiveRegionProviderState | undefined>(
  undefined
);

let announcementCounter = 0;

export function LiveRegionProvider({ children }: LiveRegionProviderProps) {
  const [politeAnnouncements, setPoliteAnnouncements] = useState<Announcement[]>([]);
  const [assertiveAnnouncements, setAssertiveAnnouncements] = useState<Announcement[]>([]);

  const announce = useCallback(
    (message: string, priority: AnnouncementPriority = "polite") => {
      if (!message.trim() || priority === "off") return;

      const announcement: Announcement = {
        id: `announcement-${++announcementCounter}`,
        message: message.trim(),
        priority,
        timestamp: Date.now(),
      };

      if (priority === "assertive") {
        setAssertiveAnnouncements((prev) => [...prev, announcement]);
      } else {
        setPoliteAnnouncements((prev) => [...prev, announcement]);
      }

      // Auto-clear after 5 seconds to prevent memory buildup
      setTimeout(() => {
        if (priority === "assertive") {
          setAssertiveAnnouncements((prev) =>
            prev.filter((a) => a.id !== announcement.id)
          );
        } else {
          setPoliteAnnouncements((prev) =>
            prev.filter((a) => a.id !== announcement.id)
          );
        }
      }, 5000);
    },
    []
  );

  // Listen for external announcements via custom events
  useEffect(() => {
    const handleExternalAnnouncement = (event: Event) => {
      const customEvent = event as CustomEvent<{
        message: string;
        priority?: AnnouncementPriority;
      }>;
      
      if (customEvent.detail?.message) {
        announce(
          customEvent.detail.message,
          customEvent.detail.priority || "polite"
        );
      }
    };

    window.addEventListener("a11y:announce", handleExternalAnnouncement);

    return () => {
      window.removeEventListener("a11y:announce", handleExternalAnnouncement);
    };
  }, [announce]);

  const announcePolite = useCallback(
    (message: string) => announce(message, "polite"),
    [announce]
  );

  const announceAssertive = useCallback(
    (message: string) => announce(message, "assertive"),
    [announce]
  );

  const clearAnnouncements = useCallback(() => {
    setPoliteAnnouncements([]);
    setAssertiveAnnouncements([]);
  }, []);

  return (
    <LiveRegionContext.Provider
      value={{
        announce,
        announcePolite,
        announceAssertive,
        clearAnnouncements,
      }}
    >
      {children}
      
      {/* Polite live region - won't interrupt screen reader */}
      <div
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
        data-testid="live-region-polite"
      >
        {politeAnnouncements.map((announcement) => (
          <div key={announcement.id}>{announcement.message}</div>
        ))}
      </div>

      {/* Assertive live region - will interrupt screen reader */}
      <div
        role="alert"
        aria-live="assertive"
        aria-atomic="true"
        className="sr-only"
        data-testid="live-region-assertive"
      >
        {assertiveAnnouncements.map((announcement) => (
          <div key={announcement.id}>{announcement.message}</div>
        ))}
      </div>
    </LiveRegionContext.Provider>
  );
}

export const useAnnounce = () => {
  const context = useContext(LiveRegionContext);
  if (!context) {
    throw new Error("useAnnounce must be used within LiveRegionProvider");
  }
  return context;
};

// Export a standalone announce function for use outside components
export const announceToScreenReader = (
  message: string,
  priority: AnnouncementPriority = "polite"
) => {
  window.dispatchEvent(
    new CustomEvent("a11y:announce", {
      detail: { message, priority },
    })
  );
};
