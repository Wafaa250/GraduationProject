import { useMemo } from "react";
import { Link } from "react-router-dom";
import {
  Briefcase,
  Building2,
  Clock,
  Globe,
  Linkedin,
  Mail,
  MapPin,
  Users,
} from "lucide-react";
import type { PublicCompanyOpportunityDetail } from "@/api/organizationsPublicApi";
import { ROUTES } from "@/routes/paths";
import { requestTypeLabel } from "@/lib/companyRequestDisplay";
import "@/styles/student-company-opportunity.css";

type Props = {
  opportunity: PublicCompanyOpportunityDetail;
};

function companyInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "CO";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}

type MetaBadge = {
  key: string;
  label: string;
  icon: typeof MapPin;
  accent?: boolean;
};

export function CompanyOpportunityStudentView({ opportunity }: Props) {
  const initials = useMemo(
    () => companyInitials(opportunity.companyName),
    [opportunity.companyName],
  );

  const roles =
    opportunity.roles?.length > 0
      ? opportunity.roles
      : opportunity.roleCount > 0
        ? [{ roleName: "Open role", skills: opportunity.skills }]
        : [];

  const allSkills = useMemo(() => {
    const fromRoles = roles.flatMap((r) => r.skills);
    const combined = [...fromRoles, ...opportunity.skills];
    return [...new Set(combined.filter(Boolean))];
  }, [roles, opportunity.skills]);

  const metaBadges = useMemo(() => {
    const badges: MetaBadge[] = [];
    if (opportunity.collaborationFormat?.trim()) {
      badges.push({
        key: "format",
        label: opportunity.collaborationFormat.trim(),
        icon: MapPin,
      });
    }
    if (opportunity.durationLabel?.trim()) {
      badges.push({
        key: "duration",
        label: opportunity.durationLabel.trim(),
        icon: Clock,
      });
    }
    if (opportunity.requestType) {
      badges.push({
        key: "type",
        label: requestTypeLabel(opportunity.requestType),
        icon: Users,
        accent: true,
      });
    }
    if (opportunity.category?.trim()) {
      badges.push({
        key: "category",
        label: opportunity.category.trim(),
        icon: Briefcase,
      });
    }
    return badges;
  }, [opportunity]);

  const showStandaloneSkills =
    opportunity.skills.length > 0 &&
    roles.every((r) => r.skills.length === 0);

  return (
    <div className="company-opportunity-detail">
      <header className="company-opportunity-detail__hero">
        <div className="company-opportunity-detail__hero-bg" aria-hidden />
        <div className="company-opportunity-detail__hero-inner">
          <div className="company-opportunity-detail__company">
            <div className="company-opportunity-detail__company-avatar" aria-hidden>
              {initials}
            </div>
            <div className="min-w-0">
              <p className="company-opportunity-detail__company-eyebrow">Company</p>
              <p className="company-opportunity-detail__company-name">
                {opportunity.companyName}
              </p>
              {opportunity.industry ? (
                <p className="company-opportunity-detail__company-industry">
                  {opportunity.industry}
                </p>
              ) : null}
            </div>
          </div>

          <h1 className="company-opportunity-detail__title">{opportunity.title}</h1>

          {metaBadges.length > 0 ? (
            <div className="company-opportunity-detail__badges" aria-label="Opportunity details">
              {metaBadges.map((badge) => {
                const Icon = badge.icon;
                return (
                  <span
                    key={badge.key}
                    className={`company-opportunity-detail__badge${
                      badge.accent ? " company-opportunity-detail__badge--accent" : ""
                    }`}
                  >
                    <Icon className="company-opportunity-detail__badge-icon" aria-hidden />
                    {badge.label}
                  </span>
                );
              })}
            </div>
          ) : null}
        </div>
      </header>

      <div className="company-opportunity-detail__grid">
        <div className="company-opportunity-detail__main">
          <section className="company-opportunity-detail__section">
            <h2 className="company-opportunity-detail__section-title">Description</h2>
            <p className="company-opportunity-detail__description">
              {opportunity.description}
            </p>
          </section>

          {roles.length > 0 ? (
            <section className="company-opportunity-detail__section">
              <h2 className="company-opportunity-detail__section-title">Roles needed</h2>
              <div className="company-opportunity-detail__roles">
                {roles.map((role) => (
                  <article key={role.roleName} className="company-opportunity-detail__role-card">
                    <h3 className="company-opportunity-detail__role-name">{role.roleName}</h3>
                    {role.skills.length > 0 ? (
                      <>
                        <p className="company-opportunity-detail__role-skills-label">Skills</p>
                        <div className="company-opportunity-detail__skill-chips">
                          {role.skills.map((skill) => (
                            <span key={skill} className="company-opportunity-detail__skill-chip">
                              {skill}
                            </span>
                          ))}
                        </div>
                      </>
                    ) : null}
                  </article>
                ))}
              </div>
            </section>
          ) : null}

          {showStandaloneSkills || (allSkills.length > 0 && roles.length === 0) ? (
            <section className="company-opportunity-detail__section">
              <h2 className="company-opportunity-detail__section-title">Required skills</h2>
              <div className="company-opportunity-detail__skill-chips">
                {(showStandaloneSkills ? opportunity.skills : allSkills).map((skill) => (
                  <span key={skill} className="company-opportunity-detail__skill-chip">
                    {skill}
                  </span>
                ))}
              </div>
            </section>
          ) : null}

          {opportunity.scopeNotes?.trim() ? (
            <section className="company-opportunity-detail__section">
              <h2 className="company-opportunity-detail__section-title">Additional notes</h2>
              <p className="company-opportunity-detail__notes">{opportunity.scopeNotes}</p>
            </section>
          ) : null}
        </div>

        <aside className="company-opportunity-detail__sidebar">
          <div className="company-opportunity-detail__company-card">
            <p className="company-opportunity-detail__company-card-label">Posted by</p>
            <div className="company-opportunity-detail__company-card-row">
              <div className="company-opportunity-detail__company-card-avatar" aria-hidden>
                {initials}
              </div>
              <div className="min-w-0">
                <p className="company-opportunity-detail__company-card-name">
                  {opportunity.companyName}
                </p>
                {opportunity.industry ? (
                  <p className="company-opportunity-detail__company-card-meta">
                    {opportunity.industry}
                  </p>
                ) : null}
              </div>
            </div>
          </div>

          <div className="company-opportunity-detail__contact-card">
            <h2 className="company-opportunity-detail__contact-title">
              Interested in this opportunity?
            </h2>
            <p className="company-opportunity-detail__contact-sub">
              Reach out to the company directly. SkillSwap does not handle applications for
              company opportunities.
            </p>

            <div className="company-opportunity-detail__contact-links">
              {opportunity.contactEmail ? (
                <a
                  href={`mailto:${opportunity.contactEmail}`}
                  className="company-opportunity-detail__contact-link"
                >
                  <span className="company-opportunity-detail__contact-link-icon">
                    <Mail className="h-4 w-4" aria-hidden />
                  </span>
                  <span className="company-opportunity-detail__contact-link-text">
                    {opportunity.contactEmail}
                  </span>
                </a>
              ) : null}
              {opportunity.websiteUrl ? (
                <a
                  href={opportunity.websiteUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="company-opportunity-detail__contact-link"
                >
                  <span className="company-opportunity-detail__contact-link-icon">
                    <Globe className="h-4 w-4" aria-hidden />
                  </span>
                  <span className="company-opportunity-detail__contact-link-text">
                    Company website
                  </span>
                </a>
              ) : null}
              {opportunity.linkedInUrl ? (
                <a
                  href={opportunity.linkedInUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="company-opportunity-detail__contact-link"
                >
                  <span className="company-opportunity-detail__contact-link-icon">
                    <Linkedin className="h-4 w-4" aria-hidden />
                  </span>
                  <span className="company-opportunity-detail__contact-link-text">LinkedIn</span>
                </a>
              ) : null}
            </div>

            <Link
              to={ROUTES.companyPublicProfile(opportunity.companyProfileId)}
              state={{ fromOpportunity: true }}
              className="company-opportunity-detail__cta"
            >
              <Building2 className="h-4 w-4" aria-hidden />
              View Company Profile
            </Link>
          </div>
        </aside>
      </div>
    </div>
  );
}
