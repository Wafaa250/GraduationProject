import { useEffect, useMemo, useState, useCallback } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import {
  UserRound,
  UsersRound,
  ArrowRight,
  ArrowLeft,
  Plus,
  Trash2,
  CheckCircle2,
} from "lucide-react";
import toast from "react-hot-toast";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CompanyPageHeader } from "@/components/company/PageHeader";
import { CompanyRequestStepper } from "@/components/company/CompanyRequestStepper";
import { CompanyRequestReviewStat } from "@/components/company/CompanyRequestReviewStat";
import { CompanyRequestReviewAiBanner } from "@/components/company/CompanyRequestReviewAiBanner";
import { SearchableSelect } from "@/components/company/SearchableSelect";
import { cn } from "@/lib/utils";
import { MultiSelectTags } from "@/components/company/MultiSelectTags";
import { COMPANY_ROUTES } from "@/routes/paths";
import {
  PROJECT_CATEGORIES,
  COMPANY_ROLE_OPTIONS,
  COMPANY_SKILL_OPTIONS,
  resolveProjectCategory,
  buildDurationLabel,
  COLLABORATION_FORMATS,
  collaborationFormatLabel,
  type DurationUnit,
} from "@/constants/companyRequestCatalog";
import { DurationFields } from "@/components/company/DurationFields";
import {
  createCompanyProjectRequest,
  getCompanyProjectRequest,
  getCompanyRequestDraft,
  saveCompanyRequestDraft,
  updateCompanyProjectRequest,
  parseApiErrorMessage,
  type CompanyRequestType,
} from "@/api/companyApi";
import {
  applyDetailToWizardState,
  buildSaveDraftPayload,
  emptyTeamRole,
  type WizardTeamRole,
} from "@/lib/companyRequestPayload";
import { formatDraftSavedAt, requestTypeLabel } from "@/lib/companyRequestDisplay";

const steps = ["Request Type", "Project basics", "Roles & skills", "Scope", "Review"];

const newRole = emptyTeamRole;

