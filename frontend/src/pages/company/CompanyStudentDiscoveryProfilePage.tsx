import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import {
  Bookmark,
  GitCompare,
  Mail,
  GraduationCap,
  Clock,
  Globe,
  Briefcase,
  Target,
} from "lucide-react";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { CompanyPageShell } from "@/components/company/CompanyPageShell";
import { CompanyDiscoveryProfileHero } from "@/components/company/CompanyDiscoveryProfileHero";
import { CompanyLuxSection } from "@/components/company/CompanyLuxSection";
import { CompanyEmptyState } from "@/components/company/CompanyEmptyState";
import { DashboardSkeleton } from "@/components/company/CompanySkeleton";
import { cwLayout } from "@/lib/companyLayout";
import { cn } from "@/lib/utils";
import { CompanyAiMatchExplanationCard } from "@/components/company/CompanyAiMatchExplanationCard";
import { CompanyStudentContactSection } from "@/components/company/CompanyStudentContactSection";
import {
  getCompanyStudentDiscoveryProfile,
  getSavedRecommendationIds,
  saveStudentRecommendation,
  unsaveStudentRecommendation,
  parseApiErrorMessage,
  type CompanyStudentDiscoveryProfile,
} from "@/api/companyApi";
import { COMPANY_ROUTES } from "@/routes/paths";
import { mapStudentDiscoveryContact } from "@/lib/studentDiscoveryContact";
import {
  getCompareStudentIds,
  toggleCompareStudent,
} from "@/lib/companyDiscoveryStorage";

function initials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function formatProjectDates(createdAt: string, updatedAt: string): string {
  try {
    const start = new Date(createdAt).toLocaleDateString(undefined, {
      month: "short",
      year: "numeric",
    });
    const end = new Date(updatedAt).toLocaleDateString(undefined, {
      month: "short",
      year: "numeric",
    });
    return start === end ? start : `${start} – ${end}`;
  } catch {
    return "";
  }
}

function SkillGroup({ label, items }: { label: string; items: string[] }) {
  if (items.length === 0) return null;
  return (
    <div>
      <p className="cw-section-label mb-2">{label}</p>
      <div className="flex flex-wrap gap-1.5">
        {items.map((item) => (
          <Badge key={`${label}-${item}`} variant="secondary" className="rounded-md text-xs font-normal">
            {item}
          </Badge>
        ))}
      </div>
    </div>
  );
}

