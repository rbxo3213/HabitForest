"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

type Theme = "minimal" | "pixel" | "animal-crossing" | "terraria";

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: "minimal",
  setTheme: () => {},
});

export const useTheme = () => useContext(ThemeContext);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("minimal");
  const [mounted, setMounted] = useState(false);

  const applyThemeClass = (newTheme: Theme) => {
    document.documentElement.classList.remove("theme-pixel", "theme-animal-crossing", "theme-terraria");
    if (newTheme !== "minimal") {
      document.documentElement.classList.add(`theme-${newTheme}`);
    }
  };

  useEffect(() => {
    // Load saved theme on mount
    const savedTheme = localStorage.getItem("habit-village-theme") as Theme;
    if (savedTheme) {
      setThemeState(savedTheme);
      applyThemeClass(savedTheme);
    }
    setMounted(true);
  }, []);

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    localStorage.setItem("habit-village-theme", newTheme);
    applyThemeClass(newTheme);
  };

  // Prevent hydration mismatch
  if (!mounted) return <div className="hidden">{children}</div>;

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}
