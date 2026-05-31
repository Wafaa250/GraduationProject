import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { LogOut, Settings, User } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { COMPANY_ROUTES, ROUTES } from "@/routes/paths";
import { cn } from "@/lib/utils";

function signOut(navigate: ReturnType<typeof useNavigate>) {
  localStorage.removeItem("token");
  localStorage.removeItem("userId");
  localStorage.removeItem("role");
  localStorage.removeItem("name");
  localStorage.removeItem("email");
  navigate(ROUTES.login, { replace: true });
}

export function CompanyProfileMenu() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  const companyName = localStorage.getItem("name") ?? "Company";
  const email = localStorage.getItem("email") ?? "";
  const initials = companyName
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  useEffect(() => {
    if (!open) return;
    const onPointer = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onPointer);
    window.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const close = () => setOpen(false);

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        className={cn(
          "rounded-full outline-none transition-opacity",
          "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
          open && "ring-2 ring-ring/30 ring-offset-2",
        )}
        aria-label="Open profile menu"
        aria-expanded={open}
        aria-haspopup="menu"
        onClick={() => setOpen((v) => !v)}
      >
        <Avatar className="h-9 w-9">
          <AvatarFallback className="cw-avatar-gradient text-xs">{initials}</AvatarFallback>
        </Avatar>
      </button>

      {open && (
        <div
          role="menu"
          className="cw-profile-menu absolute right-0 top-full z-50 mt-2 w-56 overflow-hidden rounded-xl border bg-popover text-popover-foreground shadow-lg"
        >
          <div className="border-b px-3 py-2.5">
            <p className="truncate text-sm font-medium">{companyName}</p>
            {email ? (
              <p className="truncate text-xs text-muted-foreground">{email}</p>
            ) : null}
          </div>

          <div className="py-1">
            <Link
              role="menuitem"
              to={COMPANY_ROUTES.profile}
              className="cw-profile-menu-item"
              onClick={close}
            >
              <User className="h-4 w-4 text-muted-foreground" aria-hidden />
              My Profile
            </Link>
            <Link
              role="menuitem"
              to={COMPANY_ROUTES.settings}
              className="cw-profile-menu-item"
              onClick={close}
            >
              <Settings className="h-4 w-4 text-muted-foreground" aria-hidden />
              Settings
            </Link>
          </div>

          <div className="border-t py-1">
            <button
              type="button"
              role="menuitem"
              className="cw-profile-menu-item cw-profile-menu-item--destructive w-full"
              onClick={() => {
                close();
                signOut(navigate);
              }}
            >
              <LogOut className="h-4 w-4" aria-hidden />
              Logout
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export function companySignOut(navigate: ReturnType<typeof useNavigate>) {
  signOut(navigate);
}
