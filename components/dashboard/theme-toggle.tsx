"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

import { Button } from "@/components/ui/button";

type ThemeToggleProps = {
  collapsed: boolean;
};

export function ThemeToggle({ collapsed }: ThemeToggleProps) {
  const { theme, setTheme } = useTheme();
  const activeTheme = theme === "light" ? "light" : "dark";
  const nextTheme = activeTheme === "dark" ? "light" : "dark";

  return (
    <Button
      variant="outline"
      size={collapsed ? "icon" : "default"}
      onClick={() => setTheme(nextTheme)}
      title={nextTheme === "dark" ? "Zu Dunkel wechseln" : "Zu Hell wechseln"}
      type="button"
    >
      {activeTheme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
      {!collapsed ? <span>{activeTheme === "dark" ? "Hell" : "Dunkel"}</span> : null}
    </Button>
  );
}
