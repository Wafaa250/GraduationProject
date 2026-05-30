import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Bookmark,
  ChevronRight,
  Mail,
  Sparkles,
  Trash2,
  Users,
} from "lucide-react";
import toast from "react-hot-toast";
import { CompanyPageHeader } from "@/components/company/PageHeader";
import { CompanyPageShell } from "@/components/company/CompanyPageShell";
import { CompanyCardHeader } from "@/components/company/CompanyCardHeader";
import { CompanyWorkspaceLoading } from "@/components/company/CompanyWorkspaceLoading";
import { CompanySavedRecommendationsEmptyState } from "@/components/company/CompanySavedRecommendationsEmptyState";
import { CompanySavedRecommendationNoteField } from "@/components/company/CompanySavedRecommendationNoteField";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { CompatibilityRing } from "@/components/company/CompatibilityRing";
import {
  getCompanySavedRecommendations,
  parseApiErrorMessage,
  unsaveStudentRecommendation,
  unsaveTeamRecommendation,
  updateSavedStudentNote,
  updateSavedTeamNote,
  type CompanySavedStudentRecommendation,
  type CompanySavedTeamRecommendation,
} from "@/api/companyApi";
import { COMPANY_ROUTES } from "@/routes/paths";
import { mapStudentDiscoveryContact } from "@/lib/studentDiscoveryContact";
import { CompanyStudentContactSection } from "@/components/company/CompanyStudentContactSection";

type RequestGroup = {
  companyRequestId: number;
  requestTitle: string;
  students: CompanySavedStudentRecommendation[];
  teams: CompanySavedTeamRecommendation[];
  latestSavedAt: string;
};

