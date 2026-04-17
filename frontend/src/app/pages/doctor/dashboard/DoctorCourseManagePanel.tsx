import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type FormEvent,
} from "react";
import { FileText, GraduationCap, Layers, Ruler, Users, X } from "lucide-react";
import { parseApiErrorMessage, resolveApiFileUrl } from "../../../../api/axiosInstance";
import {
  addStudentsToDoctorCourse,
  getDoctorCourseDetail,
  getDoctorCourseProjectSetting,
  getDoctorCourseStudents,
  getDoctorCourseTeams,
  removeStudentFromDoctorCourse,
  upsertDoctorCourseProjectSetting,
  type DoctorCourseDetail,
  type DoctorCourseProjectSetting,
  type DoctorCourseStudent,
  type DoctorCourseTeam,
} from "../../../../api/doctorCoursesApi";
import { useToast } from "../../../../context/ToastContext";
import { dash } from "./doctorDashTokens";

/** One university student ID per line; CSV lines use the first column. */
function parseStudentIdsFromFileText(text: string): string[] {
  const lines = text.replace(/^\uFEFF/, "").split(/\r?\n/);
  const ids: string[] = [];
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    const cell = trimmed.includes(",") ? trimmed.split(",")[0].trim() : trimmed;
    if (cell) ids.push(cell);
  }
  return [...new Set(ids)];
}

/** Manual fallback: comma, semicolon, or whitespace separated IDs. */
function parseStudentIdsManual(raw: string): string[] {
  return [
    ...new Set(
      raw
        .split(/[,;\s]+/)
        .map((s) => s.trim())
        .filter((s) => s.length > 0),
    ),
  ];
}

function formatMemberRole(role: string): string {
  const r = role.trim().toLowerCase();
  if (r === "leader") return "Leader";
  if (r === "member") return "Member";
  return role.trim() || "—";
}

function leaderNameForTeam(team: DoctorCourseTeam): string {
  const match = team.members.find((m) => m.studentId === team.leaderId);
  return match?.name?.trim() || "—";
}

function teamMemberCountDisplay(team: DoctorCourseTeam): number {
  const n = team.memberCount;
  if (typeof n === "number" && Number.isFinite(n) && n >= 0) return n;
  return team.members.length;
}

type Props = {
  open: boolean;
  courseId: number | null;
  onClose: () => void;
};

