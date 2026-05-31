import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import {
  ArrowLeft,
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { CompanyPageShell } from "@/components/company/CompanyPageShell";
import { cwLayout } from "@/lib/companyLayout";
import { cn } from "@/lib/utils";
import { CompanyMatchScoreBadge } from "@/components/company/CompanyMatchScoreBadge";
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
      <p className="text-[10px] uppercase tracking-wide text-muted-foreground font-semibold mb-2">
        {label}
      </p>
      <div className="flex flex-wrap gap-1.5">
        {items.map((item) => (
          <Badge
            key={`${label}-${item}`}
            className="cw-candidate-skill-badge rounded-md text-xs font-normal"
          >
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
      <CompanyPageShell>
        <p className={cn(cwLayout.statePadding, "text-sm text-muted-foreground")}>
          Loading student profile…
        </p>
      </CompanyPageShell>
    );
  }

  if (error || !profile) {
    return (
      <CompanyPageShell>
        <div className={cn(cwLayout.statePadding, "text-center")}>
          <p className="text-sm text-muted-foreground">{error ?? "Profile not found."}</p>
          <Button asChild variant="outline" className="rounded-xl mt-6">
            <Link to={backHref}>Back to recommendations</Link>
          </Button>
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
    <CompanyPageShell>
      <Button asChild variant="ghost" size="sm" className="mb-4 -ml-3 rounded-xl">
        <Link to={backHref}>
          <ArrowLeft className="h-4 w-4 mr-1.5" />
          {Number.isFinite(teamId) && teamId! > 0 ? "Back to team" : "Back to recommendations"}
        </Link>
      </Button>

      {/* Header hero — Lovable structure */}
      <Card className="cw-card-elevated overflow-hidden mb-6 border-primary/20">
        <div className="h-24 cw-hero-bg relative opacity-95">
          <div className="absolute inset-0 cw-hero-overlay" />
        </div>
        <CardContent className="p-6 pt-0">
          <div className="flex flex-col md:flex-row md:items-end gap-5 -mt-12">
            <Avatar className="h-24 w-24 rounded-2xl ring-4 ring-card shadow-lg shrink-0">
              {student.profilePictureBase64 ? (
                <AvatarImage src={student.profilePictureBase64} alt="" className="object-cover" />
              ) : null}
              <AvatarFallback className="rounded-2xl text-2xl font-semibold cw-candidate-avatar-fallback">
                {initials(student.name)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0 md:pb-2">
              <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">{student.name}</h1>
              <p className="text-muted-foreground mt-0.5">{roleTitle}</p>
              <div className="flex gap-4 text-xs text-muted-foreground mt-2 flex-wrap">
                {student.university && (
                  <span className="flex items-center gap-1">
                    <GraduationCap className="h-3.5 w-3.5 shrink-0" />
                    {student.university}
                  </span>
                )}
                {student.major && (
                  <span>
                    {student.major}
                    {student.academicYear ? ` · ${student.academicYear}` : ""}
                  </span>
                )}
                {student.availability && (
                  <span className="flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5 shrink-0" />
                    {student.availability}
                  </span>
                )}
                {student.languages.length > 0 && (
                  <span className="flex items-center gap-1">
                    <Globe className="h-3.5 w-3.5 shrink-0" />
                    {student.languages.join(", ")}
                  </span>
                )}
              </div>
            </div>
            {recommendation && (
              <div className="shrink-0 md:pb-2">
                <CompanyMatchScoreBadge score={matchScore} size="lg" />
              </div>
            )}
          </div>

          <div className="flex flex-wrap gap-2 mt-5">
            <Button
              type="button"
              className={cn(
                "rounded-xl",
                saved ? "variant-outline" : "cw-btn-gradient border-0 shadow-sm",
              )}
              variant={saved ? "outline" : "default"}
              onClick={handleSave}
            >
              <Bookmark className={cn("h-4 w-4 mr-1.5", saved && "fill-current")} />
              {saved ? "Saved" : "Save Recommendation"}
            </Button>
            <Button
              type="button"
              variant="outline"
              className="rounded-xl"
              onClick={handleCompare}
            >
              <GitCompare className="h-4 w-4 mr-1.5" />
              {inCompare ? "In Compare" : "Add to Compare"}
            </Button>
            <Button
              type="button"
              variant="outline"
              className="rounded-xl"
              onClick={scrollToContact}
              disabled={!hasContact}
            >
              <Mail className="h-4 w-4 mr-1.5" />
              View Contact Information
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className={cn("grid lg:grid-cols-3", cwLayout.grid)}>
        <div className="lg:col-span-2 space-y-6">
          <Card className="cw-card-elevated">
            <CardHeader>
              <CardTitle className="text-base">About</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {student.bio ? (
                <p className="text-muted-foreground leading-relaxed text-sm">{student.bio}</p>
              ) : (
                <p className="text-sm text-muted-foreground italic">No bio provided yet.</p>
              )}
              <dl className="grid sm:grid-cols-2 gap-3 text-sm">
                {student.university && (
                  <div>
                    <dt className="text-xs text-muted-foreground">University</dt>
                    <dd className="font-medium mt-0.5">{student.university}</dd>
                  </div>
                )}
                {student.faculty && (
                  <div>
                    <dt className="text-xs text-muted-foreground">Faculty</dt>
                    <dd className="font-medium mt-0.5">{student.faculty}</dd>
                  </div>
                )}
                {student.major && (
                  <div>
                    <dt className="text-xs text-muted-foreground">Major / specialization</dt>
                    <dd className="font-medium mt-0.5">{student.major}</dd>
                  </div>
                )}
                {student.academicYear && (
                  <div>
                    <dt className="text-xs text-muted-foreground">Academic year</dt>
                    <dd className="font-medium mt-0.5">{student.academicYear}</dd>
                  </div>
                )}
              </dl>
            </CardContent>
          </Card>

          <Card className="cw-card-elevated">
            <CardHeader>
              <CardTitle className="text-base">Skills</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <SkillGroup label="Roles" items={student.roles} />
              <SkillGroup label="Technical skills" items={student.technicalSkills} />
              <SkillGroup label="Tools" items={student.tools} />
              {student.lookingFor && (
                <div>
                  <p className="text-[10px] uppercase tracking-wide text-muted-foreground font-semibold mb-2">
                    Focus areas
                  </p>
                  <p className="text-sm text-muted-foreground leading-relaxed">{student.lookingFor}</p>
                </div>
              )}
              {student.roles.length === 0 &&
                student.technicalSkills.length === 0 &&
                student.tools.length === 0 && (
                  <p className="text-sm text-muted-foreground italic">No skills listed on profile.</p>
                )}
            </CardContent>
          </Card>

          <Card className="cw-card-elevated">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Briefcase className="h-4 w-4 text-primary" />
                Projects
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {projects.length === 0 ? (
                <p className="text-sm text-muted-foreground italic">No projects listed yet.</p>
              ) : (
                projects.map((project) => (
                  <div
                    key={project.id}
                    className="rounded-xl border border-border/60 p-4 hover:border-primary/30 transition-colors"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <h4 className="font-semibold text-sm">{project.title}</h4>
                      <Badge variant="outline" className="rounded-md text-[10px] font-normal shrink-0">
                        {project.teamRole}
                      </Badge>
                    </div>
                    {project.projectType && (
                      <p className="text-[11px] text-muted-foreground mt-0.5">{project.projectType}</p>
                    )}
                    {project.description && (
                      <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
                        {project.description}
                      </p>
                    )}
                    <p className="text-[11px] text-muted-foreground mt-2">
                      {formatProjectDates(project.createdAt, project.updatedAt)}
                    </p>
                    {project.technologies.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-3">
                        {project.technologies.map((tech) => (
                          <span
                            key={tech}
                            className="text-[11px] px-2 py-0.5 rounded-md cw-candidate-skill-badge border-0"
                          >
                            {tech}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <Card className="cw-card-elevated">
            <CardHeader>
              <CardTitle className="text-base">Experience</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground italic">
                Structured work experience is not stored separately yet. Review graduation projects
                above for hands-on experience signals.
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          {recommendation && (
            <CompanyAiMatchExplanationCard
              reasonSummary={recommendation.reasonSummary}
              highlights={recommendation.highlights}
              strengths={recommendation.strengths}
              alignedRoleName={recommendation.alignedRoleName}
              fallbackRole={request.roleNames[0] ?? student.roles[0] ?? null}
            />
          )}

          <Card className="cw-card-elevated">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Target className="h-4 w-4 text-primary" />
                Recommendation context
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div>
                <p className="text-xs text-muted-foreground">Project request</p>
                <p className="font-medium mt-0.5">{request.title}</p>
              </div>
              {recommendation && (
                <div className="flex items-center justify-between gap-3 rounded-xl border border-border/60 px-3 py-2.5">
                  <span className="text-muted-foreground">Match score</span>
                  <span className="font-semibold tabular-nums">{recommendation.matchScore}%</span>
                </div>
              )}
              {request.roleNames.length > 0 && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1.5">Requested roles</p>
                  <div className="flex flex-wrap gap-1.5">
                    {request.roleNames.map((role) => (
                      <Badge key={role} variant="outline" className="rounded-md text-xs font-normal">
                        {role}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              {recommendation && recommendation.relevantSkills.length > 0 && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1.5">Relevant skills for this request</p>
                  <div className="flex flex-wrap gap-1.5">
                    {recommendation.relevantSkills.map((skill) => (
                      <Badge
                        key={skill}
                        className="cw-candidate-skill-badge rounded-md text-xs border-0"
                      >
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <div id="contact" ref={contactRef}>
            <Card className="cw-card-elevated">
              <CardHeader>
                <CardTitle className="text-base">Contact information</CardTitle>
              </CardHeader>
              <CardContent>
                <CompanyStudentContactSection contact={contact} />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </CompanyPageShell>
  );
}
