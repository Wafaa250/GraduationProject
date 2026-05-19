import { Link } from "react-router-dom";
import { Sparkles } from "lucide-react";

import { Button } from "../ui/button";

export function Footer() {
  return (
    <footer className="border-t border-border">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-6 px-6 py-10 sm:flex-row">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-primary text-primary-foreground shadow-glow">
            <Sparkles className="h-4 w-4" />
          </div>
          <div className="text-left">
            <p className="font-display font-bold text-foreground">SkillSwap</p>
            <p className="text-xs text-muted-foreground">AI-powered university matching</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/login"
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            Sign In
          </Link>
          <Button asChild size="sm" className="bg-gradient-primary shadow-glow hover:opacity-95">
            <Link to="/register">Register</Link>
          </Button>
        </div>
      </div>

      <div className="border-t border-border py-6 text-center text-xs text-muted-foreground">
        © 2026 SkillSwap · AI-powered university matching · An-Najah National University
      </div>
    </footer>
  );
}
