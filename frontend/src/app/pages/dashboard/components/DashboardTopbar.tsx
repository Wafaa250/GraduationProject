import { RefObject, ReactNode } from "react";
import { Link } from "react-router-dom";
import { Search, Sparkles } from "lucide-react";

type DashboardTopbarProps = {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  onSearchKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  globalSearchWrapRef: RefObject<HTMLDivElement | null>;
  searchDropdown?: ReactNode;
  navActions: ReactNode;
  userName?: string;
  userMajor?: string;
  profileAvatar: ReactNode;
};

export function DashboardTopbar({
  searchQuery,
  onSearchChange,
  onSearchKeyDown,
  globalSearchWrapRef,
  searchDropdown,
  navActions,
  userName,
  userMajor,
  profileAvatar,
}: DashboardTopbarProps) {
  const showDropdown = searchQuery.trim() !== "" && searchDropdown != null;

  return (
    <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-xl border-b border-border">
      <div className="flex items-center gap-4 px-6 lg:px-10 h-16">
        <div className="lg:hidden flex items-center gap-2">
          <div className="size-8 rounded-lg bg-gradient-primary grid place-items-center">
            <Sparkles className="size-4 text-primary-foreground" />
          </div>
          <span className="font-display font-bold text-foreground">SkillSwap</span>
        </div>

        <div className="flex-1 max-w-xl mx-auto relative" ref={globalSearchWrapRef}>
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
          <input
            type="text"
            placeholder="Search projects, teammates, supervisors…"
            className="w-full pl-10 pr-4 h-10 rounded-xl bg-muted/60 border border-transparent focus:border-primary/40 focus:bg-card focus:outline-none focus:ring-4 text-sm transition-all text-foreground"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            onKeyDown={onSearchKeyDown}
          />
          {showDropdown ? <div className="sd-search-dropdown">{searchDropdown}</div> : null}
        </div>

        <div className="flex items-center gap-2">{navActions}</div>

        <Link
          to="/profile"
          className="ml-2 flex items-center gap-2.5 pl-3 border-l border-border no-underline"
        >
          <div className="size-9 rounded-full overflow-hidden bg-gradient-primary grid place-items-center text-primary-foreground font-semibold text-sm shadow-sm shrink-0">
            {profileAvatar}
          </div>
          <div className="hidden md:block">
            <div className="text-sm font-semibold leading-tight text-foreground">
              {userName || "Student"}
            </div>
            <div className="text-[11px] text-muted-foreground">{userMajor || "—"}</div>
          </div>
        </Link>
      </div>
    </header>
  );
}
