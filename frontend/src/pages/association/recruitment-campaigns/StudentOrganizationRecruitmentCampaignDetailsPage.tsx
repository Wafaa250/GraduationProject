import { useEffect, useMemo, useState } from "react";

import {
  Link,
  useNavigate,
  useParams,
  useSearchParams,
} from "react-router-dom";

import {
  ArrowLeft,
  Briefcase,
  CalendarClock,
  Check,
  CheckCircle2,
  ClipboardList,
  Users,
} from "lucide-react";

import toast from "react-hot-toast";

import { resolveApiFileUrl } from "@/api/axiosInstance";

import {
  getPublicRecruitmentCampaign,
  parseApiErrorMessage,
  parseSkillsList,
  type RecruitmentPosition,
  type RecruitmentQuestion,
} from "@/api/recruitmentCampaignsApi";

import {
  getMyRecruitmentApplication,
  submitRecruitmentApplication,
} from "@/api/recruitmentApplicationsApi";

import { ROUTES } from "@/routes/paths";

import { sortByLeadershipRole } from "@/utils/leadershipRoleSort";

import {
  buildEmptyAnswerDrafts,
  draftsToSubmissionPayload,
  fieldUsesOptions,
  getStudentApplicationQuestions,
  normalizeFieldType,
  validateApplicationAnswers,
  type ApplicationAnswerDraft,
} from "@/utils/recruitmentFormFields";

import {
  formatEventDate,
  formatRegistrationCloseDate,
} from "../events/eventFormUtils";

import "@/styles/student-recruitment-detail.css";

type StudentCampaignView = {
  id: number;

  title: string;

  description: string;

  applicationDeadline: string;

  coverImageUrl?: string | null;

  organizationName?: string | null;

  positions: RecruitmentPosition[];
};

function orgInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);

  if (parts.length === 0) return "OR";

  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();

  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}

