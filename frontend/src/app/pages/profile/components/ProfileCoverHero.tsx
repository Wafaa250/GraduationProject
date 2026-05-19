import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import {
  Camera,
  MapPin,
  MessageCircle,
  Pencil,
  UserPlus,
} from "lucide-react";

import { Button } from "../../../components/ui/button";
import { cn } from "../../../components/ui/utils";

export type ProfileCoverHeroProps = {
  displayName: string;
  headline?: string;
  campusLabel?: string;
  avatarUrl?: string | null;
  initials: string;
  variant: "owner" | "visitor" | "editing";
  editHref?: string;
  onMessage?: () => void;
  onInvite?: () => void;
  onAvatarClick?: () => void;
  showCameraOverlay?: boolean;
  className?: string;
  footerSlot?: ReactNode;
};

export function ProfileCoverHero({
  displayName,
  headline,
  campusLabel,
  avatarUrl,
  initials,
  variant,
  editHref = "/edit-profile",
  onMessage,
  onInvite,
  onAvatarClick,
  showCameraOverlay = false,
  className,
  footerSlot,
}: ProfileCoverHeroProps) {
  const avatarClassName = cn(
    "absolute -top-12 left-6 flex h-24 w-24 items-center justify-center overflow-hidden rounded-3xl bg-gradient-primary text-2xl font-bold text-primary-foreground shadow-glow ring-4 ring-card sm:left-8",
    onAvatarClick && "group cursor-pointer",
  );

  const avatarInner = (
    <>
      {avatarUrl ? (
        <img src={avatarUrl} alt="" className="h-full w-full object-cover" />
      ) : (
        initials
      )}
      {showCameraOverlay ? (
        <span className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
          <Camera className="h-5 w-5 text-white" />
        </span>
      ) : null}
    </>
  );

  return (
    <div className={cn("relative overflow-hidden rounded-3xl shadow-pop", className)}>
      <div className="relative h-40 bg-gradient-hero sm:h-52">
        <div aria-hidden className="absolute inset-0 surface-grid opacity-30" />
        {variant === "owner" ? (
          <Button
            variant="secondary"
            size="sm"
            className="absolute right-4 top-4"
            asChild
          >
            <Link to={editHref}>
              <Pencil className="mr-1.5 h-3.5 w-3.5" />
              Edit
            </Link>
          </Button>
        ) : null}
      </div>

      <div className="relative bg-card px-6 pb-6 pt-12 sm:px-8">
        {onAvatarClick ? (
          <button type="button" onClick={onAvatarClick} className={avatarClassName}>
            {avatarInner}
          </button>
        ) : (
          <div className={avatarClassName}>{avatarInner}</div>
        )}

        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between sm:pl-28">
          <div className="min-w-0">
            <h1 className="font-display text-2xl font-bold sm:text-3xl">
              {displayName.trim() || "Student"}
            </h1>
            {headline ? (
              <p className="mt-1 text-sm text-muted-foreground">{headline}</p>
            ) : null}
            <div className="mt-2 flex flex-wrap gap-3 text-xs text-muted-foreground">
              {campusLabel ? (
                <span className="inline-flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5 shrink-0" />
                  {campusLabel}
                </span>
              ) : null}
            </div>
          </div>

          {variant === "visitor" ? (
            <div className="flex shrink-0 gap-2">
              <Button variant="outline" size="sm" onClick={onMessage}>
                <MessageCircle className="mr-1.5 h-3.5 w-3.5" />
                Message
              </Button>
              <Button size="sm" className="bg-gradient-primary shadow-glow" onClick={onInvite}>
                <UserPlus className="mr-1.5 h-3.5 w-3.5" />
                Invite to team
              </Button>
            </div>
          ) : null}

          {footerSlot}
        </div>
      </div>
    </div>
  );
}
