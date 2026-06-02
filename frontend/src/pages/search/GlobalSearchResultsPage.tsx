import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import {
  Briefcase,
  Building2,
  Calendar,
  FolderKanban,
  GraduationCap,
  Loader2,
  Megaphone,
  Search,
  Stethoscope,
  UserRound,
  Users,
} from "lucide-react";
import { globalSearch, type GlobalSearchResponse } from "@/api/searchApi";
import { SearchResultRow } from "@/components/search/SearchResultRow";
import { ROUTES } from "@/routes/paths";
import { addRecentSearch } from "@/lib/searchRecent";
import "@/styles/global-search.css";

const GROUPS = [
  { key: "students" as const, label: "Students", icon: UserRound },
  { key: "doctors" as const, label: "Doctors", icon: Stethoscope },
  { key: "companies" as const, label: "Companies", icon: Building2 },
  { key: "associations" as const, label: "Associations", icon: Users },
  { key: "projects" as const, label: "Projects", icon: GraduationCap },
  { key: "projectRequests" as const, label: "Project requests", icon: Briefcase },
  { key: "recruitmentCampaigns" as const, label: "Recruitment", icon: Megaphone },
  { key: "events" as const, label: "Events", icon: Calendar },
  { key: "opportunities" as const, label: "Opportunities", icon: FolderKanban },
];

const FULL_LIMIT = 12;

export default function GlobalSearchResultsPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const query = (params.get("q") ?? "").trim();
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<GlobalSearchResponse | null>(null);

  useEffect(() => {
    if (!query) {
      setResults(null);
      return;
    }
    addRecentSearch(query);
    let cancelled = false;
    setLoading(true);
    void globalSearch(query, FULL_LIMIT)
      .then((data) => {
        if (!cancelled) setResults(data);
      })
      .catch((err) => {
        console.error("Search results page failed", err);
        if (!cancelled) {
          setResults({
            students: [],
            doctors: [],
            companies: [],
            associations: [],
            projects: [],
            projectRequests: [],
            recruitmentCampaigns: [],
            events: [],
            opportunities: [],
          });
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [query]);

  const totalHits = results
    ? GROUPS.reduce((sum, g) => sum + (results[g.key]?.length ?? 0), 0)
    : 0;

  return (
    <div className="global-search-page">
      <header className="global-search-page__header">
        <h1 className="global-search-page__title">
          <Search className="h-6 w-6" aria-hidden />
          Search results
        </h1>
        {query ? (
          <p className="global-search-page__query">
            Showing matches for <strong>{query}</strong>
          </p>
        ) : (
          <p className="global-search-page__query">Enter a search term from the header search bar.</p>
        )}
        <Link to={ROUTES.communicationHub} className="global-search-page__back">
          Back to Communication Hub
        </Link>
      </header>

      {!query ? null : loading ? (
        <p className="global-search-page__status">
          <Loader2 className="mr-2 inline h-4 w-4 animate-spin" aria-hidden />
          Searching…
        </p>
      ) : totalHits === 0 ? (
        <p className="global-search-page__status">No results found.</p>
      ) : (
        <div className="global-search-page__groups">
          {GROUPS.map((group) => {
            const hits = results?.[group.key] ?? [];
            if (hits.length === 0) return null;
            const Icon = group.icon;
            return (
              <section key={group.key} className="global-search-page__group hub-card">
                <h2 className="global-search__group-title">
                  <Icon className="h-4 w-4" aria-hidden />
                  {group.label}
                </h2>
                <div className="global-search-page__list">
                  {hits.map((hit) => (
                    <SearchResultRow
                      key={`${group.key}-${hit.id}`}
                      hit={hit}
                      groupKey={group.key}
                      onSelect={() => {
                        if (hit.url) navigate(hit.url);
                      }}
                    />
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
