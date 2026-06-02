import { useState } from "react";
import { Building2, Sparkles, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ReactNode } from "react";
import {
  followCompany,
  followOrganization,
  unfollowCompany,
  unfollowOrganization,
  type FeedSuggestions,
} from "@/api/feedApi";
import { resolveApiFileUrl } from "@/api/axiosInstance";
import { toast } from "@/hooks/use-toast";
import { parseApiErrorMessage } from "@/api/axiosInstance";
import { FeedEmptyState } from "./FeedEmptyState";

type Props = {
  suggestions: FeedSuggestions;
  search?: ReactNode;
  onFollowChange?: () => void;
};

function formatTrendDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });
  } catch {
    return "";
  }
}

export function FeedRightSidebar({ suggestions, search, onFollowChange }: Props) {
  const [companyBusy, setCompanyBusy] = useState<number | null>(null);
  const [orgBusy, setOrgBusy] = useState<number | null>(null);

  const toggleCompany = async (id: number, following: boolean) => {
    setCompanyBusy(id);
    try {
      if (following) await unfollowCompany(id);
      else await followCompany(id);
      onFollowChange?.();
      toast({
        title: following ? "Unfollowed company" : "Following company",
      });
    } catch (err) {
      toast({
        title: "Action failed",
        description: parseApiErrorMessage(err),
        variant: "destructive",
      });
    } finally {
      setCompanyBusy(null);
    }
  };

  const toggleOrg = async (id: number, following: boolean) => {
    setOrgBusy(id);
    try {
      if (following) await unfollowOrganization(id);
      else await followOrganization(id);
      onFollowChange?.();
      toast({
        title: following ? "Unfollowed association" : "Following association",
      });
    } catch (err) {
      toast({
        title: "Action failed",
        description: parseApiErrorMessage(err),
        variant: "destructive",
      });
    } finally {
      setOrgBusy(null);
    }
  };

  return (
    <aside className="communication-hub__aside-right">
      {search ? <div className="communication-hub__aside-search">{search}</div> : null}
      <div className="hub-card hub-widget">
        <h3 className="hub-widget__title flex items-center gap-2">
          <Building2 className="h-4 w-4" aria-hidden />
          Suggested companies
        </h3>
        {suggestions.suggestedCompanies.length === 0 ? (
          <p className="m-0 text-sm text-muted-foreground">No suggestions right now.</p>
        ) : (
          suggestions.suggestedCompanies.map((c) => (
            <div key={c.companyProfileId} className="hub-suggestion-row">
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-semibold">{c.companyName}</div>
                {c.industry ? (
                  <div className="truncate text-xs text-muted-foreground">{c.industry}</div>
                ) : null}
              </div>
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={companyBusy === c.companyProfileId}
                onClick={() => void toggleCompany(c.companyProfileId, c.isFollowing)}
              >
                {c.isFollowing ? "Following" : "Follow"}
              </Button>
            </div>
          ))
        )}
      </div>

      <div className="hub-card hub-widget">
        <h3 className="hub-widget__title flex items-center gap-2">
          <Users className="h-4 w-4" aria-hidden />
          Suggested associations
        </h3>
        {suggestions.suggestedAssociations.length === 0 ? (
          <p className="m-0 text-sm text-muted-foreground">No associations to suggest.</p>
        ) : (
          suggestions.suggestedAssociations.map((o) => {
            const logo = o.logoUrl ? resolveApiFileUrl(o.logoUrl) ?? o.logoUrl : null;
            return (
              <div key={o.organizationId} className="hub-suggestion-row">
                {logo ? (
                  <img
                    src={logo}
                    alt=""
                    className="h-9 w-9 shrink-0 rounded-lg object-cover"
                  />
                ) : (
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted text-xs font-bold">
                    {o.name.slice(0, 2).toUpperCase()}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-semibold">{o.name}</div>
                  {o.category ? (
                    <div className="truncate text-xs text-muted-foreground">{o.category}</div>
                  ) : null}
                </div>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={orgBusy === o.organizationId}
                  onClick={() => void toggleOrg(o.organizationId, o.isFollowing)}
                >
                  {o.isFollowing ? "Joined" : "Join"}
                </Button>
              </div>
            );
          })
        )}
      </div>

      <div className="hub-card hub-widget">
        <h3 className="hub-widget__title flex items-center gap-2">
          <Sparkles className="h-4 w-4" aria-hidden />
          Trending opportunities
          <span className="hub-live-pill">Live</span>
        </h3>
        {suggestions.trendingOpportunities.length === 0 ? (
          <FeedEmptyState
            title="Nothing trending yet"
            description="New internships, events, and workshops will appear here."
          />
        ) : (
          suggestions.trendingOpportunities.map((t) => (
            <div key={t.postKey} className="hub-suggestion-row flex-col items-stretch">
              <div className="text-sm font-semibold leading-snug">{t.title}</div>
              <div className="text-xs text-muted-foreground">
                {t.authorName} · {t.kind} · {formatTrendDate(t.publishedAt)}
              </div>
              <span className="hub-trending-link">View opportunity →</span>
            </div>
          ))
        )}
      </div>
    </aside>
  );
}
