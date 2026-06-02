import { useCallback, useEffect, useId, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Briefcase,
  Building2,
  Calendar,
  Clock,
  FolderKanban,
  GraduationCap,
  Loader2,
  Megaphone,
  Search,
  Stethoscope,
  UserRound,
  Users,
} from "lucide-react";
import { cn } from "@/components/ui/utils";
import {
  fetchSearchSuggestions,
  globalSearch,
  type GlobalSearchResponse,
  type SearchHit,
  type SearchSuggestionsResponse,
} from "@/api/searchApi";
import { ROUTES } from "@/routes/paths";
import { addRecentSearch, getRecentSearches } from "@/lib/searchRecent";
import { SearchResultRow } from "@/components/search/SearchResultRow";
import "@/styles/global-search.css";

const DEBOUNCE_MS = 300;
const RESULTS_LIMIT = 5;

type SearchGroup = {
  key: keyof GlobalSearchResponse;
  label: string;
  icon: typeof UserRound;
};

const GROUPS: SearchGroup[] = [
  { key: "students", label: "Students", icon: UserRound },
  { key: "doctors", label: "Doctors", icon: Stethoscope },
  { key: "companies", label: "Companies", icon: Building2 },
  { key: "associations", label: "Associations", icon: Users },
  { key: "projects", label: "Projects", icon: GraduationCap },
  { key: "projectRequests", label: "Project requests", icon: Briefcase },
  { key: "recruitmentCampaigns", label: "Recruitment", icon: Megaphone },
  { key: "events", label: "Events", icon: Calendar },
  { key: "opportunities", label: "Opportunities", icon: FolderKanban },
];

const EMPTY_RESULTS: GlobalSearchResponse = {
  students: [],
  doctors: [],
  companies: [],
  associations: [],
  projects: [],
  projectRequests: [],
  recruitmentCampaigns: [],
  events: [],
  opportunities: [],
};

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
  const [results, setResults] = useState<GlobalSearchResponse | null>(null);
  const [suggestions, setSuggestions] = useState<SearchSuggestionsResponse | null>(null);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>(() => getRecentSearches());

  const debounced = useDebouncedValue(value, DEBOUNCE_MS);
  const isHeader = variant === "header";
  const trimmed = debounced.trim();
  const hasQuery = value.trim().length > 0;

  const loadSuggestions = useCallback(async () => {
    setSuggestionsLoading(true);
    try {
      const data = await fetchSearchSuggestions(RESULTS_LIMIT);
      setSuggestions(data);
    } catch (err) {
      console.error("Search suggestions failed", err);
      setSuggestions({ students: [], companies: [], associations: [] });
    } finally {
      setSuggestionsLoading(false);
    }
  }, []);

  const runSearch = useCallback(async (term: string) => {
    if (!term) {
      setResults(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const data = await globalSearch(term, RESULTS_LIMIT);
      setResults(data);
    } catch (err) {
      console.error("Global search failed", err);
      setResults({ ...EMPTY_RESULTS });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!trimmed) {
      setResults(null);
      setLoading(false);
      return;
    }
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

  useEffect(() => {
    if (open && !hasQuery && !suggestions && !suggestionsLoading) {
      void loadSuggestions();
    }
  }, [open, hasQuery, suggestions, suggestionsLoading, loadSuggestions]);

  const showDropdown = open;
  const showEmptyPanel = !hasQuery;
  const totalHits = results
    ? GROUPS.reduce((sum, g) => sum + (results[g.key]?.length ?? 0), 0)
    : 0;

  const refreshRecent = () => setRecentSearches(getRecentSearches());

  const goToFullResults = (term: string) => {
    const q = term.trim();
    if (!q) return;
    addRecentSearch(q);
    refreshRecent();
    setOpen(false);
    navigate(`${ROUTES.globalSearch}?q=${encodeURIComponent(q)}`);
  };

  const handleSelect = (hit: SearchHit, queryForRecent?: string) => {
    const recentLabel = queryForRecent?.trim() || hit.title.trim();
    if (recentLabel) {
      addRecentSearch(recentLabel);
      refreshRecent();
    }
    setOpen(false);
    setValue("");
    setResults(null);
    if (hit.url) navigate(hit.url);
  };

  const handleRecentClick = (term: string) => {
    setValue(term);
    setOpen(true);
  };

  const suggestionSections = [
    { key: "students" as const, label: "Suggested Students", hits: suggestions?.students ?? [] },
    { key: "companies" as const, label: "Suggested Companies", hits: suggestions?.companies ?? [] },
    {
      key: "associations" as const,
      label: "Suggested Associations",
      hits: suggestions?.associations ?? [],
    },
  ];

  const hasSuggestionContent = suggestionSections.some((s) => s.hits.length > 0);
  const showEmptyState =
    hasQuery && !loading && results !== null && totalHits === 0;

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
            setOpen(true);
            setRecentSearches(getRecentSearches());
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" && value.trim()) {
              e.preventDefault();
              goToFullResults(value);
            }
          }}
          placeholder="Search SkillSwap…"
          aria-label="Search students, doctors, companies, projects, and more"
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
          {showEmptyPanel ? (
            <>
              {recentSearches.length > 0 ? (
                <section className="global-search__group global-search__group--flat">
                  <h3 className="global-search__group-title">
                    <Clock className="h-3.5 w-3.5" aria-hidden />
                    Recent Searches
                  </h3>
                  {recentSearches.map((term) => (
                    <button
                      key={term}
                      type="button"
                      className="global-search__recent"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => handleRecentClick(term)}
                    >
                      {term}
                    </button>
                  ))}
                </section>
              ) : null}

              {suggestionsLoading && !hasSuggestionContent ? (
                <p className="global-search__status">Loading suggestions…</p>
              ) : (
                suggestionSections.map((section) => {
                  if (section.hits.length === 0) return null;
                  const Icon =
                    section.key === "students"
                      ? UserRound
                      : section.key === "companies"
                        ? Building2
                        : Users;
                  return (
                    <section key={section.key} className="global-search__group">
                      <h3 className="global-search__group-title">
                        <Icon className="h-3.5 w-3.5" aria-hidden />
                        {section.label}
                      </h3>
                      {section.hits.map((hit) => (
                        <SearchResultRow
                          key={`${section.key}-${hit.id}`}
                          hit={hit}
                          groupKey={section.key}
                          onSelect={() => handleSelect(hit)}
                        />
                      ))}
                    </section>
                  );
                })
              )}
            </>
          ) : loading && !results ? (
            <p className="global-search__status">Searching…</p>
          ) : showEmptyState ? (
            <p className="global-search__status">No results found.</p>
          ) : (
            <>
              {GROUPS.map((group) => {
                const hits = results?.[group.key] ?? [];
                if (hits.length === 0) return null;
                const Icon = group.icon;
                return (
                  <section key={group.key} className="global-search__group">
                    <h3 className="global-search__group-title">
                      <Icon className="h-3.5 w-3.5" aria-hidden />
                      {group.label}
                    </h3>
                    {hits.map((hit) => (
                      <SearchResultRow
                        key={`${group.key}-${hit.id}`}
                        hit={hit}
                        groupKey={group.key}
                        onSelect={() => handleSelect(hit, trimmed)}
                      />
                    ))}
                  </section>
                );
              })}
              {totalHits > 0 ? (
                <div className="global-search__footer">
                  <button
                    type="button"
                    className="global-search__view-all"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => goToFullResults(trimmed)}
                  >
                    View All Results
                  </button>
                </div>
              ) : null}
            </>
          )}
        </div>
      ) : null}
    </div>
  );
}