export function CompanyStudentDiscoveryProfilePage() {
  const { requestId: requestIdParam, studentProfileId: studentIdParam } = useParams<{
    requestId: string;
    studentProfileId: string;
  }>();
  const [searchParams] = useSearchParams();
  const contactRef = useRef<HTMLDivElement>(null);

  const requestId = Number(requestIdParam);
  const studentProfileId = Number(studentIdParam);
  const teamIdParam = searchParams.get("teamId");
  const teamId = teamIdParam ? Number(teamIdParam) : undefined;

  const [profile, setProfile] = useState<CompanyStudentDiscoveryProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [inCompare, setInCompare] = useState(false);

  const backHref = useMemo(() => {
    if (!Number.isFinite(requestId) || requestId < 1) return COMPANY_ROUTES.requests;
    if (Number.isFinite(teamId) && teamId! > 0) {
      return COMPANY_ROUTES.teamDiscoveryProfile(requestId, teamId!);
    }
    return COMPANY_ROUTES.requestRecommendations(requestId);
  }, [requestId, teamId]);

  const backLabel =
    Number.isFinite(teamId) && teamId! > 0 ? "Back to team" : "Back to recommendations";

  useEffect(() => {
    if (!Number.isFinite(requestId) || requestId < 1 || !Number.isFinite(studentProfileId) || studentProfileId < 1) {
      setError("Invalid profile link.");
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    getCompanyStudentDiscoveryProfile(
      requestId,
      studentProfileId,
      Number.isFinite(teamId) && teamId! > 0 ? teamId : undefined,
    )
      .then((data) => {
        if (!cancelled) {
          setProfile(data);
          setInCompare(getCompareStudentIds(requestId).includes(studentProfileId));
        }
      })
      .catch((err) => {
        if (!cancelled) setError(parseApiErrorMessage(err) || "Could not load student profile.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    getSavedRecommendationIds(requestId)
      .then((ids) => {
        if (!cancelled) setSaved(ids.studentProfileIds.includes(studentProfileId));
      })
      .catch(() => {
        if (!cancelled) setSaved(false);
      });

    return () => {
      cancelled = true;
    };
  }, [requestId, studentProfileId, teamId]);

  const scrollToContact = () => {
    contactRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handleSave = async () => {
    if (!Number.isFinite(requestId)) return;
    try {
      if (saved) {
        await unsaveStudentRecommendation(requestId, studentProfileId);
        setSaved(false);
        toast.success("Removed from saved");
      } else {
        await saveStudentRecommendation(requestId, studentProfileId);
        setSaved(true);
        toast.success("Recommendation saved");
      }
    } catch (err) {
      toast.error(parseApiErrorMessage(err) || "Could not update saved state.");
    }
  };

  const handleCompare = () => {
    if (!Number.isFinite(requestId)) return;
    const before = getCompareStudentIds(requestId);
    const list = toggleCompareStudent(requestId, studentProfileId);
    const added = !before.includes(studentProfileId) && list.includes(studentProfileId);
    setInCompare(list.includes(studentProfileId));
    if (added) {
      toast.success(`Added to compare (${list.length}/4)`);
    } else if (before.includes(studentProfileId)) {
      toast.success("Removed from compare");
    } else {
      toast.error("Compare list is full (max 4 students).");
    }
  };

  if (loading) {
    return (
      <CompanyPageShell className="space-y-6">
        <DashboardSkeleton />
      </CompanyPageShell>
    );
  }

  if (error || !profile) {
    return (
      <CompanyPageShell>
        <div className="cw-lux-panel">
          <div className="cw-lux-panel-body py-12">
            <CompanyEmptyState icon={GraduationCap} message={error ?? "Profile not found."} />
            <div className="flex justify-center mt-4">
              <Button asChild variant="outline" className="rounded-lg">
                <Link to={backHref}>{backLabel}</Link>
              </Button>
            </div>
          </div>
        </div>
      </CompanyPageShell>
    );
  }

  const { student, recommendation, projects, request } = profile;
  const roleTitle =
    recommendation?.alignedRoleName ??
    student.roles[0] ??
    student.major ??
    "Student";
  const matchScore = recommendation?.matchScore ?? 0;
  const contact = mapStudentDiscoveryContact(student);
  const hasContact = Boolean(
    contact.email || contact.linkedin || contact.github || contact.portfolio,
  );

  return (
    <CompanyPageShell className="space-y-6">
      <CompanyDiscoveryProfileHero
        backTo={backHref}
        backLabel={backLabel}
        title={student.name}
        subtitle={roleTitle}
        score={recommendation ? matchScore : undefined}
        visual={
          <Avatar className="cw-discovery-avatar shrink-0">
            {student.profilePictureBase64 ? (
              <AvatarImage src={student.profilePictureBase64} alt="" className="object-cover" />
            ) : null}
            <AvatarFallback className="rounded-[inherit] text-2xl font-semibold cw-avatar-solid">
              {initials(student.name)}
            </AvatarFallback>
          </Avatar>
        }
        meta={
          <div className="cw-discovery-meta-row">
            {student.university ? (
              <span className="cw-discovery-meta-item">
                <GraduationCap className="h-3.5 w-3.5 shrink-0" />
                {student.university}
              </span>
            ) : null}
            {student.major ? (
              <span>
                {student.major}
                {student.academicYear ? ` · ${student.academicYear}` : ""}
              </span>
            ) : null}
            {student.availability ? (
              <span className="cw-discovery-meta-item">
                <Clock className="h-3.5 w-3.5 shrink-0" />
                {student.availability}
              </span>
            ) : null}
            {student.languages.length > 0 ? (
              <span className="cw-discovery-meta-item">
                <Globe className="h-3.5 w-3.5 shrink-0" />
                {student.languages.join(", ")}
              </span>
            ) : null}
          </div>
        }
        actions={
          <>
            <Button
              type="button"
              className={cn("rounded-lg h-9", !saved && "cw-btn-gradient border-0")}
              variant={saved ? "outline" : "default"}
              onClick={handleSave}
            >
              <Bookmark className={cn("h-4 w-4 mr-1.5", saved && "fill-current")} />
              {saved ? "Saved" : "Save Recommendation"}
            </Button>
            <Button type="button" variant="outline" className="rounded-lg h-9" onClick={handleCompare}>
              <GitCompare className="h-4 w-4 mr-1.5" />
              {inCompare ? "In Compare" : "Add to Compare"}
            </Button>
            <Button
              type="button"
              variant="outline"
              className="rounded-lg h-9"
              onClick={scrollToContact}
              disabled={!hasContact}
            >
              <Mail className="h-4 w-4 mr-1.5" />
              View Contact Information
            </Button>
          </>
        }
      />

      <div className={cn("grid lg:grid-cols-3", cwLayout.grid)}>
        <div className="lg:col-span-2 space-y-5">
          <CompanyLuxSection title="About">
            {student.bio ? (
              <p className="text-muted-foreground leading-relaxed text-sm">{student.bio}</p>
            ) : (
              <p className="text-sm text-muted-foreground italic">No bio provided yet.</p>
            )}
            <dl className="cw-discovery-dl mt-5">
              {student.university ? (
                <div>
                  <dt>University</dt>
                  <dd>{student.university}</dd>
                </div>
              ) : null}
              {student.faculty ? (
                <div>
                  <dt>Faculty</dt>
                  <dd>{student.faculty}</dd>
                </div>
              ) : null}
              {student.major ? (
                <div>
                  <dt>Major / specialization</dt>
                  <dd>{student.major}</dd>
                </div>
              ) : null}
              {student.academicYear ? (
                <div>
                  <dt>Academic year</dt>
                  <dd>{student.academicYear}</dd>
                </div>
              ) : null}
            </dl>
          </CompanyLuxSection>

          <CompanyLuxSection title="Skills">
            <div className="space-y-5">
              <SkillGroup label="Roles" items={student.roles} />
              <SkillGroup label="Technical skills" items={student.technicalSkills} />
              <SkillGroup label="Tools" items={student.tools} />
              {student.lookingFor ? (
                <div>
                  <p className="cw-section-label mb-2">Focus areas</p>
                  <p className="text-sm text-muted-foreground leading-relaxed">{student.lookingFor}</p>
                </div>
              ) : null}
              {student.roles.length === 0 &&
                student.technicalSkills.length === 0 &&
                student.tools.length === 0 && (
                  <p className="text-sm text-muted-foreground italic">No skills listed on profile.</p>
                )}
            </div>
          </CompanyLuxSection>

          <CompanyLuxSection title="Projects" icon={Briefcase}>
            {projects.length === 0 ? (
              <p className="text-sm text-muted-foreground italic">No projects listed yet.</p>
            ) : (
              <div className="space-y-3">
                {projects.map((project) => (
                  <div key={project.id} className="cw-project-card-lux">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <h4 className="font-semibold text-sm">{project.title}</h4>
                      <Badge variant="outline" className="rounded-md text-[10px] font-normal shrink-0">
                        {project.teamRole}
                      </Badge>
                    </div>
                    {project.projectType ? (
                      <p className="text-[11px] text-muted-foreground mt-0.5">{project.projectType}</p>
                    ) : null}
                    {project.description ? (
                      <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
                        {project.description}
                      </p>
                    ) : null}
                    <p className="text-[11px] text-muted-foreground mt-2">
                      {formatProjectDates(project.createdAt, project.updatedAt)}
                    </p>
                    {project.technologies.length > 0 ? (
                      <div className="flex flex-wrap gap-1.5 mt-3">
                        {project.technologies.map((tech) => (
                          <Badge key={tech} variant="secondary" className="rounded-md text-[10px]">
                            {tech}
                          </Badge>
                        ))}
                      </div>
                    ) : null}
                  </div>
                ))}
              </div>
            )}
          </CompanyLuxSection>

          <CompanyLuxSection title="Experience">
            <p className="text-sm text-muted-foreground italic">
              Structured work experience is not stored separately yet. Review graduation projects
              above for hands-on experience signals.
            </p>
          </CompanyLuxSection>
        </div>

        <div className="space-y-5">
          {recommendation ? (
            <CompanyAiMatchExplanationCard
              reasonSummary={recommendation.reasonSummary}
              highlights={recommendation.highlights}
              strengths={recommendation.strengths}
              alignedRoleName={recommendation.alignedRoleName}
              fallbackRole={request.roleNames[0] ?? student.roles[0] ?? null}
            />
          ) : null}

          <CompanyLuxSection title="Recommendation context" icon={Target}>
            <div className="space-y-4 text-sm">
              <div>
                <p className="cw-section-label mb-1">Project request</p>
                <p className="font-medium">{request.title}</p>
              </div>
              {recommendation ? (
                <div className="cw-context-row">
                  <span className="text-muted-foreground">Match score</span>
                  <span className="font-semibold tabular-nums">{recommendation.matchScore}%</span>
                </div>
              ) : null}
              {request.roleNames.length > 0 ? (
                <div>
                  <p className="cw-section-label mb-2">Requested roles</p>
                  <div className="flex flex-wrap gap-1.5">
                    {request.roleNames.map((role) => (
                      <Badge key={role} variant="outline" className="rounded-md text-xs font-normal">
                        {role}
                      </Badge>
                    ))}
                  </div>
                </div>
              ) : null}
              {recommendation && recommendation.relevantSkills.length > 0 ? (
                <div>
                  <p className="cw-section-label mb-2">Relevant skills for this request</p>
                  <div className="flex flex-wrap gap-1.5">
                    {recommendation.relevantSkills.map((skill) => (
                      <Badge key={skill} variant="secondary" className="rounded-md text-xs">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          </CompanyLuxSection>

          <div ref={contactRef}>
            <CompanyLuxSection title="Contact information" icon={Mail} id="contact">
              <CompanyStudentContactSection contact={contact} />
            </CompanyLuxSection>
          </div>
        </div>
      </div>
    </CompanyPageShell>
  );
}
