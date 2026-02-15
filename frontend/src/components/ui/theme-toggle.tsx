"use client";

import React, { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";

const THEME_KEY = "datapilot-theme";

export function ThemeToggle() {
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [mounted, setMounted] = useState(false);

  // Mount check to prevent hydration mismatch
  useEffect(() => {
    setMounted(true);
    const storedTheme = localStorage.getItem(THEME_KEY) as "light" | "dark" | null;
    const initialTheme = storedTheme || "light";
    setTheme(initialTheme);

    if (initialTheme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    localStorage.setItem(THEME_KEY, newTheme);

    if (newTheme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  };

  // Don't render until mounted to avoid hydration mismatch
  if (!mounted) {
    return (
      <Button
        variant="ghost"
        size="icon"
        aria-label="Toggle theme"
        className="h-8 w-8 shrink-0"
        disabled
      >
        <Sun className="h-4 w-4" aria-hidden="true" />
      </Button>
    );
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleTheme}
      aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
      className="h-8 w-8 shrink-0 transition-transform duration-200 hover:scale-110"
    >
      {theme === "light" ? (
        <Moon className="h-4 w-4 transition-transform duration-300" aria-hidden="true" />
      ) : (
        <Sun className="h-4 w-4 transition-transform duration-300" aria-hidden="true" />
      )}
    </Button>
  );
}