export function CompanyNewRequestPage() {
  const nav = useNavigate();
  const location = useLocation();
  const { id: routeId } = useParams<{ id: string }>();
  const isEdit = location.pathname.endsWith("/edit");
  const editRequestId =
    isEdit && routeId && Number.isFinite(Number(routeId)) && Number(routeId) > 0
      ? Number(routeId)
      : null;

  const [step, setStep] = useState(0);
  const [created, setCreated] = useState(false);
  const [savedRequestId, setSavedRequestId] = useState<number | null>(null);

  const [type, setType] = useState<CompanyRequestType | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [categoryChoice, setCategoryChoice] = useState("");
  const [categoryOther, setCategoryOther] = useState("");

  const [targetRole, setTargetRole] = useState("");
  const [individualSkills, setIndividualSkills] = useState<string[]>([]);

  const [teamRoles, setTeamRoles] = useState<WizardTeamRole[]>([newRole(), newRole()]);
  const [draftLoading, setDraftLoading] = useState(true);
  const [draftUpdatedAt, setDraftUpdatedAt] = useState<string | null>(null);
  const [savingDraft, setSavingDraft] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [durationOngoing, setDurationOngoing] = useState(false);
  const [durationValue, setDurationValue] = useState<number | "">("");
  const [durationUnit, setDurationUnit] = useState<DurationUnit | "">("");
  const [collaborationType, setCollaborationType] = useState("");
  const [scopeNotes, setScopeNotes] = useState("");

  const resolvedCategory = resolveProjectCategory(categoryChoice, categoryOther);

  const applyWizardState = useCallback((partial: ReturnType<typeof applyDetailToWizardState>) => {
    if (partial.step !== undefined) setStep(partial.step);
    if (partial.type !== undefined) setType(partial.type);
    if (partial.title !== undefined) setTitle(partial.title);
    if (partial.description !== undefined) setDescription(partial.description);
    if (partial.categoryChoice !== undefined) setCategoryChoice(partial.categoryChoice);
    if (partial.categoryOther !== undefined) setCategoryOther(partial.categoryOther);
    if (partial.targetRole !== undefined) setTargetRole(partial.targetRole);
    if (partial.individualSkills !== undefined) setIndividualSkills(partial.individualSkills);
    if (partial.teamRoles !== undefined) setTeamRoles(partial.teamRoles);
    if (partial.durationOngoing !== undefined) setDurationOngoing(partial.durationOngoing);
    if (partial.durationValue !== undefined) setDurationValue(partial.durationValue);
    if (partial.durationUnit !== undefined) setDurationUnit(partial.durationUnit);
    if (partial.collaborationType !== undefined) setCollaborationType(partial.collaborationType);
    if (partial.scopeNotes !== undefined) setScopeNotes(partial.scopeNotes);
  }, []);

  useEffect(() => {
    let cancelled = false;

    const finish = () => {
      if (!cancelled) setDraftLoading(false);
    };

    if (editRequestId) {
      getCompanyProjectRequest(editRequestId)
        .then((detail) => {
          if (cancelled) return;
          if (detail.status === "draft") {
            toast.error("This request is still a draft. Continue from Create Request.");
            nav(COMPANY_ROUTES.newRequest);
            return;
          }
          applyWizardState(applyDetailToWizardState(detail));
        })
        .catch((err) => {
          if (!cancelled) toast.error(parseApiErrorMessage(err));
        })
        .finally(finish);
      return () => {
        cancelled = true;
      };
    }

    getCompanyRequestDraft()
      .then((draft) => {
        if (cancelled || !draft) return;
        applyWizardState(applyDetailToWizardState(draft));
        if (draft.updatedAt) setDraftUpdatedAt(draft.updatedAt);
        toast.success("Draft restored");
      })
      .catch((err) => {
        if (!cancelled) toast.error(parseApiErrorMessage(err));
      })
      .finally(finish);

    return () => {
      cancelled = true;
    };
  }, [applyWizardState, editRequestId, nav]);

  const reviewSkills = useMemo(() => {
    const skills =
      type === "individual"
        ? individualSkills
        : teamRoles.flatMap((r) => r.skills);
    return [...new Set(skills)];
  }, [type, individualSkills, teamRoles]);

  const rolesTakenByOthers = (excludeId: string) =>
    teamRoles.filter((r) => r.id !== excludeId && r.roleName).map((r) => r.roleName);

  const canContinue = (): boolean => {
    if (step === 0) return type !== null;
    if (step === 1) {
      const hasCategory =
        categoryChoice.length > 0 &&
        (categoryChoice !== "Other" || categoryOther.trim().length > 0);
      return title.trim().length > 0 && description.trim().length > 0 && hasCategory;
    }
    if (step === 2) {
      if (type === "individual") {
        return targetRole.trim().length > 0 && individualSkills.length > 0;
      }
      if (type === "ai-built-team") {
        return (
          teamRoles.length > 0 &&
          teamRoles.every((r) => r.roleName.trim().length > 0 && r.skills.length > 0)
        );
      }
    }
    if (step === 3) {
      const durationOk =
        durationOngoing ||
        (typeof durationValue === "number" &&
          durationValue >= 1 &&
          durationUnit.length > 0);
      return durationOk && collaborationType.length > 0;
    }
    return true;
  };

  const durationLabel = buildDurationLabel(durationOngoing, durationValue, durationUnit);

  const formState = () => ({
    step,
    type,
    title,
    description,
    categoryChoice,
    categoryOther,
    targetRole,
    individualSkills,
    teamRoles,
    durationOngoing,
    durationValue,
    durationUnit,
    collaborationType,
    scopeNotes,
  });

  const saveDraft = async () => {
    setSavingDraft(true);
    try {
      const saved = await saveCompanyRequestDraft(buildSaveDraftPayload(formState()));
      if (saved.updatedAt) setDraftUpdatedAt(saved.updatedAt);
      toast.success("Draft saved");
    } catch (err) {
      toast.error(parseApiErrorMessage(err));
    } finally {
      setSavingDraft(false);
    }
  };

  const submit = async () => {
    if (!type) return;
    setSubmitting(true);
    try {
      const payload = buildSaveDraftPayload(formState());
      if (editRequestId) {
        await updateCompanyProjectRequest(editRequestId, {
          ...payload,
          requestType: type,
        });
        setSavedRequestId(editRequestId);
        setCreated(true);
        toast.success("Request updated");
      } else {
        const createdRequest = await createCompanyProjectRequest({
          ...payload,
          requestType: type,
        });
        setSavedRequestId(createdRequest.id);
        setCreated(true);
        toast.success("Project request created");
      }
    } catch (err) {
      toast.error(parseApiErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  if (created) {
    return (
      <div className="p-6 md:p-8 max-w-2xl mx-auto">
        <Card className="cw-card-elevated">
          <CardContent className="p-10 md:p-12 text-center">
            <div className="cw-request-success-icon mb-5">
              <CheckCircle2 className="h-9 w-9" aria-hidden />
            </div>
            <h2 className="text-xl font-semibold tracking-tight">
              {editRequestId ? "Request updated" : "Request created"}
            </h2>
            <p className="text-sm text-muted-foreground mt-2 max-w-md mx-auto leading-relaxed">
              {editRequestId
                ? "Your changes are saved. You can return to the request or find matching students when AI matching is available."
                : "Your project request is saved. SkillSwap AI will recommend students based on your roles and skills when matching is available."}
            </p>
            <div className="flex flex-wrap justify-center gap-3 mt-8">
              {savedRequestId && (
                <Button asChild className="rounded-xl cw-btn-gradient shadow-sm">
                  <Link to={COMPANY_ROUTES.requestDetail(savedRequestId)}>View request</Link>
                </Button>
              )}
              <Button asChild variant="outline" className="rounded-xl">
                <Link to={COMPANY_ROUTES.requests}>All requests</Link>
              </Button>
              <Button
                variant="outline"
                className="rounded-xl"
                onClick={() => nav(COMPANY_ROUTES.dashboard)}
              >
                Back to dashboard
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto">
      <CompanyPageHeader
        title={isEdit ? "Edit Project Request" : "Create Project Request"}
        subtitle={
          isEdit
            ? "Update your project details, roles, and scope. Changes apply to this request immediately."
            : "Describe what you need — from any field or industry. SkillSwap matches university students to your roles."
        }
        actions={
          isEdit && editRequestId ? (
            <Button asChild variant="outline" className="rounded-xl">
              <Link to={COMPANY_ROUTES.requestDetail(editRequestId)}>Cancel</Link>
            </Button>
          ) : undefined
        }
      />

      <CompanyRequestStepper steps={steps} current={step} />

      {draftLoading ? (
        <Card className="cw-card-elevated">
          <CardContent className="py-16 text-center text-sm text-muted-foreground">
            Loading draft…
          </CardContent>
        </Card>
      ) : (
      <Card className="cw-card-elevated">
        <CardContent className="p-6 md:p-8 lg:p-10">
          <div key={step} className="cw-request-step-content">
          {step === 0 && (
            <div className="grid md:grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setType("individual")}
                className={cn(
                  "cw-request-type-card",
                  type === "individual" && "is-selected",
                )}
              >
                <div className="cw-request-type-icon mb-4">
                  <UserRound className="h-6 w-6" />
                </div>
                <div className="font-semibold">Individual Contributor</div>
                <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                  One student for a specific role on your project.
                </p>
              </button>
              <button
                type="button"
                onClick={() => setType("ai-built-team")}
                className={cn(
                  "cw-request-type-card",
                  type === "ai-built-team" && "is-selected",
                )}
              >
                <div className="cw-request-type-icon mb-4">
                  <UsersRound className="h-6 w-6" />
                </div>
                <div className="font-semibold">AI-Built Team</div>
                <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                  Multiple required roles — AI suggests separate students per role to form a team
                  composition.
                </p>
              </button>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-5">
              <div>
                <Label className="text-sm font-medium">Project title</Label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Mobile booking app MVP"
                  className="rounded-xl mt-1.5"
                />
              </div>
              <div>
                <Label className="text-sm font-medium">Description</Label>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                  placeholder="What should collaborators build or contribute?"
                  className="rounded-xl mt-1.5"
                />
              </div>
              <SearchableSelect
                label="Category"
                value={categoryChoice}
                onChange={setCategoryChoice}
                options={PROJECT_CATEGORIES}
                placeholder="Search categories…"
              />
              {categoryChoice === "Other" && (
                <div>
                  <Label className="text-sm font-medium">Custom category</Label>
                  <Input
                    value={categoryOther}
                    onChange={(e) => setCategoryOther(e.target.value)}
                    placeholder="Describe your project category"
                    className="rounded-xl mt-1.5"
                  />
                </div>
              )}
            </div>
          )}

          {step === 2 && type === "individual" && (
            <div className="space-y-5">
              <SearchableSelect
                label="Role"
                value={targetRole}
                onChange={setTargetRole}
                options={COMPANY_ROLE_OPTIONS}
                placeholder="Search or select a role..."
                allowCustom
              />
              <MultiSelectTags
                label="Required skills & tools"
                selected={individualSkills}
                onChange={setIndividualSkills}
                options={COMPANY_SKILL_OPTIONS}
                placeholder="Search skills..."
              />
            </div>
          )}

          {step === 2 && type === "ai-built-team" && (
            <div className="space-y-4">
              {teamRoles.map((role) => {
                const taken = rolesTakenByOthers(role.id);
                const roleOptions = COMPANY_ROLE_OPTIONS.filter(
                  (o) =>
                    o.toLowerCase() === role.roleName.toLowerCase() ||
                    !taken.some((t) => t.toLowerCase() === o.toLowerCase()),
                );

                return (
                  <div key={role.id} className="cw-request-role-card space-y-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h3 className="text-base font-semibold text-foreground leading-tight">
                          {role.roleName || "Select a role"}
                        </h3>
                        {role.roleName && role.skills.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {role.skills.map((s) => (
                              <Badge
                                key={s}
                                variant="outline"
                                className="text-[10px] rounded-md font-normal"
                              >
                                {s}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                      {teamRoles.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-8 shrink-0 text-muted-foreground"
                          onClick={() =>
                            setTeamRoles((prev) => prev.filter((r) => r.id !== role.id))
                          }
                          aria-label="Remove role"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </div>

                    <SearchableSelect
                      label="Role"
                      value={role.roleName}
                      onChange={(name) =>
                        setTeamRoles((prev) =>
                          prev.map((r) => (r.id === role.id ? { ...r, roleName: name } : r)),
                        )
                      }
                      options={roleOptions}
                      placeholder="Search or select a role..."
                      allowCustom
                    />

                    <MultiSelectTags
                      label="Skills for this role"
                      selected={role.skills}
                      onChange={(skills) =>
                        setTeamRoles((prev) =>
                          prev.map((r) => (r.id === role.id ? { ...r, skills } : r)),
                        )
                      }
                      options={COMPANY_SKILL_OPTIONS}
                      placeholder="Search skills…"
                    />

                    <div>
                      <Label className="text-sm font-medium">Optional notes</Label>
                      <Textarea
                        value={role.notes ?? ""}
                        onChange={(e) =>
                          setTeamRoles((prev) =>
                            prev.map((r) =>
                              r.id === role.id ? { ...r, notes: e.target.value } : r,
                            ),
                          )
                        }
                        rows={2}
                        placeholder="Scope, seniority, or collaboration expectations"
                        className="rounded-xl mt-1.5"
                      />
                    </div>
                  </div>
                );
              })}
              <Button
                type="button"
                variant="outline"
                className="rounded-xl w-full border-dashed"
                onClick={() => setTeamRoles((prev) => [...prev, newRole()])}
              >
                <Plus className="h-4 w-4 mr-1" /> Add another role
              </Button>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-5">
              <DurationFields
                ongoing={durationOngoing}
                onOngoingChange={setDurationOngoing}
                value={durationValue}
                onValueChange={setDurationValue}
                unit={durationUnit}
                onUnitChange={setDurationUnit}
              />
              <div>
                <Label className="text-sm font-medium">Collaboration format</Label>
                <Select value={collaborationType} onValueChange={setCollaborationType}>
                  <SelectTrigger className="rounded-xl mt-1.5">
                    <SelectValue placeholder="Select format" />
                  </SelectTrigger>
                  <SelectContent>
                    {COLLABORATION_FORMATS.map((f) => (
                      <SelectItem key={f.value} value={f.value}>
                        {f.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-sm font-medium">Additional notes (optional)</Label>
                <Textarea
                  value={scopeNotes}
                  onChange={(e) => setScopeNotes(e.target.value)}
                  rows={3}
                  placeholder="Meeting cadence, deliverables, or anything else students should know"
                  className="rounded-xl mt-1.5"
                />
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-6">
              <div className="cw-request-review-hero">
                <p className="text-[10px] uppercase tracking-wide text-muted-foreground font-semibold">
                  Summary
                </p>
                <h3 className="text-xl md:text-2xl font-semibold mt-2 tracking-tight">
                  {title.trim() || "Untitled project request"}
                </h3>
                <p className="text-sm text-muted-foreground mt-2 leading-relaxed max-w-2xl">
                  {description.trim() || "No description provided."}
                </p>
                <div
                  className={cn(
                    "grid gap-3 mt-5",
                    draftUpdatedAt ? "sm:grid-cols-2 lg:grid-cols-3" : "sm:grid-cols-2",
                  )}
                >
                  <CompanyRequestReviewStat
                    label="Type"
                    value={type ? requestTypeLabel(type) : "—"}
                  />
                  <CompanyRequestReviewStat
                    label="Category"
                    value={resolvedCategory || "—"}
                  />
                  <CompanyRequestReviewStat
                    label="Duration"
                    value={durationLabel || "—"}
                  />
                  <CompanyRequestReviewStat
                    label="Format"
                    value={collaborationFormatLabel(collaborationType) || "—"}
                  />
                  {draftUpdatedAt && (
                    <>
                      <CompanyRequestReviewStat label="Status" value="Draft" />
                      <CompanyRequestReviewStat
                        label="Last saved"
                        value={formatDraftSavedAt(draftUpdatedAt)}
                      />
                    </>
                  )}
                </div>
              </div>

              <div className="cw-request-review-section">
                <p className="cw-request-review-section-title">Requirements</p>
                {type === "individual" && (
                  <div className="space-y-4">
                    <div>
                      <p className="text-[10px] uppercase tracking-wide text-muted-foreground font-medium mb-1">
                        Role
                      </p>
                      <p className="font-semibold text-base">{targetRole || "—"}</p>
                    </div>
                  </div>
                )}
                {type === "ai-built-team" && (
                  <div className="space-y-3">
                    {teamRoles.map((r) => (
                      <div
                        key={r.id}
                        className="rounded-lg border bg-secondary/20 px-4 py-3 space-y-2"
                      >
                        <p className="font-semibold text-sm">{r.roleName || "—"}</p>
                        {r.skills.length > 0 && (
                          <div className="flex flex-wrap gap-1.5">
                            {r.skills.map((s) => (
                              <Badge
                                key={s}
                                className="cw-request-skill-badge rounded-md text-xs"
                              >
                                {s}
                              </Badge>
                            ))}
                          </div>
                        )}
                        {r.notes?.trim() && (
                          <p className="text-xs text-muted-foreground leading-relaxed">
                            {r.notes}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
                {reviewSkills.length > 0 && (
                  <div className={cn(type && "mt-5 pt-5 border-t")}>
                    <p className="text-[10px] uppercase tracking-wide text-muted-foreground font-medium mb-2">
                      Skills
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {reviewSkills.map((s) => (
                        <Badge key={s} className="cw-request-skill-badge rounded-md text-xs">
                          {s}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {scopeNotes.trim() && (
                <div className="cw-request-review-section">
                  <p className="cw-request-review-section-title">Additional notes</p>
                  <p className="text-sm leading-relaxed">{scopeNotes}</p>
                </div>
              )}

              <CompanyRequestReviewAiBanner />
            </div>
          )}
          </div>

          <div className="flex items-center justify-between mt-8 pt-6 border-t gap-3">
            <Button
              variant="ghost"
              className="rounded-xl"
              disabled={step === 0}
              onClick={() => setStep((s) => Math.max(0, s - 1))}
            >
              <ArrowLeft className="h-4 w-4 mr-1" /> Back
            </Button>
            {step < steps.length - 1 ? (
              <Button
                className="rounded-xl cw-btn-gradient shadow-sm"
                disabled={!canContinue()}
                onClick={() => setStep((s) => Math.min(steps.length - 1, s + 1))}
              >
                Continue <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            ) : (
              <div className="flex flex-wrap items-center justify-end gap-2">
                {!isEdit && (
                  <Button
                    variant="outline"
                    className="rounded-xl"
                    onClick={saveDraft}
                    disabled={savingDraft || submitting}
                  >
                    {savingDraft ? "Saving…" : "Save draft"}
                  </Button>
                )}
                <Button
                  className="rounded-xl cw-btn-gradient shadow-sm"
                  onClick={submit}
                  disabled={submitting || savingDraft}
                >
                  {submitting
                    ? isEdit
                      ? "Saving…"
                      : "Creating…"
                    : isEdit
                      ? "Save changes"
                      : "Create Request"}
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
      )}
    </div>
  );
}
