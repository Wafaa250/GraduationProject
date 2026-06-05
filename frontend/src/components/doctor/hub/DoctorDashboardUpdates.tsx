import { useCallback, useEffect, useMemo, useState } from "react";
import { ChevronDown, Loader2 } from "lucide-react";
import { getDoctorPostsFeed, type DoctorPost } from "@/api/doctorPostsApi";
import { parseApiErrorMessage } from "@/api/axiosInstance";
import { FeedSocialPostOwnerMenu } from "@/components/communication/FeedSocialPostOwnerMenu";
import { toast } from "@/hooks/use-toast";
import {
  doctorPostToFeedItem,
  getCurrentUserId,
} from "@/lib/studentPostFeed";
import { FEED_SOURCE_TYPES, type FeedItem } from "@/lib/feedTypes";
import { cn } from "@/lib/utils";
import "@/styles/communication-hub.css";
import "@/styles/doctor-announcements.css";

type Props = {
  refreshKey: number;
};

function formatAnnouncementDateTime(iso: string): string {
  try {
    const d = new Date(iso);
    const date = d.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
    const time = d.toLocaleTimeString(undefined, {
      hour: "numeric",
      minute: "2-digit",
    });
    return `${date} • ${time}`;
  } catch {
    return "";
  }
}

export function DoctorDashboardUpdates({ refreshKey }: Props) {
  const [posts, setPosts] = useState<DoctorPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);

  const loadPosts = useCallback(async () => {
    setLoading(true);
    try {
      const items = await getDoctorPostsFeed(40);
      const userId = getCurrentUserId();
      setPosts(items.filter((p) => p.userId === userId));
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Could not load announcements",
        description: parseApiErrorMessage(err),
      });
      setPosts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadPosts();
  }, [loadPosts, refreshKey]);

  const feedItems = useMemo(
    () => posts.map((post) => doctorPostToFeedItem(post)),
    [posts],
  );

  const handleUpdated = (updated: DoctorPost) => {
    setPosts((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
  };

  const handleDeleted = (postId: number) => {
    setPosts((prev) => prev.filter((p) => p.id !== postId));
  };

  return (
    <section className="doctor-my-announcements" aria-label="My announcements">
      <button
        type="button"
        className="doctor-my-announcements__toggle"
        onClick={() => setExpanded((open) => !open)}
        aria-expanded={expanded}
      >
        <span className="doctor-my-announcements__title">My Announcements</span>
        <ChevronDown
          className={cn(
            "doctor-my-announcements__chevron",
            expanded && "doctor-my-announcements__chevron--open",
          )}
          aria-hidden
        />
      </button>

      {expanded ? (
        <div className="doctor-my-announcements__panel">
          {loading ? (
            <div className="doctor-my-announcements__loading" aria-busy="true">
              <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
              Loading…
            </div>
          ) : feedItems.length === 0 ? (
            <>
              <p className="doctor-my-announcements__empty-text">No announcements yet.</p>
              <p className="doctor-my-announcements__empty-hint">
                Click <span className="doctor-my-announcements__empty-plus">+</span> to share your
                first update.
              </p>
            </>
          ) : (
            <ul className="doctor-my-announcements__cards">
              {feedItems.map((item) => (
                <DoctorAnnouncementCard
                  key={item.id}
                  item={item}
                  onUpdated={handleUpdated}
                  onDeleted={handleDeleted}
                />
              ))}
            </ul>
          )}
        </div>
      ) : null}
    </section>
  );
}

function DoctorAnnouncementCard({
  item,
  onUpdated,
  onDeleted,
}: {
  item: FeedItem;
  onUpdated: (post: DoctorPost) => void;
  onDeleted: (postId: number) => void;
}) {
  const published = formatAnnouncementDateTime(item.createdAt);

  return (
    <li className="doctor-my-announcements__card">
      {item.description ? (
        <p className="doctor-my-announcements__card-content">{item.description}</p>
      ) : (
        <p className="doctor-my-announcements__card-content doctor-my-announcements__card-content--empty">
          Untitled announcement
        </p>
      )}

      <div className="doctor-my-announcements__card-footer">
        {published ? (
          <time className="doctor-my-announcements__card-date" dateTime={item.createdAt}>
            {published}
          </time>
        ) : (
          <span className="doctor-my-announcements__card-date" aria-hidden />
        )}

        <FeedSocialPostOwnerMenu
          item={item}
          editLabel="Edit"
          deleteLabel="Delete"
          onUpdated={(post) => {
            if ("userId" in post && item.relatedEntityType === FEED_SOURCE_TYPES.doctorPost) {
              onUpdated(post as DoctorPost);
            }
          }}
          onDeleted={onDeleted}
        />
      </div>
    </li>
  );
}
