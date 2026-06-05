import { useCallback, useEffect, useState } from "react";
import {
  Building2,
  FileText,
  GraduationCap,
  Sparkles,
  UserPlus,
  UserRound,
  Users,
  type LucideIcon,
} from "lucide-react";
import { Link } from "react-router-dom";
import api, { resolveApiFileUrl, parseApiErrorMessage } from "@/api/axiosInstance";
import {
  followCompany,
  followOrganization,
  unfollowCompany,
  unfollowOrganization,
} from "@/api/feedApi";
import { toast } from "@/hooks/use-toast";
import { profilePhotoUrl } from "@/lib/profilePhotoUrl";
import { resolveFeedPostActionUrl } from "@/lib/feedActionRoutes";
import {
  extractFeedPostTags,
  feedPostActionLabel,
  feedPostRoleLabel,
  feedPostSupportsFollow,
  formatFeedPublished,
  isSocialFeedPost,
} from "@/lib/feedPostDisplay";
import { FeedSocialPostOwnerMenu } from "@/components/communication/FeedSocialPostOwnerMenu";
import {
  isOwnDoctorPost,
  isOwnStudentPost,
  socialPostAuthorProfileUrl,
} from "@/lib/studentPostFeed";
import type { DoctorPost } from "@/api/doctorPostsApi";
import type { StudentPost } from "@/api/studentPostsApi";
import type { FeedItem, FeedPublisherType } from "@/lib/feedTypes";

const ROLE_ICONS: Record<FeedPublisherType, LucideIcon> = {
  student: UserRound,
  doctor: GraduationCap,
  company: Building2,
  association: Users,
};

function avatarForItem(item: FeedItem): { src?: string; initials: string } {
  const initials = item.sourceName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0])
    .join("")
    .toUpperCase();

  if (item.sourceImageBase64) {
    const src = profilePhotoUrl(item.sourceImageBase64);
    if (src) return { src, initials };
  }
  if (item.sourceAvatarUrl) {
    const src = resolveApiFileUrl(item.sourceAvatarUrl) ?? item.sourceAvatarUrl;
    return { src, initials };
  }
  return { initials };
}

function attachmentFileName(url: string): string {
  try {
    const parts = url.split("/").filter(Boolean);
    const raw = parts[parts.length - 1] ?? "Attachment";
    return decodeURIComponent(raw.split("?")[0] ?? raw);
  } catch {
    return "Attachment";
  }
}

type Props = {
  item: FeedItem;
  onSocialPostUpdated?: (post: StudentPost | DoctorPost) => void;
  onSocialPostDeleted?: (postId: number) => void;
};

