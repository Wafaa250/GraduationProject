import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { LogOut, Search, Settings } from "lucide-react";
import { SidebarTrigger } from "../../ui/sidebar";
import { Input } from "../../ui/input";
import { Button } from "../../ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../../ui/dropdown-menu";
import { Avatar, AvatarFallback } from "../../ui/avatar";
import api from "../../../../api/axiosInstance";
import { GradProjectNotificationBell } from "../../notifications/GradProjectNotificationBell";
import { normalizeDoctorMe } from "../../../pages/doctor/dashboard/doctorDashboardApiMappers";

type Props = {
  initials: string;
  doctorName?: string;
  doctorSubtitle?: string;
  onLogout: () => void;
};

export function DoctorHubTopbar({ initials, doctorName, doctorSubtitle, onLogout }: Props) {
  const [name, setName] = useState(doctorName ?? "");
  const [subtitle, setSubtitle] = useState(doctorSubtitle ?? "");
  const [q, setQ] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    if (doctorName) setName(doctorName);
    if (doctorSubtitle) setSubtitle(doctorSubtitle);
  }, [doctorName, doctorSubtitle]);

  useEffect(() => {
    if (doctorName) return;
    api
      .get("/me")
      .then(({ data }) => {
        const me = normalizeDoctorMe(data);
        if (me) setName(me.name);
      })
      .catch(() => {
        /* keep props / empty */
      });
  }, [doctorName]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const term = q.trim();
    if (term) navigate(`/students?search=${encodeURIComponent(term)}`);
    else navigate("/students");
  };

  const bellButtonStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: 40,
    height: 40,
    border: "none",
    borderRadius: 12,
    background: "hsl(217 91% 95%)",
    color: "hsl(221 83% 45%)",
    cursor: "pointer",
  };

  return (
    <header className="sticky top-0 z-30 h-14 border-b border-border bg-background/80 backdrop-blur flex items-center gap-3 px-3 md:px-6">
      <SidebarTrigger className="text-primary" />

      <form onSubmit={handleSearch} className="flex-1 max-w-xl relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search students…"
          className="pl-9 bg-secondary/50 border-transparent focus-visible:bg-background h-9"
        />
      </form>

      <GradProjectNotificationBell bellButtonStyle={bellButtonStyle} theme="doctor" />

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            className="flex items-center gap-2 rounded-md p-1 hover:bg-secondary border-0 bg-transparent cursor-pointer"
          >
            <Avatar className="h-8 w-8">
              <AvatarFallback className="bg-accent text-accent-foreground text-xs font-semibold">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="hidden md:block text-left max-w-[140px]">
              <div className="text-sm font-medium leading-tight truncate">{name || "Doctor"}</div>
              {subtitle ? (
                <div className="text-xs text-muted-foreground leading-tight truncate">{subtitle}</div>
              ) : null}
            </div>
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>Signed in as doctor</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <Link to="/doctor/profile" className="flex items-center gap-2 cursor-pointer">
              <Settings className="h-4 w-4" />
              Profile settings
            </Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={onLogout}
            className="text-destructive focus:text-destructive cursor-pointer"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Sign out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="md:hidden text-muted-foreground"
        onClick={onLogout}
        aria-label="Sign out"
      >
        <LogOut className="h-5 w-5" />
      </Button>
    </header>
  );
}
