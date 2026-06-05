import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Loader2, MessageSquare, Sparkles, UserPlus } from "lucide-react";
import type { ReactNode } from "react";
import {
  followCompany,
  followOrganization,
  getFeedRecommended,
  unfollowCompany,
  unfollowOrganization,
  type FeedRecommendedItem,
} from "@/api/feedApi";
import { resolveApiFileUrl, parseApiErrorMessage } from "@/api/axiosInstance";
import { toast } from "@/hooks/use-toast";
import { profilePhotoUrl } from "@/lib/profilePhotoUrl";
import {
  bumpRecommendedRotationTick,
  FEED_RECOMMENDED_ROTATE_MS,
  getStoredRecommendedRotationTick,
  readLastRecommendedIds,
  saveLastRecommendedIds,
} from "@/lib/feedRecommendedRotation";
import {
  recommendedFollowHint,
  sortRecommendedForDisplay,
} from "@/lib/feedRecommendedDisplay";
import { openFeedRecommendedMessage } from "@/lib/feedRecommendedMessage";
import {
  feedRecommendedProfilePath,
  feedRecommendedRoleBadgeLabel,
  feedRecommendedShowsFollow,
  feedRecommendedShowsMessage,
  feedRecommendedShowsViewProfile,
} from "@/lib/feedRecommendedNavigation";

type Props = {
  search?: ReactNode;
};

function RecommendedAvatar({ item }: { item: FeedRecommendedItem }) {
  const fromBase64 = item.avatarBase64 ? profilePhotoUrl(item.avatarBase64) : null;
  const src = fromBase64 ?? (item.avatarUrl ? resolveApiFileUrl(item.avatarUrl) ?? item.avatarUrl : null);

  if (src) {
    return <img src={src} alt="" className="hub-rec-item__avatar" />;
  }

  return (
    <div
      className={`hub-rec-item__avatar hub-rec-item__avatar--fallback hub-rec-item__avatar--${item.type}`}
      aria-hidden
    >
      {item.name.slice(0, 2).toUpperCase()}
    </div>
  );
}