export function FeedPostCard({ item, onSocialPostUpdated, onSocialPostDeleted }: Props) {
  const avatar = avatarForItem(item);
  const RoleIcon = ROLE_ICONS[item.sourceType] ?? Sparkles;
  const published = formatFeedPublished(item.createdAt);
  const tags = extractFeedPostTags(item);
  const actionLabel = feedPostActionLabel(item);
  const actionUrl = resolveFeedPostActionUrl(item);
  const socialPost = isSocialFeedPost(item);
  const isFileAttachment = socialPost && item.attachmentType === "File";
  const attachmentUrl = item.attachmentUrl ?? item.imageUrl ?? null;
  const imageSrc =
    !isFileAttachment && attachmentUrl
      ? resolveApiFileUrl(attachmentUrl) ?? attachmentUrl
      : !socialPost && item.imageUrl
        ? resolveApiFileUrl(item.imageUrl) ?? item.imageUrl
        : null;
  const fileSrc =
    isFileAttachment && attachmentUrl
      ? resolveApiFileUrl(attachmentUrl) ?? attachmentUrl
      : null;
  const canFollow = feedPostSupportsFollow(item);
  const followEntityId = item.followEntityId ?? 0;

  const [isFollowing, setIsFollowing] = useState(false);
  const [followBusy, setFollowBusy] = useState(false);

  const loadFollowStatus = useCallback(async () => {
    if (!canFollow || followEntityId <= 0) return;
    try {
      const path =
        item.sourceType === "company"
          ? `/companies/${followEntityId}/follow-status`
          : `/organizations/${followEntityId}/follow-status`;
      const { data } = await api.get<{ isFollowing?: boolean }>(path);
      setIsFollowing(!!data?.isFollowing);
    } catch {
      setIsFollowing(false);
    }
  }, [canFollow, followEntityId, item.sourceType]);

  useEffect(() => {
    void loadFollowStatus();
  }, [loadFollowStatus]);

  const toggleFollow = async () => {
    if (!canFollow || followEntityId <= 0 || followBusy) return;
    setFollowBusy(true);
    try {
      if (item.sourceType === "company") {
        if (isFollowing) await unfollowCompany(followEntityId);
        else await followCompany(followEntityId);
      } else {
        if (isFollowing) await unfollowOrganization(followEntityId);
        else await followOrganization(followEntityId);
      }
      setIsFollowing(!isFollowing);
      toast({
        title: isFollowing
          ? item.sourceType === "company"
            ? "Unfollowed company"
            : "Unfollowed association"
          : item.sourceType === "company"
            ? "Now following company"
            : "Now following association",
      });
    } catch (err) {
      toast({
        title: "Could not update follow",
        description: parseApiErrorMessage(err),
        variant: "destructive",
      });
    } finally {
      setFollowBusy(false);
    }
  };

  const actionClass = `feed-post__action feed-post__action--${item.sourceType}`;
  const authorProfileUrl = socialPost ? socialPostAuthorProfileUrl(item) : actionUrl;
  const ownsPost =
    socialPost && (isOwnStudentPost(item) || isOwnDoctorPost(item));
  const showOwnerMenu = ownsPost && onSocialPostUpdated && onSocialPostDeleted;

  return (
    <article
      className={`feed-post feed-post--${item.sourceType}${socialPost ? " feed-post--social" : ""}`}
    >
      <header
        className={`feed-post__header${showOwnerMenu ? " feed-post__header--with-menu" : ""}`}
      >
        {socialPost ? (
          <Link
            to={authorProfileUrl}
            className={`feed-post__avatar feed-post__avatar--${item.sourceType}`}
            aria-label={`View ${item.sourceName}'s profile`}
          >
            {avatar.src ? (
              <img src={avatar.src} alt="" className="feed-post__avatar-img" />
            ) : (
              <span className="feed-post__avatar-initials">{avatar.initials}</span>
            )}
          </Link>
        ) : (
          <div className={`feed-post__avatar feed-post__avatar--${item.sourceType}`}>
            {avatar.src ? (
              <img src={avatar.src} alt="" className="feed-post__avatar-img" />
            ) : (
              <span className="feed-post__avatar-initials">{avatar.initials}</span>
            )}
          </div>
        )}

        <div className="feed-post__header-meta">
          {socialPost ? (
            <Link to={authorProfileUrl} className="feed-post__author feed-post__author--link">
              {item.sourceName}
            </Link>
          ) : (
            <p className="feed-post__author">{item.sourceName}</p>
          )}
          {!socialPost ? (
            <p className={`feed-post__role-line feed-post__role-line--${item.sourceType}`}>
              <RoleIcon className="feed-post__role-icon" aria-hidden />
              <span>{feedPostRoleLabel(item.sourceType)}</span>
            </p>
          ) : item.sourceSubtitle ? (
            <p className="feed-post__subtitle">{item.sourceSubtitle}</p>
          ) : null}
          {published ? (
            <time className="feed-post__date" dateTime={item.createdAt}>
              {published}
            </time>
          ) : null}
        </div>

        {showOwnerMenu ? (
          <FeedSocialPostOwnerMenu
            item={item}
            onUpdated={onSocialPostUpdated}
            onDeleted={onSocialPostDeleted}
          />
        ) : null}
      </header>

      <div className="feed-post__body">
        {!socialPost && item.title ? <h3 className="feed-post__title">{item.title}</h3> : null}
        {item.description ? (
          <p
            className={
              socialPost ? "feed-post__description feed-post__description--social" : "feed-post__description"
            }
          >
            {item.description}
          </p>
        ) : null}

        {!socialPost && tags.length > 0 ? (
          <div className="feed-post__tags" aria-label="Tags">
            {tags.map((tag) => (
              <span key={`${item.id}-${tag}`} className="feed-post__tag">
                {tag}
              </span>
            ))}
          </div>
        ) : null}

        {imageSrc ? (
          <img src={imageSrc} alt="" className="feed-post__image" loading="lazy" />
        ) : null}

        {fileSrc ? (
          <a
            href={fileSrc}
            target="_blank"
            rel="noopener noreferrer"
            className="feed-post__file-card"
            download
          >
            <FileText className="feed-post__file-card-icon" aria-hidden />
            <span className="feed-post__file-card-body">
              <span className="feed-post__file-card-name">{attachmentFileName(fileSrc)}</span>
              <span className="feed-post__file-card-action">Download file</span>
            </span>
          </a>
        ) : null}
      </div>

      {!socialPost ? (
      <footer className="feed-post__footer">
        <div className="feed-post__footer-actions">
          <Link to={actionUrl} className={actionClass}>
            {actionLabel}
          </Link>
          {canFollow ? (
            <button
              type="button"
              className={`feed-post__action feed-post__action--follow feed-post__action--${item.sourceType}${
                isFollowing ? " feed-post__action--following" : ""
              }`}
              disabled={followBusy}
              aria-pressed={isFollowing}
              onClick={() => void toggleFollow()}
            >
              {!isFollowing ? <UserPlus className="h-3.5 w-3.5 shrink-0" aria-hidden /> : null}
              {isFollowing ? "Following" : "Follow"}
            </button>
          ) : null}
        </div>
      </footer>
      ) : null}
    </article>
  );
}
