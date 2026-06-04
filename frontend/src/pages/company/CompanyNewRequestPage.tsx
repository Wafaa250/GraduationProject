import { useEffect, useMemo, useState, useCallback } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import {
  UserRound,
  UsersRound,
  ArrowRight,
  ArrowLeft,
  Plus,
  CheckCircle2,
} from "lucide-react";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CompanyPageShell } from "@/components/company/CompanyPageShell";
import { CompanySkeleton } from "@/components/company/CompanySkeleton";
import { cwLayout } from "@/lib/companyLayout";
import { CompanyRequestStepper } from "@/components/company/CompanyRequestStepper";
import {
  CompanyRequestWizardLayout,
} from "@/components/company/CompanyRequestWizardLayout";
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
  WizardStepPanel,
  WizardFormSection,
  WizardFormField,
  WizardFormPanel,
  WizardRoleCard,
  WizardAddRoleButton,
} from "@/components/company/CompanyWizardForm";
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
import {
  formatDraftSavedAt,
  getRequestLifecycleStatus,
  isRequestViewOnly,
  requestTypeLabel,
} from "@/lib/companyRequestDisplay";

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
          if (isRequestViewOnly(getRequestLifecycleStatus(detail))) {
            toast.error("This request is read-only. Reactivate it before editing.");
            nav(COMPANY_ROUTES.requestDetail(detail.id));
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
      <CompanyPageShell>
        <CompanyRequestWizardLayout
          title={editRequestId ? "Request updated" : "Request created"}
          subtitle={
            editRequestId
              ? "Your changes are saved. You can return to the request or find matching students when AI matching is available."
              : "Your project request is saved. SkillSwap AI will recommend students based on your roles and skills when matching is available."
          }
          footer={
            <>
              <span aria-hidden />
              <div className="flex flex-wrap items-center justify-end gap-2">
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
                  className="rounded-lg"
                  onClick={() => nav(COMPANY_ROUTES.dashboard)}
                >
                  Back to dashboard
                </Button>
              </div>
            </>
          }
        >
          <div className="py-10 text-center">
            <div className="cw-wizard-success-icon">
              <CheckCircle2 className="h-9 w-9" aria-hidden />
            </div>
          </div>
        </CompanyRequestWizardLayout>
      </CompanyPageShell>
    );
  }

  const wizardFooter = (
    <>
      <Button
        variant="ghost"
        className="rounded-lg"
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
              className="rounded-lg"
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
    </>
  );

  return (
    <CompanyPageShell>
      <CompanyRequestWizardLayout
        title={isEdit ? "Edit Project Request" : "Create Project Request"}
        subtitle={
          isEdit
            ? "Update roles and scope for this request."
            : "Describe what you need — from any field or industry. SkillSwap matches university students to your roles."
        }
        compactHeader={!isEdit}
        actions={
          isEdit && editRequestId ? (
            <Button asChild variant="outline" className="rounded-xl">
              <Link to={COMPANY_ROUTES.requestDetail(editRequestId)}>Cancel</Link>
            </Button>
          ) : undefined
        }
        stepper={<CompanyRequestStepper steps={steps} current={step} />}
        headerMeta={
          draftUpdatedAt && !isEdit ? (
            <>Draft saved {formatDraftSavedAt(draftUpdatedAt)}</>
          ) : undefined
        }
        footer={draftLoading ? undefined : wizardFooter}
      >
        {draftLoading ? (
          <div className="space-y-4 py-4">
            <CompanySkeleton className="h-12 w-full rounded-lg" />
            <CompanySkeleton className="h-64 w-full rounded-xl" />
          </div>
        ) : (
          <div key={step} className="cw-wizard-form">
            <WizardStepPanel
              stepLabel={steps[step]}
              className={step === 0 ? "cw-wizard-step-panel--request-type" : undefined}
            >
            {step === 0 && (
              <div className="cw-request-type-grid">
                <button
                  type="button"
                  onClick={() => setType("individual")}
                  className={cn(
                    "cw-request-type-card",
                    type === "individual" && "is-selected",
                  )}
                >
                  <div className="cw-request-type-icon">
                    <UserRound className="h-6 w-6" />
                  </div>
                  <div className="cw-request-type-card-body">
                    <div className="font-semibold">Individual Contributor</div>
                    <p className="cw-request-type-desc">
                      One student for a specific role on your project.
                    </p>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => setType("ai-built-team")}
                  className={cn(
                    "cw-request-type-card",
                    type === "ai-built-team" && "is-selected",
                  )}
                >
                  <div className="cw-request-type-icon">
                    <UsersRound className="h-6 w-6" />
                  </div>
                  <div className="cw-request-type-card-body">
                    <div className="font-semibold">AI-Built Team</div>
                    <p className="cw-request-type-desc">
                      Multiple required roles — AI suggests separate students per role to form a
                      team composition.
                    </p>
                  </div>
                </button>
              </div>
            )}

            {step === 1 && (
              <WizardFormSection>
                <WizardFormField label="Project title" htmlFor="project-title" required>
                  <Input
                    id="project-title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Mobile booking app MVP"
                    className="cw-wizard-input"
                  />
                </WizardFormField>

                {categoryChoice === "Other" ? (
                  <div className="cw-wizard-fields-row cw-wizard-fields-row--2">
                    <WizardFormField label="Category" required>
                      <SearchableSelect
                        hideLabel
                        label="Category"
                        value={categoryChoice}
                        onChange={setCategoryChoice}
                        options={PROJECT_CATEGORIES}
                        placeholder="Search categories…"
                      />
                    </WizardFormField>
                    <WizardFormField label="Custom category" htmlFor="category-other" required>
                      <Input
                        id="category-other"
                        value={categoryOther}
                        onChange={(e) => setCategoryOther(e.target.value)}
                        placeholder="Describe your project category"
                        className="cw-wizard-input"
                      />
                    </WizardFormField>
                  </div>
                ) : (
                  <WizardFormField label="Category" required>
                    <SearchableSelect
                      hideLabel
                      label="Category"
                      value={categoryChoice}
                      onChange={setCategoryChoice}
                      options={PROJECT_CATEGORIES}
                      placeholder="Search categories…"
                    />
                  </WizardFormField>
                )}

                <WizardFormField label="Description" htmlFor="project-description" required>
                  <Textarea
                    id="project-description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={6}
                    placeholder="What should collaborators build or contribute?"
                    className="cw-wizard-input min-h-[9rem]"
                  />
                </WizardFormField>
              </WizardFormSection>
            )}

            {step === 2 && type === "individual" && (
              <WizardFormSection>
                <WizardFormField label="Role" required>
                  <SearchableSelect
                    hideLabel
                    label="Role"
                    value={targetRole}
                    onChange={setTargetRole}
                    options={COMPANY_ROLE_OPTIONS}
                    placeholder="Search or select a role..."
                    allowCustom
                  />
                </WizardFormField>
                <WizardFormField label="Skills" required>
                  <MultiSelectTags
                    hideLabel
                    label="Skills"
                    selected={individualSkills}
                    onChange={setIndividualSkills}
                    options={COMPANY_SKILL_OPTIONS}
                    placeholder="Search skills..."
                  />
                </WizardFormField>
              </WizardFormSection>
            )}

            {step === 2 && type === "ai-built-team" && (
              <div className={cn("cw-wizard-step-body-wide flex flex-col", cwLayout.section)}>
                {teamRoles.map((role, roleIndex) => {
                  const taken = rolesTakenByOthers(role.id);
                  const roleOptions = COMPANY_ROLE_OPTIONS.filter(
                    (o) =>
                      o.toLowerCase() === role.roleName.toLowerCase() ||
                      !taken.some((t) => t.toLowerCase() === o.toLowerCase()),
                  );

                  const preview =
                    role.roleName && role.skills.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {role.skills.map((s) => (
                          <Badge
                            key={s}
                            className="cw-request-skill-badge rounded-md text-[10px]"
                          >
                            {s}
                          </Badge>
                        ))}
                      </div>
                    ) : null;

                  return (
                    <WizardRoleCard
                      key={role.id}
                      index={roleIndex + 1}
                      title={role.roleName || "Select a role"}
                      preview={preview}
                      onRemove={
                        teamRoles.length > 1
                          ? () => setTeamRoles((prev) => prev.filter((r) => r.id !== role.id))
                          : undefined
                      }
                    >
                      <WizardFormField label="Role" required>
                        <SearchableSelect
                          hideLabel
                          label="Role"
                          value={role.roleName}
                          onChange={(name) =>
                            setTeamRoles((prev) =>
                              prev.map((r) =>
                                r.id === role.id ? { ...r, roleName: name } : r,
                              ),
                            )
                          }
                          options={roleOptions}
                          placeholder="Search or select a role..."
                          allowCustom
                        />
                      </WizardFormField>

                      <WizardFormField label="Skills for this role" required>
                        <MultiSelectTags
                          hideLabel
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
                      </WizardFormField>

                      <WizardFormField
                        label="Optional notes"
                        htmlFor={`role-notes-${role.id}`}
                      >
                        <Textarea
                          id={`role-notes-${role.id}`}
                          value={role.notes ?? ""}
                          onChange={(e) =>
                            setTeamRoles((prev) =>
                              prev.map((r) =>
                                r.id === role.id ? { ...r, notes: e.target.value } : r,
                              ),
                            )
                          }
                          rows={3}
                          placeholder="Scope, seniority, or collaboration expectations"
                          className="cw-wizard-input min-h-[5rem]"
                        />
                      </WizardFormField>
                    </WizardRoleCard>
                  );
                })}
                <WizardAddRoleButton onClick={() => setTeamRoles((prev) => [...prev, newRole()])}>
                  <Plus className="h-4 w-4" />
                  Add another role
                </WizardAddRoleButton>
              </div>
            )}

            {step === 3 && (
              <WizardFormSection>
                <WizardFormField label="Collaboration format" required>
                  <Select value={collaborationType} onValueChange={setCollaborationType}>
                    <SelectTrigger className="cw-wizard-input h-11 w-full">
                      <SelectValue placeholder="Select format" />
                    </SelectTrigger>
                    <SelectContent className="cw-select-popover">
                      {COLLABORATION_FORMATS.map((f) => (
                        <SelectItem key={f.value} value={f.value}>
                          {f.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </WizardFormField>

                <div className="cw-wizard-field-divider" aria-hidden />

                <WizardFormField label="Duration" required>
                  <WizardFormPanel>
                    <DurationFields
                      hideLabel
                      ongoing={durationOngoing}
                      onOngoingChange={setDurationOngoing}
                      value={durationValue}
                      onValueChange={setDurationValue}
                      unit={durationUnit}
                      onUnitChange={setDurationUnit}
                    />
                  </WizardFormPanel>
                </WizardFormField>

                <WizardFormField label="Notes" htmlFor="scope-notes">
                  <Textarea
                    id="scope-notes"
                    value={scopeNotes}
                    onChange={(e) => setScopeNotes(e.target.value)}
                    rows={4}
                    placeholder="Optional"
                    className="cw-wizard-input min-h-[5.5rem]"
                  />
                </WizardFormField>
              </WizardFormSection>
            )}

            {step === 4 && (
              <div className="cw-wizard-review-wrap">
                <div className="cw-wizard-review-hero">
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
                    "grid mt-5",
                    cwLayout.gridDense,
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
                  <p className="cw-scope-notes">{scopeNotes}</p>
                </div>
              )}

                <CompanyRequestReviewAiBanner />
              </div>
            )}
            </WizardStepPanel>
          </div>
        )}
      </CompanyRequestWizardLayout>
    </CompanyPageShell>
  );
}