function initials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function formatSavedAt(value: string): string {
  try {
    return new Date(value).toLocaleDateString(undefined, {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return "";
  }
}

function buildRequestGroups(
  students: CompanySavedStudentRecommendation[],
  teams: CompanySavedTeamRecommendation[],
): RequestGroup[] {
  const map = new Map<number, RequestGroup>();

  for (const item of students) {
    const existing = map.get(item.companyRequestId);
    if (existing) {
      existing.students.push(item);
      if (item.savedAt > existing.latestSavedAt) existing.latestSavedAt = item.savedAt;
    } else {
      map.set(item.companyRequestId, {
        companyRequestId: item.companyRequestId,
        requestTitle: item.requestTitle,
        students: [item],
        teams: [],
        latestSavedAt: item.savedAt,
      });
    }
  }

  for (const item of teams) {
    const existing = map.get(item.companyRequestId);
    if (existing) {
      existing.teams.push(item);
      if (item.savedAt > existing.latestSavedAt) existing.latestSavedAt = item.savedAt;
    } else {
      map.set(item.companyRequestId, {
        companyRequestId: item.companyRequestId,
        requestTitle: item.requestTitle,
        students: [],
        teams: [item],
        latestSavedAt: item.savedAt,
      });
    }
  }

  return Array.from(map.values()).sort(
    (a, b) => new Date(b.latestSavedAt).getTime() - new Date(a.latestSavedAt).getTime(),
  );
}

function savedSummary(students: number, teams: number): string {
  const parts: string[] = [];
  if (students > 0) {
    parts.push(`${students} student${students === 1 ? "" : "s"} saved`);
  }
  if (teams > 0) {
    parts.push(`${teams} team${teams === 1 ? "" : "s"} saved`);
  }
  return parts.join(" · ");
}

function SavedAuditMeta({ savedByName, savedAt }: { savedByName: string; savedAt: string }) {
  const formatted = formatSavedAt(savedAt);
  return (
    <p className="text-[11px] cw-text-secondary leading-snug">
      Saved by {savedByName}
      {formatted ? <> · {formatted}</> : null}
    </p>
  );
}

export function CompanySavedRecommendationsPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState<CompanySavedStudentRecommendation[]>([]);
  const [teams, setTeams] = useState<CompanySavedTeamRecommendation[]>([]);
  const [removingStudentId, setRemovingStudentId] = useState<number | null>(null);
  const [removingTeamId, setRemovingTeamId] = useState<number | null>(null);

  const groups = useMemo(() => buildRequestGroups(students, teams), [students, teams]);
  const totalCount = students.length + teams.length;

  const load = () => {
    setLoading(true);
    getCompanySavedRecommendations()
      .then((page) => {
        setStudents(page.students);
        setTeams(page.teams);
      })
      .catch((err) => {
        toast.error(parseApiErrorMessage(err) || "Failed to load saved recommendations.");
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const removeStudent = async (item: CompanySavedStudentRecommendation) => {
    setRemovingStudentId(item.id);
    try {
      await unsaveStudentRecommendation(item.companyRequestId, item.studentProfileId);
      setStudents((prev) => prev.filter((s) => s.id !== item.id));
      toast.success("Removed from saved");
    } catch (err) {
      toast.error(parseApiErrorMessage(err) || "Could not remove saved student.");
    } finally {
      setRemovingStudentId(null);
    }
  };

  const removeTeam = async (item: CompanySavedTeamRecommendation) => {
    setRemovingTeamId(item.id);
    try {
      await unsaveTeamRecommendation(item.companyRequestId, item.teamRecommendationId);
      setTeams((prev) => prev.filter((t) => t.id !== item.id));
      toast.success("Removed from saved");
    } catch (err) {
      toast.error(parseApiErrorMessage(err) || "Could not remove saved team.");
    } finally {
      setRemovingTeamId(null);
    }
  };

  const patchStudentNote = (item: CompanySavedStudentRecommendation, note: string | null) => {
    setStudents((prev) =>
      prev.map((s) => (s.id === item.id ? { ...s, note } : s)),
    );
    return updateSavedStudentNote(item.companyRequestId, item.studentProfileId, note);
  };

  const patchTeamNote = (item: CompanySavedTeamRecommendation, note: string | null) => {
    setTeams((prev) => prev.map((t) => (t.id === item.id ? { ...t, note } : t)));
    return updateSavedTeamNote(item.companyRequestId, item.teamRecommendationId, note);
  };

  return (
    <CompanyPageShell>
      <CompanyPageHeader
        title="Saved Recommendations"
        subtitle="Your workspace shortlist — students and teams saved from AI recommendations, organised by project request. Add notes before contacting externally."
        actions={
          totalCount > 0 ? (
            <Badge variant="secondary" className="cw-badge-ai rounded-md px-3 py-1 text-xs">
              {totalCount} saved across {groups.length} request{groups.length === 1 ? "" : "s"}
            </Badge>
          ) : null
        }
      />

      {loading ? (
        <Card className="cw-card-elevated">
          <CardContent className="cw-card-body">
            <CompanyWorkspaceLoading message="Loading your shortlist…" />
          </CardContent>
        </Card>
      ) : totalCount === 0 ? (
        <CompanySavedRecommendationsEmptyState />
      ) : (
        <div className="flex flex-col cw-grid-gap">
          {groups.map((group) => (
            <Card key={group.companyRequestId} className="cw-card-elevated cw-saved-group-card overflow-hidden">
              <CompanyCardHeader
                icon={Bookmark}
                title={group.requestTitle}
                description={savedSummary(group.students.length, group.teams.length)}
                action={
                  <Button asChild variant="outline" size="sm" className="rounded-xl cw-btn-outline">
                    <Link to={COMPANY_ROUTES.requestRecommendations(group.companyRequestId)}>
                      Open matches
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Link>
                  </Button>
                }
              />

              <CardContent className="cw-card-body cw-card-body--flush-top">
                <div className="flex flex-col cw-grid-gap">
                {group.teams.length > 0 ? (
                  <section className="space-y-4">
                    <div className="text-xs cw-section-label flex items-center gap-1.5">
                      <Users className="h-3.5 w-3.5" aria-hidden />
                      Saved teams
                    </div>
                    <div className="grid sm:grid-cols-2 cw-grid-gap-compact">
                      {group.teams.map((item) => (
                        <div
                          key={item.id}
                          className="cw-saved-item-card flex flex-col h-full"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex gap-3 min-w-0">
                              <div className="cw-icon-container shrink-0">
                                <Users className="h-5 w-5" aria-hidden />
                              </div>
                              <div className="min-w-0">
                                <h3 className="font-semibold text-foreground">Team #{item.teamRank}</h3>
                                <p className="text-xs cw-text-secondary mt-0.5">
                                  {item.memberCount} members · {item.roleCoverageScore}% role coverage
                                </p>
                              </div>
                            </div>
                            <CompatibilityRing value={item.totalScore} size={44} />
                          </div>

                          {item.summaryReason ? (
                            <p className="text-xs cw-text-secondary mt-3 line-clamp-2 leading-relaxed">
                              {item.summaryReason}
                            </p>
                          ) : null}

                          {item.memberNames.length > 0 ? (
                            <div className="flex flex-wrap gap-1 mt-3">
                              {item.memberNames.slice(0, 5).map((name) => (
                                <Badge
                                  key={name}
                                  variant="secondary"
                                  className="rounded-md text-[10px]"
                                >
                                  {name}
                                </Badge>
                              ))}
                            </div>
                          ) : null}

                          <div className="mt-3 pt-3 border-t border-border/50">
                            <SavedAuditMeta savedByName={item.savedByName} savedAt={item.savedAt} />
                            <CompanySavedRecommendationNoteField
                              value={item.note}
                              onSave={(note) => patchTeamNote(item, note)}
                              className="mt-1.5"
                            />
                          </div>

                          <div className="flex gap-2 mt-3 pt-1">
                            <Button
                              asChild
                              size="sm"
                              className="rounded-xl flex-1 cw-btn-gradient border-0 shadow-sm"
                            >
                              <Link
                                to={COMPANY_ROUTES.teamDiscoveryProfile(
                                  item.companyRequestId,
                                  item.teamRecommendationId,
                                )}
                              >
                                <Sparkles className="h-3.5 w-3.5 mr-1" />
                                View team
                              </Link>
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              variant="ghost"
                              className="rounded-xl shrink-0 text-muted-foreground hover:text-destructive"
                              disabled={removingTeamId === item.id}
                              onClick={() => void removeTeam(item)}
                              aria-label="Unsave team"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>
                ) : null}

                {group.students.length > 0 ? (
                  <section className="space-y-4">
                    <div className="text-xs cw-section-label flex items-center gap-1.5">
                      <Bookmark className="h-3.5 w-3.5" aria-hidden />
                      Saved students
                    </div>
                    <div className="grid sm:grid-cols-2 cw-grid-gap-compact">
                      {group.students.map((item) => (
                        <div
                          key={item.id}
                          className="cw-saved-item-card flex flex-col h-full"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex gap-3 min-w-0">
                              <Avatar className="h-11 w-11 shrink-0">
                                <AvatarFallback className="cw-candidate-avatar-fallback text-sm">
                                  {initials(item.studentName)}
                                </AvatarFallback>
                              </Avatar>
                              <div className="min-w-0">
                                <h3 className="font-semibold truncate text-foreground">{item.studentName}</h3>
                                <p className="text-xs cw-text-secondary truncate">
                                  {[item.major, item.university].filter(Boolean).join(" · ")}
                                </p>
                              </div>
                            </div>
                            {item.matchScore != null ? (
                              <CompatibilityRing value={item.matchScore} size={44} />
                            ) : null}
                          </div>

                          {item.reasonSummary ? (
                            <p className="text-xs cw-text-secondary mt-3 line-clamp-2 leading-relaxed">
                              {item.reasonSummary}
                            </p>
                          ) : null}

                          <div className="mt-3 pt-3 border-t border-border/60">
                            <CompanyStudentContactSection
                              contact={mapStudentDiscoveryContact({
                                email: item.email,
                                linkedin: item.linkedin,
                                github: item.github,
                                portfolio: item.portfolio,
                              })}
                              compact
                            />
                          </div>

                          <div className="mt-3 pt-3 border-t border-border/50">
                            <SavedAuditMeta savedByName={item.savedByName} savedAt={item.savedAt} />
                            <CompanySavedRecommendationNoteField
                              value={item.note}
                              onSave={(note) => patchStudentNote(item, note)}
                              className="mt-1.5"
                            />
                          </div>

                          <div className="flex gap-2 mt-3 pt-1">
                            <Button
                              type="button"
                              size="sm"
                              className="rounded-xl flex-1 cw-btn-gradient border-0 shadow-sm"
                              onClick={() =>
                                navigate(
                                  COMPANY_ROUTES.studentDiscoveryProfile(
                                    item.companyRequestId,
                                    item.studentProfileId,
                                  ),
                                )
                              }
                            >
                              <Mail className="h-3.5 w-3.5 mr-1" />
                              View profile
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              variant="ghost"
                              className="rounded-xl shrink-0 text-muted-foreground hover:text-destructive"
                              disabled={removingStudentId === item.id}
                              onClick={() => void removeStudent(item)}
                              aria-label="Unsave student"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>
                ) : null}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </CompanyPageShell>
  );
}
