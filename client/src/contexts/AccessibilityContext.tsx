import { createContext, useContext, useEffect, useState } from "react";

type FontSize = "normal" | "large" | "x-large";

type AccessibilitySettings = {
  fontSize: FontSize;
  highContrast: boolean;
  reduceMotion: boolean;
};

type AccessibilityProviderProps = {
  children: React.ReactNode;
  defaultSettings?: Partial<AccessibilitySettings>;
};

type AccessibilityProviderState = {
  settings: AccessibilitySettings;
  setFontSize: (size: FontSize) => void;
  setHighContrast: (enabled: boolean) => void;
  setReduceMotion: (enabled: boolean) => void;
  resetSettings: () => void;
};

const defaultAccessibilitySettings: AccessibilitySettings = {
  fontSize: "normal",
  highContrast: false,
  reduceMotion: false,
};

const AccessibilityContext = createContext<AccessibilityProviderState | undefined>(
  undefined
);

export function AccessibilityProvider({
  children,
  defaultSettings,
}: AccessibilityProviderProps) {
  const [settings, setSettings] = useState<AccessibilitySettings>(() => {
    // Load from localStorage
    const stored = localStorage.getItem("accessibility-settings");
    if (stored) {
      try {
        return { ...defaultAccessibilitySettings, ...JSON.parse(stored) };
      } catch {
        return { ...defaultAccessibilitySettings, ...defaultSettings };
      }
    }
    return { ...defaultAccessibilitySettings, ...defaultSettings };
  });

  // Apply settings to documentElement
  useEffect(() => {
    const root = document.documentElement;

    // Apply font size
    root.classList.remove("font-normal", "font-large", "font-x-large");
    root.classList.add(`font-${settings.fontSize}`);
    root.setAttribute("data-font-size", settings.fontSize);

    // Apply high contrast
    if (settings.highContrast) {
      root.classList.add("high-contrast");
      root.setAttribute("data-high-contrast", "true");
    } else {
      root.classList.remove("high-contrast");
      root.removeAttribute("data-high-contrast");
    }

    // Apply reduce motion
    if (settings.reduceMotion) {
      root.classList.add("reduce-motion");
      root.setAttribute("data-reduce-motion", "true");
    } else {
      root.classList.remove("reduce-motion");
      root.removeAttribute("data-reduce-motion");
    }

    // Save to localStorage
    localStorage.setItem("accessibility-settings", JSON.stringify(settings));
  }, [settings]);

  const setFontSize = (fontSize: FontSize) => {
    setSettings((prev) => ({ ...prev, fontSize }));
  };

  const setHighContrast = (highContrast: boolean) => {
    setSettings((prev) => ({ ...prev, highContrast }));
  };

  const setReduceMotion = (reduceMotion: boolean) => {
    setSettings((prev) => ({ ...prev, reduceMotion }));
  };

  const resetSettings = () => {
    setSettings(defaultAccessibilitySettings);
  };

  return (
    <AccessibilityContext.Provider
      value={{
        settings,
        setFontSize,
        setHighContrast,
        setReduceMotion,
        resetSettings,
      }}
    >
      {children}
    </AccessibilityContext.Provider>
  );
}

export const useAccessibility = () => {
  const context = useContext(AccessibilityContext);
  if (!context) {
    throw new Error("useAccessibility must be used within AccessibilityProvider");
  }
  return context;
};
