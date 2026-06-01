import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/context/ThemeContext";
import { cn } from "@/lib/utils";

type ThemeToggleProps = {
  className?: string;
  /** `fixed` = floating corner; `inline` = sits in layout (e.g. landing footer). */
  placement?: "fixed" | "inline";
};

export function ThemeToggle({ className, placement = "fixed" }: ThemeToggleProps) {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      title={isDark ? "Light mode" : "Dark mode"}
      className={cn(
        "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border/60 bg-card/50 text-muted-foreground shadow-sm backdrop-blur-sm transition-colors hover:bg-card hover:text-foreground",
        placement === "fixed" &&
          "fixed bottom-5 right-5 z-[100] h-10 w-10 rounded-full border-border bg-card/80 text-foreground shadow-card",
        className,
      )}
    >
      {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </button>
  );
}
