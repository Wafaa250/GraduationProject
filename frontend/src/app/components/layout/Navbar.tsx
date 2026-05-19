import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

import { SkillSwapLogo } from "../brand/SkillSwapLogo";
import { Button } from "../ui/button";

const NAV_LINKS = [
  { href: "#how-it-works", label: "How it works" },
  { href: "#for-who", label: "Roles" },
  { href: "#features", label: "Features" },
] as const;

export function Navbar() {
  return (
    <header className="sticky top-0 z-50 border-b border-border/60 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        <SkillSwapLogo />

        <nav className="hidden items-center gap-7 text-base font-medium text-muted-foreground md:flex">
          {NAV_LINKS.map((link) => (
            <a key={link.href} href={link.href} className="transition-colors hover:text-foreground">
              {link.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
            <Link to="/login">Sign In</Link>
          </Button>
          <Button asChild size="sm" className="bg-gradient-primary shadow-glow hover:opacity-95">
            <Link to="/register">
              Get Started
              <ArrowRight className="ml-1 h-3.5 w-3.5" />
            </Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
