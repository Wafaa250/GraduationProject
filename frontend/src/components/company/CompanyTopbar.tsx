import { Link, useNavigate } from "react-router-dom";
import { Bell, Search, Sparkles, LogOut } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { COMPANY_ROUTES, ROUTES } from "@/routes/paths";

export function CompanyTopbar() {
  const navigate = useNavigate();
  const companyName = localStorage.getItem("name") ?? "Company";
  const initials = companyName
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const signOut = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userId");
    localStorage.removeItem("role");
    localStorage.removeItem("name");
    localStorage.removeItem("email");
    navigate(ROUTES.login, { replace: true });
  };

  return (
    <header className="sticky top-0 z-30 h-16 border-b bg-background/80 backdrop-blur-xl flex items-center gap-3 px-4 md:px-6">
      <div className="hidden sm:block min-w-0">
        <h1 className="text-sm font-semibold truncate">{companyName} · Workspace</h1>
        <p className="text-[11px] text-muted-foreground">AI-powered collaboration matching</p>
      </div>

      <div className="flex-1 max-w-xl mx-auto relative hidden md:block">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search students, teams, skills…"
          className="pl-9 h-10 rounded-xl bg-secondary/60 border-transparent"
        />
      </div>

      <Button
        asChild
        size="sm"
        className="hidden lg:inline-flex cw-btn-gradient rounded-xl"
      >
        <Link to={COMPANY_ROUTES.newRequest}>
          <Sparkles className="h-4 w-4" /> Ask SkillSwap AI
        </Link>
      </Button>

      <Button variant="ghost" size="icon" className="rounded-xl shrink-0" aria-label="Notifications">
        <Bell className="h-4 w-4" />
      </Button>

      <div className="flex items-center gap-2 shrink-0">
        <Avatar className="h-9 w-9">
          <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-white text-xs">
            {initials}
          </AvatarFallback>
        </Avatar>
        <Button variant="ghost" size="icon" className="rounded-xl" onClick={signOut} aria-label="Sign out">
          <LogOut className="h-4 w-4" />
        </Button>
      </div>
    </header>
  );
}