function logRecommendedDebug(
  rotation: number,
  exclude: string[],
  items: FeedRecommendedItem[],
  poolStats: Awaited<ReturnType<typeof getFeedRecommended>>["poolStats"],
  silent: boolean,
): void {
  if (!import.meta.env.DEV) return;

  const byType = items.reduce(
    (acc, i) => {
      acc[i.type] = (acc[i.type] ?? 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );

  const stamp = new Date().toISOString();
  if (silent) {
    console.log("Recommendations refreshed at:", stamp);
  } else {
    console.log("Recommendations loaded at:", stamp);
  }
  console.debug("[Recommended For You] GET /api/feed/recommended", {
    rotation,
    excludeCount: exclude.length,
    exclude,
    poolStats,
    returnedTypes: byType,
    returned: items.map((i) => ({
      id: i.id,
      type: i.type,
      name: i.name,
      matchScore: i.matchScore,
      canMessage: i.canMessage,
      canFollow: i.canFollow,
    })),
  });

  if (poolStats) {
    console.debug(
      `[Recommended pools] Students: ${poolStats.studentsInPool}, Doctors: ${poolStats.doctorsInPool}, Companies: ${poolStats.companiesInPool} (db ${poolStats.companiesInDatabase}), Associations: ${poolStats.associationsInPool} (db ${poolStats.associationsInDatabase})`,
    );
  }

  if (!byType.company && !byType.association && poolStats) {
    if (poolStats.companiesInDatabase === 0 && poolStats.associationsInDatabase === 0) {
      console.warn(
        "[Recommended] No company_profiles or student_association_profiles rows in database.",
      );
    } else if (poolStats.companiesInPool === 0 || poolStats.associationsInPool === 0) {
      console.warn("[Recommended] Org rows exist in DB but pool building returned 0 — check API.");
    } else {
      console.warn("[Recommended] Pools have orgs but selection returned none — rotation/exclude issue.");
    }
  }
}

export function FeedRightSidebar({ search }: Props) {
  const navigate = useNavigate();
  const [items, setItems] = useState<FeedRecommendedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionBusy, setActionBusy] = useState<string | null>(null);
  const isMounted = useRef(true);
  const rotationTickRef = useRef(getStoredRecommendedRotationTick());
  const itemsRef = useRef<FeedRecommendedItem[]>([]);

  const loadRecommended = useCallback(async (opts?: { silent?: boolean }) => {
    if (!opts?.silent) setLoading(true);
    else setRefreshing(true);

    rotationTickRef.current = bumpRecommendedRotationTick(rotationTickRef.current);

    const excludeIds =
      opts?.silent && itemsRef.current.length > 0
        ? itemsRef.current.map((i) => i.id)
        : readLastRecommendedIds();

    try {
      const { items: next, poolStats } = await getFeedRecommended({
        rotation: rotationTickRef.current,
        exclude: excludeIds.length > 0 ? excludeIds : undefined,
      });
      if (!isMounted.current) return;
      const sorted = sortRecommendedForDisplay(next).slice(0, 4);
      itemsRef.current = sorted;
      setItems(sorted);
      saveLastRecommendedIds(sorted.map((i) => i.id));
      logRecommendedDebug(
        rotationTickRef.current,
        excludeIds,
        sorted,
        poolStats,
        !!opts?.silent,
      );
    } catch (err) {
      console.warn("GET /feed/recommended failed", err);
      if (!isMounted.current) return;
      if (!opts?.silent) {
        itemsRef.current = [];
        setItems([]);
      }
    } finally {
      if (!isMounted.current) return;
      if (!opts?.silent) setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    isMounted.current = true;
    void loadRecommended();

    const intervalId = window.setInterval(() => {
      void loadRecommended({ silent: true });
    }, FEED_RECOMMENDED_ROTATE_MS);

    return () => {
      isMounted.current = false;
      window.clearInterval(intervalId);
    };
  }, [loadRecommended]);

  const toggleFollow = async (item: FeedRecommendedItem) => {
    if (!item.canFollow || item.entityId <= 0) return;
    setActionBusy(item.id);

    const wasFollowing = item.isFollowing;
    setItems((prev) =>
      prev.map((row) =>
        row.id === item.id
          ? { ...row, isFollowing: !wasFollowing, isFollowed: !wasFollowing }
          : row,
      ),
    );

    try {
      if (item.type === "company") {
        if (wasFollowing) await unfollowCompany(item.entityId);
        else await followCompany(item.entityId);
      } else if (item.type === "association") {
        if (wasFollowing) await unfollowOrganization(item.entityId);
        else await followOrganization(item.entityId);
      } else {
        return;
      }

      itemsRef.current = itemsRef.current.map((row) =>
        row.id === item.id
          ? { ...row, isFollowing: !wasFollowing, isFollowed: !wasFollowing }
          : row,
      );

      toast({
        title: wasFollowing
          ? item.type === "company"
            ? "Unfollowed company"
            : "Unfollowed association"
          : item.type === "company"
            ? "Now following company"
            : "Now following association",
      });
    } catch (err) {
      setItems((prev) =>
        prev.map((row) =>
          row.id === item.id
            ? { ...row, isFollowing: wasFollowing, isFollowed: wasFollowing }
            : row,
        ),
      );
      toast({
        title: "Could not update follow",
        description: parseApiErrorMessage(err),
        variant: "destructive",
      });
    } finally {
      setActionBusy(null);
    }
  };

  const handleMessage = async (item: FeedRecommendedItem) => {
    const targetUserId = item.userId ?? 0;
    if (!item.canMessage || targetUserId <= 0) return;
    setActionBusy(item.id);
    try {
      await openFeedRecommendedMessage(targetUserId, navigate);
    } catch (err) {
      toast({
        title: "Could not open conversation",
        description: parseApiErrorMessage(err),
        variant: "destructive",
      });
    } finally {
      setActionBusy(null);
    }
  };

  const displayItems = useMemo(() => sortRecommendedForDisplay(items), [items]);

  return (
    <aside className="communication-hub__aside-right">
      {search ? <div className="communication-hub__aside-search">{search}</div> : null}

      <div className="hub-card hub-recommended-card">
        <header className="hub-recommended-card__header">
          <Sparkles className="h-4 w-4 text-primary shrink-0" aria-hidden />
          <h3 className="hub-recommended-card__title">Recommended For You</h3>
        </header>

        {loading ? (
          <div className="hub-recommended-card__loading">
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" aria-hidden />
          </div>
        ) : displayItems.length === 0 ? (
          <p className="hub-recommended-card__empty">No recommendations available yet.</p>
        ) : (
          <ul
            className={`hub-recommended-card__list${refreshing ? " hub-recommended-card__list--refreshing" : ""}`}
            aria-live="polite"
            aria-busy={refreshing}
          >
            {displayItems.map((item) => {
              const profilePath = feedRecommendedProfilePath(item);
              const badgeLabel = feedRecommendedRoleBadgeLabel(item.type);
              const matchLabel = item.matchScore > 0 ? `${item.matchScore}% Match` : null;
              const followHint = recommendedFollowHint(item.type);
              const subtitle = item.subtitle?.trim();
              const showViewProfile = feedRecommendedShowsViewProfile(item);
              const showMessage = feedRecommendedShowsMessage(item);
              const showFollow =
                feedRecommendedShowsFollow(item.type) && item.canFollow && item.entityId > 0;

              return (
                <li
                  key={item.id}
                  className={`hub-rec-item hub-rec-item--${item.type}${item.isFollowing ? " hub-rec-item--following" : ""}`}
                >
                  <RecommendedAvatar item={item} />
                  <div className="hub-rec-item__content">
                    <p className="hub-rec-item__name" title={item.name}>
                      {item.name}
                    </p>

                    <span
                      className={`hub-rec-item__role-badge hub-rec-item__role-badge--${item.type}`}
                    >
                      {badgeLabel}
                    </span>

                    {subtitle && (showViewProfile || showFollow) ? (
                      <p className="hub-rec-item__subtitle" title={subtitle}>
                        {subtitle}
                      </p>
                    ) : null}

                    {matchLabel ? <p className="hub-rec-item__match">{matchLabel}</p> : null}

                    <div className="hub-rec-item__actions">
                      {showViewProfile ? (
                        <Link
                          to={profilePath}
                          state={
                            item.type === "company"
                              ? { companyName: item.name }
                              : undefined
                          }
                          className={`hub-rec-item__btn hub-rec-item__btn--${item.type}`}
                        >
                          View Profile
                        </Link>
                      ) : null}
                      {showMessage ? (
                        <button
                          type="button"
                          className={`hub-rec-item__btn hub-rec-item__btn--message hub-rec-item__btn--${item.type}`}
                          disabled={actionBusy === item.id}
                          onClick={() => void handleMessage(item)}
                        >
                          <MessageSquare className="hub-rec-item__btn-icon" aria-hidden />
                          Message
                        </button>
                      ) : null}
                      {showFollow ? (
                        <button
                          type="button"
                          className={`hub-rec-item__btn hub-rec-item__btn--follow hub-rec-item__btn--${item.type}${
                            item.isFollowing ? " hub-rec-item__btn--following" : ""
                          }`}
                          disabled={actionBusy === item.id}
                          aria-pressed={item.isFollowing}
                          onClick={() => void toggleFollow(item)}
                        >
                          {!item.isFollowing ? (
                            <UserPlus className="hub-rec-item__btn-icon" aria-hidden />
                          ) : null}
                          {item.isFollowing ? "Following" : "Follow"}
                        </button>
                      ) : null}
                    </div>

                    {showFollow && followHint && !item.isFollowing ? (
                      <p className="hub-rec-item__follow-hint">{followHint}</p>
                    ) : null}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </aside>
  );
}
