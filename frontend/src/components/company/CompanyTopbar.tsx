import { useNavigate } from "react-router-dom";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { CompanyNotificationBell } from "@/components/company/CompanyNotificationBell";
import { ROUTES } from "@/routes/paths";

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
        <p className="text-[11px] text-muted-foreground">AI talent discovery workspace</p>
      </div>

      <div className="flex-1" />

      <CompanyNotificationBell />

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
