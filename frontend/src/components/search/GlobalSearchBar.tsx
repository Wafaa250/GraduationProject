import { useCallback, useEffect, useId, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Building2, Loader2, Search, Stethoscope, UserRound, Users } from "lucide-react";
import { cn } from "@/components/ui/utils";
import {
  followCompany,
  followOrganization,
  searchCommunicationHub,
  unfollowCompany,
  unfollowOrganization,
  type CommunicationHubSearchResults,
  type FeedSearchResultRow,
} from "@/api/feedApi";
import { parseApiErrorMessage } from "@/api/axiosInstance";
import { toast } from "@/hooks/use-toast";
import { SearchResultRow } from "@/components/search/SearchResultRow";
import { searchResultProfilePath } from "@/lib/feedDiscoverNavigation";
import "@/styles/global-search.css";

const DEBOUNCE_MS = 300;

type SearchGroup = {
  key: keyof CommunicationHubSearchResults;
  label: string;
  icon: typeof UserRound;
};

const GROUPS: SearchGroup[] = [
  { key: "students", label: "Students", icon: UserRound },
  { key: "doctors", label: "Doctors", icon: Stethoscope },
  { key: "companies", label: "Companies", icon: Building2 },
  { key: "associations", label: "Associations", icon: Users },
];

function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = window.setTimeout(() => setDebounced(value), delayMs);
    return () => window.clearTimeout(t);
  }, [value, delayMs]);
  return debounced;
}

type Props = {
  variant?: "default" | "header";
};

export function GlobalSearchBar({ variant = "header" }: Props) {
  const navigate = useNavigate();
  const listboxId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const [value, setValue] = useState("");
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<CommunicationHubSearchResults | null>(null);
  const [followBusyId, setFollowBusyId] = useState<string | null>(null);
  const searchGenerationRef = useRef(0);

  const debounced = useDebouncedValue(value, DEBOUNCE_MS);
  const isHeader = variant === "header";
  const trimmed = debounced.trim();
  const hasQuery = trimmed.length > 0;

  const runSearch = useCallback(async (term: string) => {
    if (!term) {
      setResults(null);
      setLoading(false);
      return;
    }
    const generation = ++searchGenerationRef.current;
    setLoading(true);
    try {
      const data = await searchCommunicationHub(term);
      if (generation !== searchGenerationRef.current) return;
      setResults(data);
    } catch (err) {
      if (generation !== searchGenerationRef.current) return;
      console.error("Communication Hub search failed", err);
      setResults(null);
    } finally {
      if (generation === searchGenerationRef.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!trimmed) {
      setResults(null);
      setLoading(false);
      return;
    }
    setResults(null);
    void runSearch(trimmed);
  }, [trimmed, runSearch]);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const showDropdown = open && hasQuery;
  const totalHits = results
    ? GROUPS.reduce((sum, g) => sum + (results[g.key]?.length ?? 0), 0)
    : 0;
  const showEmptyState = hasQuery && !loading && results !== null && totalHits === 0;

  const handleSelect = (hit: FeedSearchResultRow) => {
    const type = hit.entityType.toLowerCase();
    if (hit.followable && (type === "company" || type === "association")) return;

    const path = searchResultProfilePath(hit);
    setOpen(false);
    setValue("");
    setResults(null);
    navigate(path);
  };

  const updateFollowState = (
    bucket: "companies" | "associations",
    entityId: number,
    isFollowing: boolean,
  ) => {
    setResults((prev) => {
      if (!prev) return prev;
      const list = prev[bucket].map((row) =>
        row.entityId === entityId ? { ...row, isFollowing } : row,
      );
      return { ...prev, [bucket]: list };
    });
  };

  const handleFollow = async (hit: FeedSearchResultRow) => {
    const type = hit.entityType.toLowerCase();
    const busyKey = `${type}-${hit.entityId}`;
    const following = hit.isFollowing === true;
    setFollowBusyId(busyKey);
    try {
      if (type === "company") {
        if (following) await unfollowCompany(hit.entityId);
        else await followCompany(hit.entityId);
        updateFollowState("companies", hit.entityId, !following);
        toast({ title: following ? "Unfollowed company" : "Now following company" });
      } else if (type === "association") {
        if (following) await unfollowOrganization(hit.entityId);
        else await followOrganization(hit.entityId);
        updateFollowState("associations", hit.entityId, !following);
        toast({ title: following ? "Unfollowed association" : "Now following association" });
      }
    } catch (err) {
      toast({
        title: "Could not update follow",
        description: parseApiErrorMessage(err),
        variant: "destructive",
      });
    } finally {
      setFollowBusyId(null);
    }
  };

  return (
    <div
      ref={rootRef}
      className={cn(
        "global-search communication-hub__search-wrap",
        isHeader && "global-search--header student-sidebar-layout__header-search",
      )}
    >
      <label
        className={cn(
          "global-search__field",
          isHeader && "communication-hub__search communication-hub__search--header",
        )}
      >
        <Search className="communication-hub__search-icon global-search__icon" aria-hidden />
        <input
          type="search"
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            setOpen(true);
          }}
          onFocus={() => {
            if (value.trim()) setOpen(true);
          }}
          placeholder="Search…"
          aria-label="Search students, doctors, companies, and associations"
          aria-expanded={showDropdown}
          aria-controls={showDropdown ? listboxId : undefined}
          aria-autocomplete="list"
          role="combobox"
        />
        {loading ? (
          <Loader2 className="global-search__spinner h-4 w-4 animate-spin" aria-hidden />
        ) : null}
      </label>

      {showDropdown ? (
        <div id={listboxId} className="global-search__dropdown" role="listbox">
          {loading && !results ? (
            <p className="global-search__status">Searching…</p>
          ) : showEmptyState ? (
            <p className="global-search__status">No results found.</p>
          ) : (
            GROUPS.map((group) => {
              const hits = results?.[group.key] ?? [];
              if (hits.length === 0) return null;
              const Icon = group.icon;
              return (
                <section key={group.key} className="global-search__group">
                  <h3 className="global-search__group-title">
                    <Icon className="h-3.5 w-3.5" aria-hidden />
                    {group.label} ({hits.length})
                  </h3>
                  {hits.map((hit) => {
                    const busyKey = `${hit.entityType}-${hit.entityId}-${hit.userId ?? 0}`;
                    return (
                      <SearchResultRow
                        key={`${group.key}-${hit.entityType}-${hit.entityId}-${hit.userId ?? 0}`}
                        hit={hit}
                        groupKey={group.key}
                        onSelect={() => handleSelect(hit)}
                        onFollow={() => void handleFollow(hit)}
                        followBusy={followBusyId === busyKey}
                      />
                    );
                  })}
                </section>
              );
            })
          )}
        </div>
      ) : null}
    </div>
  );
}
