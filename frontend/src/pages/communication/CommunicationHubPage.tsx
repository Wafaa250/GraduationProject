import { useCallback, useEffect, useMemo, useState } from "react";
import "@/styles/communication-hub.css";
import { Loader2 } from "lucide-react";
import { getCommunicationFeed, type FeedResponse } from "@/api/feedApi";
import type { FeedItem } from "@/lib/feedTypes";
import { FeedRightSidebar } from "@/components/communication/FeedRightSidebar";
import { FeedPostCard } from "@/components/communication/FeedPostCard";
import { FeedEmptyState } from "@/components/communication/FeedEmptyState";

export default function CommunicationHubPage() {
  const [feed, setFeed] = useState<FeedResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);

  const loadFeed = useCallback(async () => {
    setLoading(true);
    setLoadFailed(false);
    try {
      const data = await getCommunicationFeed();
      setFeed(data);
    } catch (err) {
      console.error("Communication Hub feed failed to load", err);
      setFeed(null);
      setLoadFailed(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadFeed();
  }, [loadFeed]);

  const orderedItems = useMemo((): FeedItem[] => feed?.items ?? [], [feed?.items]);

  return (
    <div className="communication-hub student-hub">
      <div className="communication-hub__page">
        <header className="communication-hub__page-header">
          <h1 className="communication-hub__title font-display">Communication Hub</h1>
          <p className="communication-hub__subtitle">
            Updates from companies, student associations, and your academic network.
          </p>
        </header>

        <div className="communication-hub__layout">
          <main className="communication-hub__main">
            <div className="communication-hub__feed-stack">
              {loading ? (
                <div className="hub-card communication-hub__feed-loading">
                  <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
                  Loading feed...
                </div>
              ) : loadFailed ? (
                <FeedEmptyState
                  title="No activity available yet."
                  description="We couldn't refresh the activity stream right now. Please try again in a moment."
                />
              ) : orderedItems.length === 0 ? (
                <FeedEmptyState
                  title="No activity available yet."
                  description="New opportunities, events, projects, and collaboration requests will appear here."
                />
              ) : (
                orderedItems.map((item) => <FeedPostCard key={item.id} item={item} />)
              )}
            </div>
          </main>

          <FeedRightSidebar
            suggestions={
              feed?.suggestions ?? {
                suggestedCompanies: [],
                suggestedAssociations: [],
                discoverMembers: [],
                trendingOpportunities: [],
              }
            }
            onFollowChange={() => void loadFeed()}
          />
        </div>
      </div>
    </div>
  );
}
