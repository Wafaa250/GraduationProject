import { Search } from "lucide-react";
import { cn } from "@/components/ui/utils";

const FEED_SEARCH_LABEL =
  "Search students, doctors, companies, and associations by name";

type Props = {
  value: string;
  onChange: (value: string) => void;
  /** @deprecated Use variant="header" in the student top bar instead. */
  compact?: boolean;
  variant?: "default" | "header";
};

export function FeedSearchBar({
  value,
  onChange,
  compact = false,
  variant = compact ? "header" : "default",
}: Props) {
  const isHeader = variant === "header";

  return (
    <div
      className={cn(
        "communication-hub__search-wrap",
        isHeader && "student-sidebar-layout__header-search",
        !isHeader && compact && "communication-hub__search-wrap--compact",
      )}
    >
      <label
        className={cn(
          "communication-hub__search",
          isHeader && "communication-hub__search--header",
          !isHeader && compact && "communication-hub__search--compact",
        )}
      >
        <Search className="communication-hub__search-icon" aria-hidden />
        <input
          type="search"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Search by name…"
          aria-label={FEED_SEARCH_LABEL}
        />
      </label>
    </div>
  );
}