export default function StudentOrganizationRecruitmentCampaignDetailsPage() {
  const { campaignId } = useParams<{ campaignId: string }>();

  const [searchParams] = useSearchParams();

  const navigate = useNavigate();

  const orgIdFromQuery = Number(searchParams.get("orgId") ?? 0);

  const initialPositionId = Number(searchParams.get("positionId") ?? 0) || null;

  const [campaign, setCampaign] = useState<StudentCampaignView | null>(null);

  const [questions, setQuestions] = useState<RecruitmentQuestion[]>([]);

  const [loading, setLoading] = useState(true);

  const [studentPositionId, setStudentPositionId] = useState<number | null>(
    initialPositionId,
  );

  const [answerDrafts, setAnswerDrafts] = useState<
    Record<number, ApplicationAnswerDraft>
  >({});

  const [studentSubmitting, setStudentSubmitting] = useState(false);

  const [studentApplied, setStudentApplied] = useState(false);

  const [applicationStatusLoading, setApplicationStatusLoading] =
    useState(false);

  const numericCampaignId = Number(campaignId);

  useEffect(() => {
    if (!Number.isFinite(numericCampaignId)) {
      setLoading(false);

      return;
    }

    if (!Number.isFinite(orgIdFromQuery) || orgIdFromQuery <= 0) {
      setLoading(false);

      return;
    }

    let cancelled = false;

    (async () => {
      try {
        const data = await getPublicRecruitmentCampaign(
          orgIdFromQuery,
          numericCampaignId,
        );

        if (!cancelled) {
          setCampaign({
            id: data.id,

            title: data.title,

            description: data.description,

            applicationDeadline: data.applicationDeadline,

            coverImageUrl: data.coverImageUrl ?? null,

            organizationName: data.organizationName,

            positions: data.positions,
          });

          setQuestions(data.questions ?? []);

          if (data.positions.length === 1) {
            const posId = data.positions[0].id;

            setStudentPositionId(posId);

            setAnswerDrafts(
              buildEmptyAnswerDrafts(
                getStudentApplicationQuestions(data.questions ?? [], posId),
              ),
            );
          } else if (
            initialPositionId &&
            data.positions.some((p) => p.id === initialPositionId)
          ) {
            setAnswerDrafts(
              buildEmptyAnswerDrafts(
                getStudentApplicationQuestions(
                  data.questions ?? [],
                  initialPositionId,
                ),
              ),
            );
          }
        }
      } catch (err) {
        toast.error(parseApiErrorMessage(err));

        if (!cancelled) navigate(ROUTES.communicationHub);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [numericCampaignId, navigate, orgIdFromQuery, initialPositionId]);

  useEffect(() => {
    if (!campaign || !studentPositionId || orgIdFromQuery <= 0) return;

    let cancelled = false;

    setApplicationStatusLoading(true);

    void getMyRecruitmentApplication(
      orgIdFromQuery,
      campaign.id,
      studentPositionId,
    )
      .then((s) => {
        if (!cancelled) setStudentApplied(!!s.hasSubmitted);
      })

      .catch(() => {
        if (!cancelled) setStudentApplied(false);
      })

      .finally(() => {
        if (!cancelled) setApplicationStatusLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [campaign, studentPositionId, orgIdFromQuery]);

  const positions = useMemo(
    () => sortByLeadershipRole(campaign?.positions ?? []),

    [campaign?.positions],
  );

  const totalOpenings = useMemo(
    () => positions.reduce((sum, p) => sum + p.neededCount, 0),

    [positions],
  );

  const selectedPosition = useMemo(
    () => positions.find((p) => p.id === studentPositionId) ?? null,

    [positions, studentPositionId],
  );

  const studentQuestions = useMemo(
    () =>
      studentPositionId
        ? getStudentApplicationQuestions(questions, studentPositionId)
        : [],

    [questions, studentPositionId],
  );

  const deadlineLabel = campaign
    ? formatRegistrationCloseDate(campaign.applicationDeadline)
    : null;

  const selectPosition = (posId: number) => {
    setStudentPositionId(posId);

    setStudentApplied(false);

    setAnswerDrafts(
      buildEmptyAnswerDrafts(getStudentApplicationQuestions(questions, posId)),
    );
  };

  const cover = campaign?.coverImageUrl
    ? resolveApiFileUrl(campaign.coverImageUrl)
    : null;

  const orgName = campaign?.organizationName?.trim() || "Student organization";

  const applyStatusPill = studentApplied
    ? {
        label: "Applied",
        className: "student-recruitment-detail__status-pill--done",
      }
    : studentPositionId && studentQuestions.length > 0
      ? {
          label: "Open",
          className: "student-recruitment-detail__status-pill--open",
        }
      : null;

  return (
    <div className="student-hub min-h-full bg-hero px-4 py-6 sm:px-6">
      <div className="student-recruitment-detail">
        <Link
          to={ROUTES.communicationHub}
          className="mb-5 inline-flex items-center gap-1.5 text-sm font-semibold text-primary transition-opacity hover:opacity-80"
        >
          <ArrowLeft size={16} aria-hidden />
          Back to Communication Hub
        </Link>

        {loading ? (
          <div className="hub-card p-8">
            <div className="student-recruitment-detail__loading">
              <span
                className="student-recruitment-detail__loading-spinner"
                aria-hidden
              />
              Loading selection…
            </div>
          </div>
        ) : campaign ? (
          <article className="student-recruitment-detail__card">
            <div
              className={`student-recruitment-detail__hero${cover ? " student-recruitment-detail__hero--cover" : ""}`}
            >
              {cover ? (
                <>
                  <img
                    src={cover}
                    alt=""
                    className="student-recruitment-detail__hero-img"
                  />

                  <div
                    className="student-recruitment-detail__hero-overlay"
                    aria-hidden
                  />
                </>
              ) : null}

              <div className="student-recruitment-detail__hero-badges">
                <span
                  className={`student-recruitment-detail__badge${cover ? " student-recruitment-detail__badge--on-dark" : ""}`}
                >
                  Executive board selection
                </span>
              </div>
            </div>

            <div className="student-recruitment-detail__body">
              <div className="student-recruitment-detail__org">
                <div
                  className="student-recruitment-detail__org-avatar"
                  aria-hidden
                >
                  {orgInitials(orgName)}
                </div>

                <div>
                  <p className="student-recruitment-detail__org-label">
                    Organization
                  </p>

                  <p className="student-recruitment-detail__org-name">
                    {orgName}
                  </p>
                </div>
              </div>

              <h1 className="student-recruitment-detail__title">
                {campaign.title}
              </h1>

              <div className="student-recruitment-detail__meta-grid">
                <div className="student-recruitment-detail__meta-item">
                  <CalendarClock
                    size={16}
                    className="student-recruitment-detail__meta-icon"
                    aria-hidden
                  />

                  <div>
                    <p className="student-recruitment-detail__meta-label">
                      Applications close
                    </p>

                    <p className="student-recruitment-detail__meta-value">
                      {deadlineLabel ??
                        formatEventDate(campaign.applicationDeadline)}
                    </p>
                  </div>
                </div>

                <div className="student-recruitment-detail__meta-item">
                  <Briefcase
                    size={16}
                    className="student-recruitment-detail__meta-icon"
                    aria-hidden
                  />

                  <div>
                    <p className="student-recruitment-detail__meta-label">
                      Open roles
                    </p>

                    <p className="student-recruitment-detail__meta-value">
                      {positions.length} position
                      {positions.length === 1 ? "" : "s"}
                    </p>
                  </div>
                </div>

                <div className="student-recruitment-detail__meta-item">
                  <Users
                    size={16}
                    className="student-recruitment-detail__meta-icon"
                    aria-hidden
                  />

                  <div>
                    <p className="student-recruitment-detail__meta-label">
                      Total openings
                    </p>

                    <p className="student-recruitment-detail__meta-value">
                      {totalOpenings} seat{totalOpenings === 1 ? "" : "s"}
                    </p>
                  </div>
                </div>
              </div>

              <section className="student-recruitment-detail__about">
                <h2 className="student-recruitment-detail__section-title">
                  About this selection
                </h2>

                <p className="student-recruitment-detail__description">
                  {campaign.description?.trim()
                    ? campaign.description
                    : "No additional details were provided for this selection."}
                </p>
              </section>

              <section
                className="student-recruitment-detail__positions"
                aria-labelledby="open-positions-heading"
              >
                <h2
                  id="open-positions-heading"
                  className="student-recruitment-detail__section-title"
                >
                  Open positions
                </h2>

                <p className="student-recruitment-detail__section-sub">
                  Choose the role you want to apply for. You can submit one
                  application per position.
                </p>

                <div
                  className="student-recruitment-detail__positions-grid"
                  role="list"
                >
                  {positions.map((pos) => (
                    <PositionRoleCard
                      key={pos.id}
                      position={pos}
                      selected={studentPositionId === pos.id}
                      onSelect={() => selectPosition(pos.id)}
                    />
                  ))}
                </div>
              </section>

              <section
                className="student-recruitment-detail__apply"
                aria-labelledby="selection-apply-heading"
              >
                <div className="student-recruitment-detail__apply-head">
                  <div>
                    <div className="student-recruitment-detail__apply-title-row">
                      <ClipboardList
                        size={20}
                        className="student-recruitment-detail__apply-icon"
                        aria-hidden
                      />

                      <h2
                        id="selection-apply-heading"
                        className="student-recruitment-detail__apply-title"
                      >
                        Application
                      </h2>
                    </div>

                    <p className="student-recruitment-detail__apply-sub">
                      {selectedPosition
                        ? `Applying for ${selectedPosition.roleTitle}. Complete the form below.`
                        : "Select a position above to view and complete the application form."}
                    </p>
                  </div>

                  {applyStatusPill && !applicationStatusLoading ? (
                    <span
                      className={`student-recruitment-detail__status-pill ${applyStatusPill.className}`}
                    >
                      {applyStatusPill.label}
                    </span>
                  ) : null}
                </div>

                {!studentPositionId ? (
                  <p className="student-recruitment-detail__empty">
                    Pick an open position to continue with your application.
                  </p>
                ) : applicationStatusLoading ? (
                  <div className="student-recruitment-detail__loading">
                    <span
                      className="student-recruitment-detail__loading-spinner"
                      aria-hidden
                    />
                    Checking your application status…
                  </div>
                ) : studentApplied ? (
                  <div className="student-recruitment-detail__registered-banner">
                    <CheckCircle2 size={22} strokeWidth={2.25} aria-hidden />

                    <div>
                      <p className="student-recruitment-detail__registered-title">
                        Application submitted
                      </p>

                      <p className="student-recruitment-detail__registered-sub">
                        You have already applied for{" "}
                        {selectedPosition?.roleTitle ?? "this role"}. The
                        organization will review your responses and follow up if
                        needed.
                      </p>
                    </div>
                  </div>
                ) : studentQuestions.length === 0 ? (
                  <p className="student-recruitment-detail__empty">
                    The application form for this position is not available yet.
                    Check back later or contact the organization.
                  </p>
                ) : (
                  <div className="student-recruitment-detail__form-panel">
                    <div className="student-recruitment-detail__field-gap">
                      <StudentRecruitmentApplicationFields
                        questions={studentQuestions}
                        drafts={answerDrafts}
                        onDraftChange={setAnswerDrafts}
                      />
                    </div>

                    <div className="student-recruitment-detail__actions">
                      <button
                        type="button"
                        className="student-ws-btn-primary"
                        disabled={studentSubmitting}
                        onClick={() => {
                          void (async () => {
                            const validationError = validateApplicationAnswers(
                              studentQuestions,

                              answerDrafts,
                            );

                            if (validationError) {
                              toast.error(validationError);

                              return;
                            }

                            setStudentSubmitting(true);

                            try {
                              const payload = draftsToSubmissionPayload(
                                studentQuestions,

                                answerDrafts,
                              );

                              await submitRecruitmentApplication(
                                orgIdFromQuery,

                                campaign.id,

                                studentPositionId,

                                payload,
                              );

                              toast.success("Application submitted");

                              setStudentApplied(true);
                            } catch (err) {
                              toast.error(parseApiErrorMessage(err));
                            } finally {
                              setStudentSubmitting(false);
                            }
                          })();
                        }}
                      >
                        {studentSubmitting ? "Submitting…" : "Apply now"}
                      </button>
                    </div>
                  </div>
                )}
              </section>
            </div>
          </article>
        ) : null}
      </div>
    </div>
  );
}

function PositionRoleCard({
  position,

  selected,

  onSelect,
}: {
  position: RecruitmentPosition;

  selected: boolean;

  onSelect: () => void;
}) {
  const skills = parseSkillsList(position.requiredSkills).slice(0, 4);

  const desc = position.description?.trim();

  return (
    <button
      type="button"
      role="listitem"
      aria-pressed={selected}
      onClick={onSelect}
      className={`student-recruitment-detail__position-card${selected ? " student-recruitment-detail__position-card--selected" : ""}`}
    >
      <span className="student-recruitment-detail__position-radio" aria-hidden>
        {selected ? <Check size={14} strokeWidth={3} /> : null}
      </span>

      <span className="student-recruitment-detail__position-body">
        <p className="student-recruitment-detail__position-title">
          {position.roleTitle}
        </p>

        <p className="student-recruitment-detail__position-meta">
          <span className="student-recruitment-detail__position-openings">
            <Users size={12} aria-hidden />
            {position.neededCount} opening
            {position.neededCount === 1 ? "" : "s"}
          </span>
        </p>

        {desc ? (
          <p className="student-recruitment-detail__position-desc">{desc}</p>
        ) : null}

        {skills.length > 0 ? (
          <span className="student-recruitment-detail__position-skills">
            {skills.map((s) => (
              <span key={s} className="student-recruitment-detail__skill-tag">
                {s}
              </span>
            ))}
          </span>
        ) : null}
      </span>
    </button>
  );
}

function StudentRecruitmentApplicationFields({
  questions,

  drafts,

  onDraftChange,
}: {
  questions: RecruitmentQuestion[];

  drafts: Record<number, ApplicationAnswerDraft>;

  onDraftChange: (next: Record<number, ApplicationAnswerDraft>) => void;
}) {
  const updateText = (questionId: number, value: string) => {
    onDraftChange({
      ...drafts,

      [questionId]: {
        ...drafts[questionId],
        questionId,
        value,
        values: drafts[questionId]?.values ?? [],
      },
    });
  };

  const updateChoice = (questionId: number, value: string) => {
    onDraftChange({
      ...drafts,

      [questionId]: { ...drafts[questionId], questionId, value, values: [] },
    });
  };

  const toggleCheckbox = (
    questionId: number,
    option: string,
    checked: boolean,
  ) => {
    const current = drafts[questionId]?.values ?? [];

    const next = checked
      ? [...current, option]
      : current.filter((v) => v !== option);

    onDraftChange({
      ...drafts,

      [questionId]: {
        ...drafts[questionId],
        questionId,
        value: "",
        values: next,
      },
    });
  };

  return (
    <>
      {questions.map((q) => {
        const type = normalizeFieldType(q.questionType);

        const draft = drafts[q.id] ?? {
          questionId: q.id,
          value: "",
          values: [],
        };

        const options = q.options?.filter((o) => o.trim()) ?? [];

        const label = (
          <span className="block text-sm font-semibold text-foreground">
            {q.questionTitle}

            {q.isRequired ? <span className="text-primary"> *</span> : null}
          </span>
        );

        if (type === "Paragraph") {
          return (
            <label key={q.id} className="block">
              {label}

              <textarea
                className="student-ws-input mt-1.5 min-h-[96px] w-full"
                placeholder={q.placeholder ?? undefined}
                value={draft.value}
                onChange={(e) => updateText(q.id, e.target.value)}
              />
            </label>
          );
        }

        if (type === "CheckboxList" && options.length > 0) {
          return (
            <fieldset key={q.id} className="block border-0 p-0">
              {label}

              <div className="student-recruitment-detail__choice-group">
                {options.map((opt) => (
                  <label
                    key={opt}
                    className="student-recruitment-detail__choice-label"
                  >
                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
                      checked={draft.values.includes(opt)}
                      onChange={(e) =>
                        toggleCheckbox(q.id, opt, e.target.checked)
                      }
                    />

                    {opt}
                  </label>
                ))}
              </div>
            </fieldset>
          );
        }

        if (type === "MultipleChoice" && options.length > 0) {
          return (
            <fieldset key={q.id} className="block border-0 p-0">
              {label}

              <div className="student-recruitment-detail__choice-group">
                {options.map((opt) => (
                  <label
                    key={opt}
                    className="student-recruitment-detail__choice-label"
                  >
                    <input
                      type="radio"
                      name={`recruitment-q-${q.id}`}
                      className="h-4 w-4 border-border text-primary focus:ring-primary"
                      checked={draft.value === opt}
                      onChange={() => updateChoice(q.id, opt)}
                    />

                    {opt}
                  </label>
                ))}
              </div>
            </fieldset>
          );
        }

        if (fieldUsesOptions(type) && options.length > 0) {
          return (
            <label key={q.id} className="block">
              {label}

              <select
                className="student-ws-input mt-1.5 w-full"
                value={draft.value}
                onChange={(e) => updateChoice(q.id, e.target.value)}
              >
                <option value="">Select an option</option>

                {options.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </label>
          );
        }

        if (type === "YesNo") {
          return (
            <label key={q.id} className="block">
              {label}

              <select
                className="student-ws-input mt-1.5 w-full"
                value={draft.value}
                onChange={(e) => updateChoice(q.id, e.target.value)}
              >
                <option value="">Select</option>

                <option value="Yes">Yes</option>

                <option value="No">No</option>
              </select>
            </label>
          );
        }

        const inputType =
          type === "Email"
            ? "email"
            : type === "Number"
              ? "number"
              : type === "Date"
                ? "date"
                : type === "Url"
                  ? "url"
                  : "text";

        return (
          <label key={q.id} className="block">
            {label}

            <input
              type={inputType}
              className="student-ws-input mt-1.5 w-full"
              placeholder={q.placeholder ?? undefined}
              value={draft.value}
              onChange={(e) => updateText(q.id, e.target.value)}
            />

            {q.helpText ? (
              <span className="mt-1.5 block text-xs text-muted-foreground">
                {q.helpText}
              </span>
            ) : null}
          </label>
        );
      })}
    </>
  );
}
