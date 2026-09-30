"use client";

import { useTheme } from "./ThemeProvider";
import styles from "./ThemeToggle.module.css";

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";
  return (
    <button
      type="button"
      className={styles.toggle}
      onClick={toggleTheme}
      aria-label={isDark ? "Switch to light mode (white background)" : "Switch to dark mode (black background)"}
      title={isDark ? "Light mode" : "Dark mode"}
      data-theme-current={theme}
    >
      {isDark ? "Light" : "Dark"}
    </button>
  );
}
