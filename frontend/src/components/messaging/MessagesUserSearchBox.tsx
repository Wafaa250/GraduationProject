import { useEffect, useRef, useState } from "react";
import { Loader2, Search } from "lucide-react";
import { searchUsers, type UserSearchResult } from "@/api/usersApi";
import { parseApiErrorMessage } from "@/api/axiosInstance";
import type { ConversationListItem } from "@/api/conversationsApi";
import { profilePhotoUrl } from "@/lib/profilePhotoUrl";
import {
  openOrStartDirectConversation,
  userSearchRoleLabel,
} from "@/lib/messagesUserSearch";
import { initialsFromName } from "@/lib/doctorHubMappers";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";

type MessagesUserSearchBoxProps = {
  variant: "student" | "doctor";
  query: string;
  onQueryChange: (value: string) => void;
  conversations: ConversationListItem[];
  currentUserId: number | null;
  onConversationOpen: (conversationId: number) => void;
  onConversationsRefresh: () => Promise<void>;
};

export function MessagesUserSearchBox({
  variant,
  query,
  onQueryChange,
  conversations,
  currentUserId,
  onConversationOpen,
  onConversationsRefresh,
}: MessagesUserSearchBoxProps) {
  const rootClass = variant === "student" ? "student-messages-search" : "doctor-messages-search";
  const resultsClass =
    variant === "student" ? "student-messages-user-results" : "doctor-messages-user-results";
  const resultItemClass =
    variant === "student"
      ? "student-messages-user-results__item"
      : "doctor-messages-user-results__item";

  const [results, setResults] = useState<UserSearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectingUserId, setSelectingUserId] = useState<number | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const trimmed = query.trim();
  const showUserSearch = trimmed.length >= 2;

  useEffect(() => {
    if (!showUserSearch) {
      setResults([]);
      setSearching(false);
      setDropdownOpen(false);
      return;
    }

    setDropdownOpen(true);
    const handle = window.setTimeout(() => {
      setSearching(true);
      void searchUsers(trimmed)
        .then((rows) => setResults(rows))
        .catch((err) => {
          setResults([]);
          toast({
            variant: "destructive",
            title: "Search failed",
            description: parseApiErrorMessage(err),
          });
        })
        .finally(() => setSearching(false));
    }, 250);

    return () => window.clearTimeout(handle);
  }, [trimmed, showUserSearch]);

  useEffect(() => {
    const onPointerDown = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, []);

  const handleSelectUser = async (user: UserSearchResult) => {
    if (!currentUserId || selectingUserId != null) return;
    setSelectingUserId(user.id);
    try {
      const conversationId = await openOrStartDirectConversation(
        conversations,
        user.id,
        currentUserId,
      );
      await onConversationsRefresh();
      onQueryChange("");
      setDropdownOpen(false);
      onConversationOpen(conversationId);
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Could not open conversation",
        description: parseApiErrorMessage(err),
      });
    } finally {
      setSelectingUserId(null);
    }
  };

  return (
    <div ref={containerRef} className={cn(rootClass, "relative")}>
      <Search
        className={variant === "student" ? "student-messages-search__icon" : "doctor-messages-search__icon"}
        aria-hidden
      />
      <input
        type="search"
        value={query}
        onChange={(e) => onQueryChange(e.target.value)}
        onFocus={() => {
          if (showUserSearch) setDropdownOpen(true);
        }}
        placeholder="Search conversations or people"
        className={
          variant === "student" ? "student-messages-search__input" : "doctor-messages-search__input"
        }
        aria-label="Search conversations or people"
        aria-expanded={showUserSearch && dropdownOpen}
        aria-controls="messages-user-search-results"
        autoComplete="off"
      />

      {showUserSearch && dropdownOpen ? (
        <div
          id="messages-user-search-results"
          className={resultsClass}
          role="listbox"
          aria-label="User search results"
        >
          {searching ? (
            <div className={cn(resultItemClass, "justify-center py-4")}>
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" aria-label="Searching" />
            </div>
          ) : results.length === 0 ? (
            <p className={cn(resultItemClass, "text-sm text-muted-foreground py-3 px-3")}>
              No users found
            </p>
          ) : (
            results.map((user) => {
              const photo = profilePhotoUrl(user.profilePictureUrl);
              const busy = selectingUserId === user.id;
              const role = userSearchRoleLabel(user.role);
              const isDoctor = role === "Doctor";
              return (
                <button
                  key={user.id}
                  type="button"
                  role="option"
                  disabled={busy}
                  className={cn(resultItemClass, busy && "opacity-70")}
                  onClick={() => void handleSelectUser(user)}
                >
                  <span
                    className={cn(
                      variant === "student" ? "student-messages-avatar" : "doctor-messages-avatar",
                      variant === "doctor" &&
                        (isDoctor ? "doctor-messages-avatar--team" : "doctor-messages-avatar--student"),
                    )}
                    aria-hidden
                  >
                    {photo ? (
                      <img src={photo} alt="" className="h-full w-full rounded-full object-cover" />
                    ) : (
                      initialsFromName(user.fullName) || "?"
                    )}
                  </span>
                  <span className="min-w-0 flex-1 text-left">
                    <span className="block truncate text-sm font-semibold text-foreground">
                      {user.fullName}
                    </span>
                    <span className="mt-0.5 flex flex-wrap items-center gap-1.5">
                      <span
                        className={cn(
                          "inline-flex rounded-full px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
                          isDoctor
                            ? "bg-primary/10 text-primary"
                            : "bg-secondary text-muted-foreground",
                        )}
                      >
                        {role}
                      </span>
                      {user.major?.trim() ? (
                        <span className="truncate text-xs text-muted-foreground">{user.major}</span>
                      ) : null}
                    </span>
                  </span>
                  {busy ? <Loader2 className="h-4 w-4 shrink-0 animate-spin" /> : null}
                </button>
              );
            })
          )}
        </div>
      ) : null}
    </div>
  );
}
