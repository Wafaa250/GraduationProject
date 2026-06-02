import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { Github, Globe, Linkedin, User } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ROUTES } from "@/routes/paths";
import {
  buildSidebarBioLine,
  formatStudentHandleFromEmail,
  formatStudentSidebarSubtitle,
} from "@/lib/studentSidebarProfile";
import { PROFILE_AVATAR_FALLBACK_CLASS, profileInitialsFromName } from "@/lib/profileAvatar";
import { cn } from "@/components/ui/utils";

export type StudentSidebarProfileModel = {
  name: string;
  email?: string | null;
  major?: string | null;
  academicYear?: string | null;
  university?: string | null;
  faculty?: string | null;
  bio?: string | null;
  github?: string | null;
  linkedin?: string | null;
  portfolio?: string | null;
  photoUrl: string | null;
};

type Props = {
  profile: StudentSidebarProfileModel;
  skills?: string[];
  collapsed?: boolean;
  active?: boolean;
  onNavigate?: () => void;
};

function socialHandle(url: string): string {
  try {
    const parsed = new URL(url.startsWith("http") ? url : `https://${url}`);
    const path = parsed.pathname.replace(/^\/+|\/+$/g, "");
    return path || parsed.hostname;
  } catch {
    return url.replace(/^https?:\/\//i, "");
  }
}

type DetailRowProps = {
  icon: ReactNode;
  label: string;
  href?: string;
};

function DetailRow({ icon, label, href }: DetailRowProps) {
  const content = (
    <>
      <span className="student-sidebar-profile__detail-icon" aria-hidden>
        {icon}
      </span>
      <span className="student-sidebar-profile__detail-text">{label}</span>
    </>
  );

  if (href) {
    return (
      <li>
        <a
          href={href}
          className="student-sidebar-profile__detail-row student-sidebar-profile__detail-row--link"
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
        >
          {content}
        </a>
      </li>
    );
  }

  return (
    <li>
      <span className="student-sidebar-profile__detail-row">{content}</span>
    </li>
  );
}

export function StudentSidebarProfileCard({
  profile,
  skills = [],
  collapsed = false,
  active = false,
  onNavigate,
}: Props) {
  const initials = profileInitialsFromName(profile.name);
  const handle = formatStudentHandleFromEmail(profile.email);
  const subtitle = formatStudentSidebarSubtitle(profile.major, profile.academicYear);
  const { text: bioLine } = buildSidebarBioLine(profile.bio, null, skills);

  const detailRows: DetailRowProps[] = [];
  if (profile.github?.trim()) {
    const href = profile.github.trim();
    detailRows.push({
      icon: <Github className="h-4 w-4" />,
      label: socialHandle(href),
      href: href.startsWith("http") ? href : `https://${href}`,
    });
  }
  if (profile.linkedin?.trim()) {
    const href = profile.linkedin.trim();
    detailRows.push({
      icon: <Linkedin className="h-4 w-4" />,
      label: socialHandle(href),
      href: href.startsWith("http") ? href : `https://${href}`,
    });
  }
  if (profile.portfolio?.trim()) {
    const href = profile.portfolio.trim();
    detailRows.push({
      icon: <Globe className="h-4 w-4" />,
      label: socialHandle(href),
      href: href.startsWith("http") ? href : `https://${href}`,
    });
  }

  if (collapsed) {
    return (
      <Link
        to={ROUTES.profile}
        className={cn("student-sidebar-layout__nav-item", active && "is-active")}
        aria-label="Profile"
        aria-current={active ? "page" : undefined}
        onClick={onNavigate}
        title="Profile"
      >
        <User className="student-sidebar-layout__nav-icon" aria-hidden />
      </Link>
    );
  }

  return (
    <div
      className={cn(
        "student-sidebar-profile",
        active && "student-sidebar-profile--nav-active",
      )}
    >
      <Link
        to={ROUTES.profile}
        className="student-sidebar-profile__identity"
        onClick={onNavigate}
      >
        <div className="student-sidebar-profile__header">
          <Avatar className="student-sidebar-profile__avatar">
            {profile.photoUrl ? <AvatarImage src={profile.photoUrl} alt="" /> : null}
            <AvatarFallback className={cn(PROFILE_AVATAR_FALLBACK_CLASS, "!rounded-[0.75rem]")}>
              {initials}
            </AvatarFallback>
          </Avatar>

          <div className="student-sidebar-profile__meta">
            <h2 className="student-sidebar-profile__name">{profile.name}</h2>
            {handle ? <p className="student-sidebar-profile__handle">{handle}</p> : null}
            {subtitle ? (
              <p className="student-sidebar-profile__subtitle">{subtitle}</p>
            ) : null}
            {profile.university?.trim() ? (
              <p className="student-sidebar-profile__secondary">{profile.university.trim()}</p>
            ) : null}
            {profile.faculty?.trim() ? (
              <p className="student-sidebar-profile__secondary">{profile.faculty.trim()}</p>
            ) : null}
          </div>
        </div>

        {bioLine ? (
          <p className="student-sidebar-profile__bio">{bioLine}</p>
        ) : skills.length === 0 && !profile.bio?.trim() ? (
          <p className="student-sidebar-profile__bio student-sidebar-profile__bio--empty">
            No skills added yet
          </p>
        ) : null}
      </Link>

      {detailRows.length > 0 ? (
        <>
          <ul className="student-sidebar-profile__details">
            {detailRows.map((row) => (
              <DetailRow key={`${row.label}-${row.href ?? "static"}`} {...row} />
            ))}
          </ul>
          <div className="student-sidebar-profile__divider" aria-hidden />
        </>
      ) : null}
    </div>
  );
}
