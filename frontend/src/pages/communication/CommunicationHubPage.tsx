import { useCallback, useEffect, useMemo, useState } from "react";

import "@/styles/communication-hub.css";

import { Loader2 } from "lucide-react";

import { getCommunicationFeed, type FeedResponse } from "@/api/feedApi";

import type { DoctorPost } from "@/api/doctorPostsApi";
import type { StudentPost } from "@/api/studentPostsApi";
import type { FeedItem } from "@/lib/feedTypes";
import { doctorPostToFeedItem, studentPostToFeedItem } from "@/lib/studentPostFeed";
import { FEED_SOURCE_TYPES } from "@/lib/feedTypes";

import { FeedRightSidebar } from "@/components/communication/FeedRightSidebar";
import { FeedStudentPostComposer } from "@/components/communication/FeedStudentPostComposer";
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
  const isStudent = (localStorage.getItem("role") ?? "").toLowerCase() === "student";

  const handleSocialPostUpdated = useCallback((post: StudentPost | DoctorPost) => {
    setFeed((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        items: prev.items.map((entry) => {
          if (entry.relatedEntityId !== post.id) return entry;
          if (entry.relatedEntityType === FEED_SOURCE_TYPES.doctorPost) {
            return doctorPostToFeedItem(post as DoctorPost, entry);
          }
          if (entry.relatedEntityType === FEED_SOURCE_TYPES.studentPost) {
            return studentPostToFeedItem(post as StudentPost, entry);
          }
          return entry;
        }),
      };
    });
  }, []);

  const handleSocialPostDeleted = useCallback((postId: number) => {
    setFeed((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        items: prev.items.filter(
          (entry) =>
            !(
              (entry.relatedEntityType === FEED_SOURCE_TYPES.studentPost ||
                entry.relatedEntityType === FEED_SOURCE_TYPES.doctorPost) &&
              entry.relatedEntityId === postId
            ),
        ),
      };
    });
  }, []);

  return (

    <div className="communication-hub student-hub">

      <div className="communication-hub__page">

        <header className="communication-hub__page-header">

          <h1 className="communication-hub__title font-display">Communication Hub</h1>
        </header>



        <div className="communication-hub__layout">

          <main className="communication-hub__main">

            <div className="communication-hub__feed-stack">
              {isStudent ? <FeedStudentPostComposer onPosted={() => void loadFeed()} /> : null}

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

                  description="Posts from students and faculty, plus association events and recruitment updates will appear here."

                />

              ) : (

                orderedItems.map((item) => (
                  <FeedPostCard
                    key={item.id}
                    item={item}
                    onSocialPostUpdated={handleSocialPostUpdated}
                    onSocialPostDeleted={handleSocialPostDeleted}
                  />
                ))

              )}

            </div>

          </main>



          <FeedRightSidebar />

        </div>

      </div>

    </div>

  );

}