export function DoctorCourseManagePanel({ open, courseId: courseIdProp, onClose }: Props) {
  const { showToast } = useToast();

  const courseId = courseIdProp ?? 0;
  const idInvalid = !open || courseIdProp == null || Number.isNaN(courseId) || courseId < 1;

  const [course, setCourse] = useState<DoctorCourseDetail | null>(null);
  const [students, setStudents] = useState<DoctorCourseStudent[]>([]);
  const [teams, setTeams] = useState<DoctorCourseTeam[]>([]);
  const [projectSetting, setProjectSetting] =
    useState<DoctorCourseProjectSetting | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [enrollListFile, setEnrollListFile] = useState<File | null>(null);
  /** Parsed from selected file (client-side only; same IDs sent to POST /students). */
  const [enrollFileParsedIds, setEnrollFileParsedIds] = useState<string[]>([]);
  const [enrollFileParseNote, setEnrollFileParseNote] = useState<string | null>(
    null,
  );
  const [enrollManualInput, setEnrollManualInput] = useState("");
  const [adding, setAdding] = useState(false);
  const enrollListInputRef = useRef<HTMLInputElement>(null);

  const [ptTitle, setPtTitle] = useState("");
  const [ptDescription, setPtDescription] = useState("");
  const [ptTeamSize, setPtTeamSize] = useState(2);
  const [ptFile, setPtFile] = useState<File | null>(null);
  const [savingProject, setSavingProject] = useState(false);
  const projectFileInputRef = useRef<HTMLInputElement>(null);
  /** DB `studentId` while DELETE enrolled student is in flight (disables that row only). */
  const [removingEnrolledStudentId, setRemovingEnrolledStudentId] = useState<
    number | null
  >(null);

  const enrollManualParsedIds = useMemo(
    () => parseStudentIdsManual(enrollManualInput),
    [enrollManualInput],
  );

  const loadCourseAndStudents = useCallback(async () => {
    if (idInvalid) return;
    const [detail, list, teamsList] = await Promise.all([
      getDoctorCourseDetail(courseId),
      getDoctorCourseStudents(courseId),
      getDoctorCourseTeams(courseId),
    ]);
    setCourse(detail);
    setStudents(list);
    setTeams(teamsList);
  }, [courseId, idInvalid]);

  const loadProjectSettingOnly = useCallback(async () => {
    if (idInvalid) return;
    const ps = await getDoctorCourseProjectSetting(courseId);
    setProjectSetting(ps);
  }, [courseId, idInvalid]);

  const loadAll = useCallback(async () => {
    if (idInvalid) return;
    setCourse(null);
    setStudents([]);
    setTeams([]);
    setProjectSetting(null);
    setLoading(true);
    setLoadError(null);
    try {
      await Promise.all([loadCourseAndStudents(), loadProjectSettingOnly()]);
    } catch (err) {
      setLoadError(parseApiErrorMessage(err));
      setCourse(null);
      setStudents([]);
      setTeams([]);
      setProjectSetting(null);
    } finally {
      setLoading(false);
    }
  }, [courseId, idInvalid, loadCourseAndStudents, loadProjectSettingOnly]);

  useEffect(() => {
    if (idInvalid) {
      setCourse(null);
      setStudents([]);
      setTeams([]);
      setProjectSetting(null);
      setLoadError(null);
      return;
    }
    void loadAll();
  }, [idInvalid, loadAll]);

  useEffect(() => {
    if (projectSetting) {
      setPtTitle(projectSetting.title);
      setPtDescription(projectSetting.description ?? "");
      const ts = projectSetting.teamSize;
      setPtTeamSize(ts >= 2 && ts <= 10 ? ts : 2);
    } else {
      setPtTitle("");
      setPtDescription("");
      setPtTeamSize(2);
    }
    setPtFile(null);
    if (projectFileInputRef.current) projectFileInputRef.current.value = "";
  }, [projectSetting]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  useEffect(() => {
    if (!open) {
      setRemovingEnrolledStudentId(null);
      setEnrollListFile(null);
      setEnrollFileParsedIds([]);
      setEnrollFileParseNote(null);
      setEnrollManualInput("");
      if (enrollListInputRef.current) enrollListInputRef.current.value = "";
    }
  }, [open]);

  const handleEnrollFileChange = async (file: File | null) => {
    setEnrollListFile(file);
    setEnrollFileParsedIds([]);
    setEnrollFileParseNote(null);
    if (!file) return;
    try {
      const text = await file.text();
      const ids = parseStudentIdsFromFileText(text);
      setEnrollFileParsedIds(ids);
      if (ids.length === 0) {
        setEnrollFileParseNote(
          "No student IDs found in this file. Use one ID per line, or add IDs manually below.",
        );
      }
    } catch {
      setEnrollFileParseNote(
        "Could not read this file. Try a .txt or .csv file, or use manual entry below.",
      );
    }
  };

  const handleAddStudents = async () => {
    if (idInvalid) return;
    const fromFile = enrollFileParsedIds.length > 0;
    const ids = fromFile ? enrollFileParsedIds : enrollManualParsedIds;
    if (ids.length === 0) {
      if (enrollListFile && enrollFileParsedIds.length === 0) {
        showToast(
          "No student IDs to add. Fix the file or enter IDs in the manual field.",
          "error",
        );
      } else {
        showToast(
          "Enter at least one student ID (upload a valid file or use manual entry).",
          "error",
        );
      }
      return;
    }
    setAdding(true);
    try {
      await addStudentsToDoctorCourse(courseId, ids);
      showToast("Students added.", "success");
      setEnrollListFile(null);
      setEnrollFileParsedIds([]);
      setEnrollFileParseNote(null);
      setEnrollManualInput("");
      if (enrollListInputRef.current) enrollListInputRef.current.value = "";
      await loadCourseAndStudents();
    } catch (err) {
      showToast(parseApiErrorMessage(err), "error");
    } finally {
      setAdding(false);
    }
  };

  const handleRemoveEnrolledStudent = async (studentId: number) => {
    if (idInvalid) return;
    if (
      !window.confirm(
        "Are you sure you want to remove this student from the course?",
      )
    ) {
      return;
    }
    setRemovingEnrolledStudentId(studentId);
    try {
      await removeStudentFromDoctorCourse(courseId, studentId);
      showToast("Student removed from course.", "success");
      await loadCourseAndStudents();
    } catch (err) {
      showToast(parseApiErrorMessage(err), "error");
    } finally {
      setRemovingEnrolledStudentId(null);
    }
  };

  const handleProjectSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (idInvalid) return;
    const title = ptTitle.trim();
    if (!title) {
      showToast("Title is required.", "error");
      return;
    }
    let teamSize = Number(ptTeamSize);
    if (Number.isNaN(teamSize)) teamSize = 2;
    teamSize = Math.min(10, Math.max(2, Math.round(teamSize)));
    const wasNew = projectSetting === null;
    setSavingProject(true);
    try {
      const updated = await upsertDoctorCourseProjectSetting(courseId, {
        title,
        description: ptDescription,
        teamSize,
        file: ptFile,
      });
      setProjectSetting(updated);
      showToast(
        wasNew ? "Project setting saved." : "Project setting updated.",
        "success",
      );
      setPtFile(null);
      if (projectFileInputRef.current) projectFileInputRef.current.value = "";
    } catch (err) {
      showToast(parseApiErrorMessage(err), "error");
    } finally {
      setSavingProject(false);
    }
  };

  const existingFileHref = projectSetting?.fileUrl
    ? resolveApiFileUrl(projectSetting.fileUrl)
    : null;

  if (!open || courseIdProp == null) return null;

  return (
    <>
      <div
        style={P.overlay}
        className="dd-course-panel-overlay"
        onClick={onClose}
      >
      <div
        style={P.modal}
        role="dialog"
        aria-modal="true"
        aria-labelledby="dd-course-panel-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div style={P.panelHeader}>
          <div style={{ minWidth: 0, flex: 1 }}>
            <p style={P.panelKicker}>Teaching · Course workspace</p>
            <h2 id="dd-course-panel-title" style={P.panelTitle}>
              {course?.name ?? "Loading…"}
            </h2>
            {course ? (
              <span style={S.codeBadge}>{course.code}</span>
            ) : null}
            <p style={P.panelSub}>
              Same doctor dashboard — enrollments, project file, and teams.
            </p>
          </div>
          <button type="button" onClick={onClose} style={P.closeBtn} aria-label="Close">
            <X size={20} />
          </button>
        </div>

        <div style={P.modalBody}>
          {loading && (
            <div style={S.centerBox}>
              <div style={S.spinner} />
              <p style={S.muted}>Loading course…</p>
            </div>
          )}

          {!loading && loadError && <div style={S.errorBanner}>{loadError}</div>}

          {!loading && !loadError && course && (
            <>
              <section style={S.overviewSection}>
                <p style={S.sectionEyebrow}>At a glance</p>
                <p style={S.sectionLead}>
                  Enrollment and teams tie to the{" "}
                  <strong style={{ color: dash.text }}>project setting</strong> below:
                  students join the course, then form teams up to the configured size.
                </p>
                <div style={S.summaryGrid}>
                  <div style={S.summaryCard}>
                    <Users size={16} color={dash.accent} style={{ flexShrink: 0 }} />
                    <div>
                      <div style={S.summaryCardValue}>{course.studentCount}</div>
                      <div style={S.summaryCardLabel}>Enrolled students</div>
                      <div style={S.summaryCardSub}>From course roster</div>
                    </div>
                  </div>
                  <div style={S.summaryCard}>
                    <GraduationCap
                      size={16}
                      color="#7c3aed"
                      style={{ flexShrink: 0 }}
                    />
                    <div>
                      <div style={S.summaryCardValue}>{course.teamCount}</div>
                      <div style={S.summaryCardLabel}>Teams</div>
                      <div style={S.summaryCardSub}>Active in this course</div>
                    </div>
                  </div>
                  <div style={S.summaryCard}>
                    <Ruler size={16} color={dash.muted} style={{ flexShrink: 0 }} />
                    <div>
                      <div style={S.summaryCardValue}>
                        {projectSetting != null
                          ? projectSetting.teamSize
                          : "—"}
                      </div>
                      <div style={S.summaryCardLabel}>Max team size</div>
                      <div style={S.summaryCardSub}>
                        {projectSetting != null
                          ? "Per project setting"
                          : "Save a project setting"}
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              <section style={S.section}>
                <h3 style={S.sectionTitle}>Project setting</h3>
                <p style={S.sectionHint}>
                  Sets the project title, brief, maximum team size, and optional spec
                  file. Students use this when forming teams.
                </p>
                <form onSubmit={handleProjectSubmit} style={S.projectForm}>
                  <label style={S.label}>
                    Title
                    <input
                      style={S.input}
                      value={ptTitle}
                      onChange={(e) => setPtTitle(e.target.value)}
                      placeholder="e.g. Capstone project"
                      autoComplete="off"
                      disabled={savingProject}
                    />
                  </label>
                  <label style={S.label}>
                    Description
                    <textarea
                      style={S.textarea}
                      value={ptDescription}
                      onChange={(e) => setPtDescription(e.target.value)}
                      placeholder="Goals, deliverables, grading notes…"
                      rows={4}
                      disabled={savingProject}
                    />
                  </label>
                  <label style={S.label}>
                    Team size
                    <input
                      style={S.input}
                      type="number"
                      min={2}
                      max={10}
                      value={ptTeamSize}
                      onChange={(e) => setPtTeamSize(Number(e.target.value))}
                      disabled={savingProject}
                    />
                  </label>
                  <label style={S.label}>
                    Project file (optional)
                    <input
                      ref={projectFileInputRef}
                      style={S.fileInput}
                      type="file"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        setPtFile(f ?? null);
                      }}
                      disabled={savingProject}
                    />
                  </label>
                  {projectSetting?.fileName && (
                    <div style={S.fileExisting}>
                      <FileText size={16} color="#64748b" />
                      <span style={S.fileExistingText}>
                        Current file:{" "}
                        {existingFileHref ? (
                          <a
                            href={existingFileHref}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={S.fileLink}
                          >
                            {projectSetting.fileName}
                          </a>
                        ) : (
                          projectSetting.fileName
                        )}
                      </span>
                    </div>
                  )}
                  <button
                    type="submit"
                    style={{
                      ...S.primaryBtn,
                      ...(savingProject ? { opacity: 0.7, cursor: "not-allowed" } : {}),
                    }}
                    disabled={savingProject}
                  >
                    {savingProject
                      ? "Saving…"
                      : projectSetting
                        ? "Update"
                        : "Save"}
                  </button>
                </form>
              </section>

              <section style={S.section}>
                <h3 style={S.sectionTitle}>Add students</h3>
                <p style={S.sectionHint}>
                  Upload a .csv or .txt file (one university student ID per line). The
                  list is parsed in your browser, then sent securely to the server.
                  Existing enrollments are skipped.
                </p>
                <div style={S.addForm}>
                  <label style={S.label}>
                    Student list file (.txt or .csv)
                    <input
                      ref={enrollListInputRef}
                      style={S.fileInput}
                      type="file"
                      accept=".csv,.txt,text/csv,text/plain"
                      disabled={adding}
                      onChange={(e) => {
                        const f = e.target.files?.[0] ?? null;
                        void handleEnrollFileChange(f);
                      }}
                    />
                  </label>
                  {enrollListFile ? (
                    <div style={S.enrollFileMeta}>
                      <p style={S.selectedFileName}>
                        Selected: <strong>{enrollListFile.name}</strong>
                      </p>
                      <p style={S.parsedCount}>
                        {enrollFileParsedIds.length > 0 ? (
                          <>
                            <strong>{enrollFileParsedIds.length}</strong> student{" "}
                            {enrollFileParsedIds.length === 1 ? "ID" : "IDs"} ready to add
                          </>
                        ) : (
                          <span style={{ color: dash.muted }}>0 IDs parsed from file</span>
                        )}
                      </p>
                    </div>
                  ) : (
                    <p style={S.selectedFileHint}>No file selected</p>
                  )}
                  {enrollFileParseNote ? (
                    <p style={S.validationNote}>{enrollFileParseNote}</p>
                  ) : null}

                  <div
                    style={{
                      marginTop: 8,
                      paddingTop: 14,
                      borderTop: `1px dashed ${dash.border}`,
                    }}
                  >
                    <p style={S.manualFallbackLabel}>Or paste IDs manually</p>
                    <p style={S.manualFallbackHint}>
                      Comma, semicolon, or line-separated university student IDs.
                    </p>
                    <textarea
                      style={S.textarea}
                      value={enrollManualInput}
                      onChange={(e) => setEnrollManualInput(e.target.value)}
                      placeholder="e.g. 2021001, 2021002"
                      rows={3}
                      disabled={adding}
                    />
                    {enrollManualInput.trim() ? (
                      <p style={S.parsedCount}>
                        <strong>{enrollManualParsedIds.length}</strong>{" "}
                        ID
                        {enrollManualParsedIds.length === 1 ? "" : "s"} in manual entry
                        {enrollFileParsedIds.length > 0 ? (
                          <span style={{ color: dash.subtle, fontWeight: 600 }}>
                            {" "}
                            (file takes priority when it contains IDs)
                          </span>
                        ) : null}
                      </p>
                    ) : null}
                  </div>

                  <button
                    type="button"
                    onClick={() => void handleAddStudents()}
                    style={{
                      ...S.primaryBtn,
                      ...(adding ? { opacity: 0.7, cursor: "not-allowed" } : {}),
                    }}
                    disabled={
                      adding ||
                      (enrollFileParsedIds.length === 0 &&
                        enrollManualParsedIds.length === 0)
                    }
                  >
                    {adding ? "Adding…" : "Add students"}
                  </button>
                </div>
              </section>

              <section style={S.section}>
                <h3 style={S.sectionTitle}>Enrolled students</h3>
                <p style={S.sectionHint}>
                  Everyone listed here is enrolled in this course. They can organize
                  into teams once a project setting exists.
                </p>
                {students.length === 0 ? (
                  <div style={S.emptyInline}>
                    <p style={S.emptyTitle}>No students enrolled yet</p>
                    <p style={S.emptyDesc}>
                      Add IDs in the section above — they will appear here before they
                      can join teams.
                    </p>
                  </div>
                ) : (
                  <div style={S.tableWrap}>
                    <table style={S.table}>
                      <thead>
                        <tr>
                          <th style={S.th}>Name</th>
                          <th style={S.th}>University</th>
                          <th style={S.th}>Major</th>
                          <th style={{ ...S.th, width: 100, textAlign: "right" }}>
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {students.map((s) => {
                          const rowBusy =
                            removingEnrolledStudentId === s.studentId;
                          return (
                            <tr key={`${s.studentId}-${s.userId}`}>
                              <td
                                style={{
                                  ...S.td,
                                  ...(rowBusy ? { opacity: 0.55 } : {}),
                                }}
                              >
                                {s.name || "—"}
                              </td>
                              <td
                                style={{
                                  ...S.td,
                                  ...(rowBusy ? { opacity: 0.55 } : {}),
                                }}
                              >
                                {s.university || "—"}
                              </td>
                              <td
                                style={{
                                  ...S.td,
                                  ...(rowBusy ? { opacity: 0.55 } : {}),
                                }}
                              >
                                {s.major || "—"}
                              </td>
                              <td
                                style={{
                                  ...S.td,
                                  textAlign: "right",
                                  verticalAlign: "middle",
                                }}
                              >
                                <button
                                  type="button"
                                  onClick={() =>
                                    void handleRemoveEnrolledStudent(s.studentId)
                                  }
                                  disabled={rowBusy}
                                  style={{
                                    ...S.removeRowBtn,
                                    opacity: rowBusy ? 0.6 : 1,
                                    cursor: rowBusy ? "not-allowed" : "pointer",
                                  }}
                                >
                                  {rowBusy ? "Removing…" : "Remove"}
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>

              <section style={{ ...S.section, marginBottom: 0 }}>
                <h3 style={S.sectionTitle}>Teams</h3>
                <p style={S.sectionHint}>
                  Teams formed under the active project. Each team links to a project
                  title and leader; details stay in sync with the server.
                </p>
                {teams.length === 0 ? (
                  <div style={S.emptyInline}>
                    <Layers size={28} color="#cbd5e1" style={{ marginBottom: 8 }} />
                    <p style={S.emptyTitle}>No teams formed yet</p>
                    <p style={S.emptyDesc}>
                      When enrolled students create or join a team, it will show here
                      with members and roles.
                    </p>
                  </div>
                ) : (
                  <div style={S.teamGrid}>
                    {teams.map((team) => {
                      const memberN = teamMemberCountDisplay(team);
                      return (
                        <div key={team.teamId} style={S.teamCard}>
                          <div style={S.teamCardHead}>
                            <span style={S.teamIdBadge}>Team #{team.teamId}</span>
                            <span style={S.teamMemberPill}>
                              {memberN} member{memberN === 1 ? "" : "s"}
                            </span>
                          </div>
                          <p style={S.teamProjectLabel}>Project</p>
                          <p style={S.teamProjectTitle}>
                            {team.projectTitle.trim() || "—"}
                          </p>
                          <p style={S.teamLeaderLine}>
                            <span style={S.teamLeaderLabel}>Leader</span>{" "}
                            {leaderNameForTeam(team)}
                          </p>
                          <div style={S.teamMembersBlock}>
                            <p style={S.teamMembersLabel}>Members ({memberN})</p>
                            <div style={S.tableWrap}>
                              <table style={S.table}>
                                <thead>
                                  <tr>
                                    <th style={S.th}>Name</th>
                                    <th style={S.th}>Role</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {team.members.map((m) => (
                                    <tr key={`${team.teamId}-${m.studentId}`}>
                                      <td style={S.td}>{m.name || "—"}</td>
                                      <td style={S.td}>
                                        {formatMemberRole(m.role)}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </section>
            </>
          )}
        </div>
      </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        .dd-course-panel-overlay {
          animation: ddFadeIn 0.2s ease;
        }
        @keyframes ddFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>
    </>
  );
}

const P: Record<string, CSSProperties> = {
  overlay: {
    position: "fixed",
    inset: 0,
    zIndex: 2000,
    background: "rgba(15,23,42,0.4)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
  },
  modal: {
    zIndex: 2001,
    width: "min(900px, 96vw)",
    maxHeight: "90vh",
    overflowY: "auto",
    borderRadius: 16,
    padding: 24,
    background: "#fff",
    border: `1px solid ${dash.border}`,
    boxShadow: dash.shadowLg,
    fontFamily: dash.font,
    color: dash.text,
  },
  panelHeader: {
    display: "flex",
    alignItems: "flex-start",
    gap: 12,
    paddingBottom: "14px",
    borderBottom: `1px solid ${dash.border}`,
  },
  panelKicker: {
    margin: "0 0 4px",
    fontSize: 11,
    fontWeight: 700,
    color: dash.subtle,
    letterSpacing: "0.08em",
    textTransform: "uppercase",
  },
  panelTitle: {
    margin: "0 0 8px",
    fontSize: 18,
    fontWeight: 800,
    fontFamily: dash.fontDisplay,
    lineHeight: 1.3,
  },
  panelSub: {
    margin: "10px 0 0",
    fontSize: 12,
    color: dash.muted,
    lineHeight: 1.45,
    maxWidth: 360,
  },
  closeBtn: {
    flexShrink: 0,
    width: 40,
    height: 40,
    borderRadius: 10,
    border: `1px solid ${dash.border}`,
    background: dash.surface,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: dash.muted,
  },
  modalBody: {
    padding: "16px 0 0",
  },
};

const S: Record<string, CSSProperties> = {
  centerBox: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    padding: "32px 16px",
    gap: 12,
  },
  spinner: {
    width: 36,
    height: 36,
    borderRadius: "50%",
    border: "3px solid #e2e8f0",
    borderTopColor: dash.accent,
    animation: "spin 0.8s linear infinite",
  },
  muted: { margin: 0, fontSize: 14, color: "#94a3b8" },
  errorBanner: {
    padding: "12px 14px",
    borderRadius: 12,
    background: "#fef2f2",
    border: "1px solid #fecaca",
    color: dash.danger,
    fontSize: 13,
    fontWeight: 600,
    marginBottom: 16,
  },
  overviewSection: {
    marginBottom: 16,
  },
  sectionEyebrow: {
    margin: "0 0 6px",
    fontSize: 11,
    fontWeight: 700,
    color: dash.subtle,
    letterSpacing: "0.08em",
    textTransform: "uppercase",
  },
  sectionLead: {
    margin: "0 0 14px",
    fontSize: 12,
    color: dash.muted,
    lineHeight: 1.55,
  },
  summaryGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
    gap: 10,
  },
  summaryCard: {
    display: "flex",
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    padding: "12px 12px",
    minWidth: 0,
    background: dash.surface,
    borderRadius: dash.radiusLg,
    border: `1px solid ${dash.border}`,
    boxShadow: dash.shadow,
  },
  summaryCardValue: {
    fontSize: 20,
    fontWeight: 800,
    color: dash.text,
    lineHeight: 1.2,
  },
  summaryCardLabel: {
    fontSize: 10,
    fontWeight: 700,
    color: dash.subtle,
    textTransform: "uppercase",
    letterSpacing: "0.05em",
    marginTop: 2,
  },
  summaryCardSub: {
    fontSize: 11,
    color: dash.muted,
    marginTop: 3,
    lineHeight: 1.35,
  },
  section: {
    background: dash.surface,
    borderRadius: dash.radiusLg,
    border: `1px solid ${dash.border}`,
    padding: "16px 14px",
    marginBottom: 16,
    boxShadow: dash.shadow,
  },
  sectionTitle: {
    margin: "0 0 8px",
    fontSize: 15,
    fontWeight: 800,
    fontFamily: dash.fontDisplay,
  },
  sectionHint: {
    margin: "0 0 14px",
    fontSize: 12,
    color: dash.muted,
    lineHeight: 1.5,
  },
  addForm: { display: "flex", flexDirection: "column", gap: 12, maxWidth: "100%" },
  projectForm: {
    display: "flex",
    flexDirection: "column",
    gap: 12,
    maxWidth: "100%",
  },
  input: {
    width: "100%",
    marginTop: 6,
    padding: "10px 11px",
    borderRadius: 10,
    border: `1.5px solid ${dash.border}`,
    fontSize: 14,
    color: dash.text,
    boxSizing: "border-box",
    fontFamily: "inherit",
    background: "#f8fafc",
  },
  fileInput: {
    width: "100%",
    marginTop: 6,
    padding: "8px 0",
    fontSize: 13,
    fontFamily: "inherit",
    color: dash.muted,
  },
  selectedFileName: {
    margin: "0 0 4px",
    fontSize: 13,
    color: dash.text,
  },
  selectedFileHint: {
    margin: "0 0 4px",
    fontSize: 13,
    color: dash.subtle,
    fontStyle: "italic",
  },
  enrollFileMeta: {
    marginTop: 4,
  },
  parsedCount: {
    margin: "6px 0 0",
    fontSize: 13,
    color: dash.text,
    lineHeight: 1.45,
  },
  validationNote: {
    margin: "8px 0 0",
    fontSize: 12,
    color: "#c2410c",
    lineHeight: 1.45,
    fontWeight: 600,
  },
  manualFallbackLabel: {
    margin: "0 0 4px",
    fontSize: 12,
    fontWeight: 700,
    color: dash.text,
  },
  manualFallbackHint: {
    margin: "0 0 8px",
    fontSize: 12,
    color: dash.muted,
    lineHeight: 1.45,
  },
  fileExisting: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    padding: "10px 12px",
    borderRadius: 10,
    background: "#f1f5f9",
    border: `1px solid ${dash.border}`,
    fontSize: 13,
    color: dash.muted,
  },
  fileExistingText: { lineHeight: 1.45 },
  fileLink: { color: dash.accent, fontWeight: 700 },
  label: {
    display: "block",
    fontSize: 10,
    fontWeight: 700,
    color: dash.muted,
    textTransform: "uppercase",
    letterSpacing: "0.06em",
    marginBottom: 14,
  },
  textarea: {
    width: "100%",
    marginTop: 6,
    padding: "10px 11px",
    borderRadius: 10,
    border: `1.5px solid ${dash.border}`,
    fontSize: 14,
    color: dash.text,
    boxSizing: "border-box",
    fontFamily: "inherit",
    background: "#f8fafc",
    resize: "vertical",
    minHeight: 72,
  },
  primaryBtn: {
    alignSelf: "flex-start",
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    padding: "10px 16px",
    borderRadius: 10,
    border: "none",
    background: `linear-gradient(135deg,${dash.accent},#7c3aed)`,
    color: "#fff",
    fontSize: 13,
    fontWeight: 700,
    cursor: "pointer",
    fontFamily: "inherit",
    boxShadow: "0 4px 16px rgba(79,70,229,0.3)",
  },
  emptyInline: {
    textAlign: "center",
    padding: "20px 12px",
    borderRadius: 12,
    background: "#f8fafc",
    border: "1px dashed #cbd5e1",
  },
  emptyTitle: {
    margin: "0 0 6px",
    fontSize: 14,
    fontWeight: 800,
    color: "#475569",
  },
  emptyDesc: { margin: 0, fontSize: 12, color: "#94a3b8", lineHeight: 1.5 },
  tableWrap: { overflowX: "auto", borderRadius: 12, border: `1px solid ${dash.border}` },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    fontSize: 13,
    background: dash.surface,
  },
  th: {
    textAlign: "left",
    padding: "10px 12px",
    fontSize: 10,
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: "0.05em",
    color: dash.muted,
    background: "#f8fafc",
    borderBottom: `1px solid ${dash.border}`,
  },
  td: {
    padding: "12px",
    borderBottom: "1px solid #f1f5f9",
    color: "#334155",
  },
  removeRowBtn: {
    fontSize: 12,
    fontWeight: 600,
    fontFamily: "inherit",
    padding: "4px 8px",
    borderRadius: 6,
    border: `1px solid ${dash.border}`,
    background: dash.surface,
    color: dash.muted,
  },
  teamGrid: {
    display: "grid",
    gridTemplateColumns: "1fr",
    gap: 12,
  },
  teamCard: {
    background: "#fafafa",
    borderRadius: 12,
    border: `1px solid ${dash.border}`,
    padding: "14px 12px",
    display: "flex",
    flexDirection: "column",
    gap: 8,
  },
  teamCardHead: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  },
  teamIdBadge: {
    fontSize: 11,
    fontWeight: 800,
    color: "#4338ca",
    background: dash.accentMuted,
    padding: "4px 8px",
    borderRadius: 8,
    border: "1px solid #c7d2fe",
  },
  teamMemberPill: {
    fontSize: 11,
    fontWeight: 700,
    color: dash.muted,
    background: "#f1f5f9",
    padding: "4px 8px",
    borderRadius: 8,
    border: `1px solid ${dash.border}`,
    whiteSpace: "nowrap",
  },
  teamProjectLabel: {
    margin: "0 0 2px",
    fontSize: 10,
    fontWeight: 700,
    color: dash.muted,
    textTransform: "uppercase",
    letterSpacing: "0.06em",
  },
  teamProjectTitle: {
    margin: 0,
    fontSize: 14,
    fontWeight: 700,
    color: dash.text,
    lineHeight: 1.4,
  },
  teamLeaderLine: {
    margin: 0,
    fontSize: 12,
    color: "#475569",
  },
  teamLeaderLabel: {
    fontWeight: 700,
    color: dash.muted,
    textTransform: "uppercase",
    fontSize: 9,
    letterSpacing: "0.06em",
  },
  teamMembersBlock: { marginTop: 4 },
  teamMembersLabel: {
    margin: "0 0 6px",
    fontSize: 10,
    fontWeight: 700,
    color: dash.muted,
    textTransform: "uppercase",
    letterSpacing: "0.06em",
  },
  codeBadge: {
    display: "inline-block",
    fontSize: 11,
    fontWeight: 700,
    padding: "4px 10px",
    borderRadius: 8,
    background: dash.accentMuted,
    color: dash.accent,
    border: "1px solid #c7d2fe",
  },
};
