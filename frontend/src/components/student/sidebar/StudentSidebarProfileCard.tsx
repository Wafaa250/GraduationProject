import { Link } from "react-router-dom";
import { GraduationCap } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ROUTES } from "@/routes/paths";
import {
  formatStudentSidebarSubtitle,
  partitionSkillChips,
} from "@/lib/studentSidebarProfile";
import { PROFILE_AVATAR_FALLBACK_CLASS, profileInitialsFromName } from "@/lib/profileAvatar";

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

export type StudentSidebarStats = {
  connections: number;
  projects: number;
  courses: number;
};

type Props = {
  profile: StudentSidebarProfileModel;
  skills?: string[];
  stats?: StudentSidebarStats;
  onNavigate?: () => void;
};

const MAX_VISIBLE_SKILLS = 5;

export function StudentSidebarProfileCard({
  profile,
  skills = [],
  stats,
  onNavigate,
}: Props) {
  const initials = profileInitialsFromName(profile.name);
  const subtitle = formatStudentSidebarSubtitle(profile.major, profile.academicYear);
  const { visible: visibleSkills, overflow: skillOverflow } = partitionSkillChips(
    skills,
    MAX_VISIBLE_SKILLS,
  );

  const statItems = [
    { value: stats?.connections ?? 0, label: "Connections" },
    { value: stats?.projects ?? 0, label: "Projects" },
    { value: stats?.courses ?? 0, label: "Courses" },
  ];

  return (
    <article className="student-sidebar-profile-card">
      <div className="student-sidebar-profile-card__cover" aria-hidden />
      <div className="student-sidebar-profile-card__body">
        <Link
          to={ROUTES.profile}
          className="student-sidebar-profile-card__identity"
          onClick={onNavigate}
        >
          <div className="student-sidebar-profile-card__avatar-wrap">
            <Avatar className="student-sidebar-profile-card__avatar">
              {profile.photoUrl ? <AvatarImage src={profile.photoUrl} alt="" /> : null}
              <AvatarFallback className={PROFILE_AVATAR_FALLBACK_CLASS}>{initials}</AvatarFallback>
            </Avatar>
          </div>

          <h2 className="student-sidebar-profile-card__name">{profile.name}</h2>
          {subtitle ? <p className="student-sidebar-profile-card__subtitle">{subtitle}</p> : null}
          {profile.university?.trim() ? (
            <p className="student-sidebar-profile-card__university">
              <GraduationCap className="h-3.5 w-3.5 shrink-0" aria-hidden />
              <span>{profile.university.trim()}</span>
            </p>
          ) : null}
        </Link>

        {visibleSkills.length > 0 ? (
          <ul className="student-sidebar-profile-card__skills" aria-label="Skills">
            {visibleSkills.map((skill) => (
              <li key={skill} className="student-sidebar-profile-card__skill-line">
                {skill}
              </li>
            ))}
            {skillOverflow > 0 ? (
              <li className="student-sidebar-profile-card__skill-line student-sidebar-profile-card__skill-line--more">
                +{skillOverflow} more
              </li>
            ) : null}
          </ul>
        ) : (
          <p className="student-sidebar-profile-card__skills-empty">No skills added yet</p>
        )}

        <div className="student-sidebar-profile-card__stats-divider" aria-hidden />

        <div className="student-sidebar-profile-card__stats">
          {statItems.map((item) => (
            <div key={item.label} className="student-sidebar-profile-card__stat">
              <span className="student-sidebar-profile-card__stat-value">{item.value}</span>
              <span className="student-sidebar-profile-card__stat-label">{item.label}</span>
            </div>
          ))}
        </div>

      </div>
    </article>
  );
}
