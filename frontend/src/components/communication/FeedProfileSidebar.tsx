import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { FeedSidebarSummary } from "@/api/feedApi";
import { PROFILE_AVATAR_FALLBACK_CLASS, profileInitialsFromName } from "@/lib/profileAvatar";
import { resolveApiFileUrl } from "@/api/axiosInstance";

type Props = {
  sidebar: FeedSidebarSummary;
};

function ProgressBar({ percent }: { percent: number }) {
  return (
    <div className="hub-progress">
      <div className="hub-progress__label">
        <span>Profile completion</span>
        <span>{percent}%</span>
      </div>
      <div className="hub-progress__bar">
        <div className="hub-progress__fill" style={{ width: `${Math.min(100, percent)}%` }} />
      </div>
    </div>
  );
}

export function FeedProfileSidebar({ sidebar }: Props) {
  if (sidebar.student) {
    const s = sidebar.student;
    const initials = profileInitialsFromName(s.name);
    return (
      <div className="hub-card hub-profile-card">
        <div className="hub-profile-card__avatar">
          <Avatar className="h-full w-full">
            {s.profilePictureBase64 ? (
              <AvatarImage src={s.profilePictureBase64} alt="" />
            ) : null}
            <AvatarFallback className={PROFILE_AVATAR_FALLBACK_CLASS}>{initials}</AvatarFallback>
          </Avatar>
        </div>
        <p className="hub-profile-card__name">{s.name}</p>
        {s.major ? <p className="hub-profile-card__meta">{s.major}</p> : null}
        {s.university ? <p className="hub-profile-card__meta">{s.university}</p> : null}
        {s.academicYear ? <p className="hub-profile-card__meta">{s.academicYear}</p> : null}
        {s.roleBadges.length > 0 ? (
          <div className="hub-profile-card__badges">
            {s.roleBadges.map((badge) => (
              <span key={badge} className="hub-badge">
                {badge}
              </span>
            ))}
          </div>
        ) : null}
        <div className="hub-profile-card__stats">
          <div className="hub-profile-card__stat-row">
            <span>Skills</span>
            <strong>{s.skillsCount}</strong>
          </div>
          <div className="hub-profile-card__stat-row">
            <span>Teams</span>
            <strong>{s.joinedTeamsCount}</strong>
          </div>
          <div className="hub-profile-card__stat-row">
            <span>Projects</span>
            <strong>{s.completedProjectsCount}</strong>
          </div>
        </div>
        <ProgressBar percent={s.profileCompletionPercent} />
      </div>
    );
  }

  if (sidebar.doctor) {
    const d = sidebar.doctor;
    const initials = profileInitialsFromName(d.name);
    return (
      <div className="hub-card hub-profile-card">
        <div className="hub-profile-card__avatar">
          <Avatar className="h-full w-full">
            {d.profilePictureBase64 ? (
              <AvatarImage src={d.profilePictureBase64} alt="" />
            ) : null}
            <AvatarFallback className={PROFILE_AVATAR_FALLBACK_CLASS}>{initials}</AvatarFallback>
          </Avatar>
        </div>
        <p className="hub-profile-card__name">{d.name}</p>
        {d.specialization ? (
          <p className="hub-profile-card__meta">{d.specialization}</p>
        ) : null}
        <div className="hub-profile-card__stats">
          <div className="hub-profile-card__stat-row">
            <span>Courses</span>
            <strong>{d.coursesCount}</strong>
          </div>
          <div className="hub-profile-card__stat-row">
            <span>Supervised projects</span>
            <strong>{d.supervisedProjectsCount}</strong>
          </div>
        </div>
      </div>
    );
  }

  if (sidebar.company) {
    const c = sidebar.company;
    const initials = profileInitialsFromName(c.companyName);
    return (
      <div className="hub-card hub-profile-card">
        <div className="hub-profile-card__avatar">
          <Avatar className="h-full w-full">
            <AvatarFallback className={PROFILE_AVATAR_FALLBACK_CLASS}>{initials}</AvatarFallback>
          </Avatar>
        </div>
        <p className="hub-profile-card__name">{c.companyName}</p>
        {c.industry ? <p className="hub-profile-card__meta">{c.industry}</p> : null}
        <div className="hub-profile-card__stats">
          <div className="hub-profile-card__stat-row">
            <span>Active opportunities</span>
            <strong>{c.activeOpportunitiesCount}</strong>
          </div>
        </div>
      </div>
    );
  }

  if (sidebar.association) {
    const a = sidebar.association;
    const logo = a.logoUrl ? resolveApiFileUrl(a.logoUrl) ?? a.logoUrl : null;
    const initials = profileInitialsFromName(a.associationName);
    return (
      <div className="hub-card hub-profile-card">
        <div className="hub-profile-card__avatar">
          <Avatar className="h-full w-full">
            {logo ? <AvatarImage src={logo} alt="" /> : null}
            <AvatarFallback className={PROFILE_AVATAR_FALLBACK_CLASS}>{initials}</AvatarFallback>
          </Avatar>
        </div>
        <p className="hub-profile-card__name">{a.associationName}</p>
        {a.category ? <p className="hub-profile-card__meta">{a.category}</p> : null}
        <div className="hub-profile-card__stats">
          <div className="hub-profile-card__stat-row">
            <span>Active announcements</span>
            <strong>{a.activeAnnouncementsCount}</strong>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
