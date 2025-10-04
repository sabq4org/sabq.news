import { createContext, useContext, useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import type { Theme as AppTheme } from "@shared/schema";

type Theme = "light" | "dark";

type ThemeProviderProps = {
  children: React.ReactNode;
  defaultTheme?: Theme;
};

type ThemeProviderState = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  appTheme: AppTheme | null;
  isLoadingAppTheme: boolean;
};

const ThemeProviderContext = createContext<ThemeProviderState | undefined>(
  undefined
);

export function ThemeProvider({
  children,
  defaultTheme = "light",
}: ThemeProviderProps) {
  const [theme, setTheme] = useState<Theme>(
    () => (localStorage.getItem("theme") as Theme) || defaultTheme
  );

  const { data: appTheme, isLoading: isLoadingAppTheme } = useQuery<AppTheme | null>({
    queryKey: ["/api/themes/active?scope=site_full"],
    staleTime: 60000,
    refetchInterval: 60000,
  });

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove("light", "dark");
    root.classList.add(theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  useEffect(() => {
    if (!appTheme) return;

    const root = document.documentElement;

    if (appTheme.tokens?.colors) {
      Object.entries(appTheme.tokens.colors).forEach(([key, value]) => {
        root.style.setProperty(`--theme-${key}`, value);
      });
    }

    if (appTheme.tokens?.fonts) {
      Object.entries(appTheme.tokens.fonts).forEach(([key, value]) => {
        root.style.setProperty(`--theme-font-${key}`, value);
      });
    }

    if (appTheme.tokens?.spacing) {
      Object.entries(appTheme.tokens.spacing).forEach(([key, value]) => {
        root.style.setProperty(`--theme-space-${key}`, value);
      });
    }

    if (appTheme.tokens?.borderRadius) {
      Object.entries(appTheme.tokens.borderRadius).forEach(([key, value]) => {
        root.style.setProperty(`--theme-radius-${key}`, value);
      });
    }

    if (appTheme.assets?.favicon) {
      const favicon = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
      if (favicon) {
        favicon.href = appTheme.assets.favicon;
      }
    }
  }, [appTheme]);

  return (
    <ThemeProviderContext.Provider value={{ theme, setTheme, appTheme: appTheme || null, isLoadingAppTheme }}>
      {children}
    </ThemeProviderContext.Provider>
  );
}

export const useTheme = () => {
  const context = useContext(ThemeProviderContext);
  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return context;
};
