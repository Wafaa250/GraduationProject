import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type FormEvent,
} from "react";
import {
  Briefcase,
  Calendar,
  ChevronDown,
  ChevronRight,
  FileText,
  GraduationCap,
  Hash,
  Layers,
  Network,
  Pencil,
  Plus,
  Ruler,
  Trash2,
  Users,
  X,
} from "lucide-react";
import { parseApiErrorMessage, resolveApiFileUrl } from "../../../../api/axiosInstance";
import {
  addStudentsToDoctorSection,
  createDoctorCourseProject,
  createDoctorCourseSection,
  deleteDoctorCourseProject,
  getDoctorCourseDetail,
  getDoctorCourseProjectSetting,
  getDoctorCourseProjects,
  getDoctorCourseSections,
  getDoctorCourseStudents,
  getDoctorCourseTeams,
  getDoctorSectionProjectSetting,
  removeStudentFromDoctorCourse,
  upsertDoctorCourseProjectSetting,
  updateDoctorCourseProject,
  upsertDoctorSectionProjectSetting,
  type CourseSection,
  type DoctorCourseDetail,
  type DoctorCourseProject,
  type DoctorCourseProjectSetting,
  type DoctorCourseStudent,
  type DoctorCourseTeam,
} from "../../../../api/doctorCoursesApi";
import { useToast } from "../../../../context/ToastContext";
import { dash } from "./doctorDashTokens";

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

/** Safe label for semester (null / blank → em dash). */
function formatSemesterLabel(semester: string | null | undefined): string {
  if (semester == null) return "—";
  const t = String(semester).trim();
  return t.length > 0 ? t : "—";
}

function sectionCountDisplay(count: number | null | undefined): string {
  if (count == null || Number.isNaN(Number(count))) return "—";
  const n = Math.max(0, Math.floor(Number(count)));
  return String(n);
}

function formatStudentSectionLabel(s: DoctorCourseStudent): string {
  if (s.sectionNumber != null && Number.isFinite(Number(s.sectionNumber))) {
    return `Section ${s.sectionNumber}`;
  }
  return "Unassigned";
}

type SectionProjectDraft = {
  title: string;
  description: string;
  teamSize: number;
};

function defaultSectionProjectDraft(): SectionProjectDraft {
  return { title: "", description: "", teamSize: 2 };
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
  const [sections, setSections] = useState<CourseSection[]>([]);
  const [newSectionNumber, setNewSectionNumber] = useState("");
  const [creatingSection, setCreatingSection] = useState(false);
  const [selectedStudentIdsForSection, setSelectedStudentIdsForSection] =
    useState<Set<number>>(() => new Set());
  const [assignTargetSectionId, setAssignTargetSectionId] = useState("");
  const [assigningToSection, setAssigningToSection] = useState(false);
  const [sectionProjectDrafts, setSectionProjectDrafts] = useState<
    Record<number, SectionProjectDraft>
  >({});
  const [sectionProjectExpanded, setSectionProjectExpanded] = useState<
    Record<number, boolean>
  >({});
  const [sectionProjectHydrated, setSectionProjectHydrated] = useState(true);
  const [savingSectionProjectId, setSavingSectionProjectId] = useState<
    number | null
  >(null);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  /** UI-only: which workspace tab is visible (data loading unchanged). */
  const [activeTab, setActiveTab] = useState<
    | "overview"
    | "sections"
    | "projectSettings"
    | "projects"
    | "students"
  >("overview");

  const [courseProjects, setCourseProjects] = useState<DoctorCourseProject[]>(
    [],
  );
  const [createProjectModalOpen, setCreateProjectModalOpen] = useState(false);
  /** When modal is open: `null` = create, number = project id being edited. */
  const [editingProjectId, setEditingProjectId] = useState<number | null>(null);
  const [createProjectSubmitting, setCreateProjectSubmitting] = useState(false);
  const [deletingProjectId, setDeletingProjectId] = useState<number | null>(null);
  const [cpTitle, setCpTitle] = useState("");
  const [cpDescription, setCpDescription] = useState("");
  const [cpTeamSize, setCpTeamSize] = useState(2);
  const [cpApplyAllSections, setCpApplyAllSections] = useState(true);
  const [cpSectionIds, setCpSectionIds] = useState<Set<number>>(() => new Set());
  const [cpAllowCrossSectionTeams, setCpAllowCrossSectionTeams] =
    useState(false);

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

  /** Refetch per-section project forms only when the set of section ids changes. */
  const sectionIdsFingerprint = useMemo(
    () =>
      [...sections]
        .map((s) => s.id)
        .sort((a, b) => a - b)
        .join(","),
    [sections],
  );

  const courseDetailId = course?.id;
  const courseUsesSharedProject = course?.useSharedProjectAcrossSections ?? true;

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

  const loadSections = useCallback(async () => {
    if (idInvalid) return;
    const list = await getDoctorCourseSections(courseId);
    setSections(list);
  }, [courseId, idInvalid]);

  const loadCourseProjects = useCallback(async () => {
    if (idInvalid) return;
    const list = await getDoctorCourseProjects(courseId);
    setCourseProjects(list);
  }, [courseId, idInvalid]);

  const loadAll = useCallback(async () => {
    if (idInvalid) return;
    setCourse(null);
    setStudents([]);
    setTeams([]);
    setProjectSetting(null);
    setSections([]);
    setCourseProjects([]);
    setLoading(true);
    setLoadError(null);
    try {
      await Promise.all([
        loadCourseAndStudents(),
        loadProjectSettingOnly(),
        loadSections(),
        loadCourseProjects(),
      ]);
    } catch (err) {
      setLoadError(parseApiErrorMessage(err));
      setCourse(null);
      setStudents([]);
      setTeams([]);
      setProjectSetting(null);
      setSections([]);
      setCourseProjects([]);
    } finally {
      setLoading(false);
    }
  }, [
    courseId,
    idInvalid,
    loadCourseAndStudents,
    loadCourseProjects,
    loadProjectSettingOnly,
    loadSections,
  ]);

  useEffect(() => {
    if (idInvalid) {
      setCourse(null);
      setStudents([]);
      setTeams([]);
      setProjectSetting(null);
      setSections([]);
      setCourseProjects([]);
      setSelectedStudentIdsForSection(new Set());
      setAssignTargetSectionId("");
      setSectionProjectDrafts({});
      setSectionProjectExpanded({});
      setSectionProjectHydrated(true);
      setSavingSectionProjectId(null);
      setLoadError(null);
      return;
    }
    void loadAll();
  }, [idInvalid, loadAll]);

  useEffect(() => {
    if (idInvalid || courseDetailId == null) return;
    if (courseUsesSharedProject) {
      setSectionProjectDrafts({});
      setSectionProjectExpanded({});
      setSectionProjectHydrated(true);
      return;
    }
    if (sections.length === 0) {
      setSectionProjectDrafts({});
      setSectionProjectHydrated(true);
      return;
    }
    let cancelled = false;
    setSectionProjectHydrated(false);
    void (async () => {
      try {
        const results = await Promise.all(
          sections.map(async (sec) => {
            const ps = await getDoctorSectionProjectSetting(sec.id);
            return { id: sec.id, ps };
          }),
        );
        if (cancelled) return;
        const next: Record<number, SectionProjectDraft> = {};
        for (const { id, ps } of results) {
          next[id] = {
            title: ps?.title ?? "",
            description: ps?.description ?? "",
            teamSize:
              ps != null && ps.teamSize >= 2 && ps.teamSize <= 10
                ? ps.teamSize
                : 2,
          };
        }
        setSectionProjectDrafts(next);
      } catch (err) {
        if (!cancelled) {
          showToast(parseApiErrorMessage(err), "error");
          setSectionProjectDrafts({});
        }
      } finally {
        if (!cancelled) setSectionProjectHydrated(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [courseDetailId, courseUsesSharedProject, sectionIdsFingerprint, idInvalid, showToast]);

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
      setNewSectionNumber("");
      setSelectedStudentIdsForSection(new Set());
      setAssignTargetSectionId("");
      setSectionProjectDrafts({});
      setSectionProjectExpanded({});
      setSectionProjectHydrated(true);
      setSavingSectionProjectId(null);
      setActiveTab("overview");
      setCourseProjects([]);
      setCreateProjectModalOpen(false);
      setEditingProjectId(null);
      setCreateProjectSubmitting(false);
      setDeletingProjectId(null);
      setCpTitle("");
      setCpDescription("");
      setCpTeamSize(2);
      setCpApplyAllSections(true);
      setCpSectionIds(new Set());
      setCpAllowCrossSectionTeams(false);
    }
  }, [open]);

  const resetCreateProjectForm = useCallback(() => {
    setCpTitle("");
    setCpDescription("");
    setCpTeamSize(2);
    setCpApplyAllSections(true);
    setCpSectionIds(new Set());
    setCpAllowCrossSectionTeams(false);
  }, []);

  const openCreateProjectModal = useCallback(() => {
    resetCreateProjectForm();
    setEditingProjectId(null);
    setCreateProjectModalOpen(true);
  }, [resetCreateProjectForm]);

  const openEditProjectModal = useCallback((p: DoctorCourseProject) => {
    setCpTitle(p.title);
    setCpDescription(p.description?.trim() ?? "");
    const ts = p.teamSize;
    setCpTeamSize(ts >= 2 && ts <= 10 ? ts : 2);
    setCpApplyAllSections(p.applyToAllSections);
    setCpSectionIds(
      p.applyToAllSections
        ? new Set()
        : new Set(p.sections.map((s) => s.sectionId)),
    );
    setCpAllowCrossSectionTeams(p.allowCrossSectionTeams);
    setEditingProjectId(p.id);
    setCreateProjectModalOpen(true);
  }, []);

  const closeProjectModal = useCallback(() => {
    setCreateProjectModalOpen(false);
    setEditingProjectId(null);
    resetCreateProjectForm();
  }, [resetCreateProjectForm]);

  const handleProjectModalSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (idInvalid || createProjectSubmitting) return;

    const title = cpTitle.trim();
    if (!title) {
      showToast("Title is required.", "error");
      return;
    }

    const teamSizeRaw = Number(cpTeamSize);
    if (!Number.isFinite(teamSizeRaw)) {
      showToast("Team size is required.", "error");
      return;
    }
    const teamSizeRounded = Math.round(teamSizeRaw);
    if (teamSizeRounded < 2 || teamSizeRounded > 10) {
      showToast("Team size must be a whole number between 2 and 10.", "error");
      return;
    }

    if (!cpApplyAllSections) {
      if (sections.length === 0) {
        showToast(
          "Add at least one section in the Sections tab, or enable Apply to all sections.",
          "error",
        );
        return;
      }
      if (cpSectionIds.size === 0) {
        showToast("Select at least one section, or enable Apply to all sections.", "error");
        return;
      }
    }

    const body = {
      title,
      description: cpDescription.trim() || "",
      teamSize: teamSizeRounded,
      applyToAllSections: cpApplyAllSections,
      allowCrossSectionTeams: cpAllowCrossSectionTeams,
      sectionIds: cpApplyAllSections
        ? []
        : [...cpSectionIds].sort((a, b) => a - b),
    };

    setCreateProjectSubmitting(true);
    try {
      if (editingProjectId != null) {
        await updateDoctorCourseProject(editingProjectId, body);
        showToast("Project updated.", "success");
      } else {
        await createDoctorCourseProject(courseId, body);
        showToast("Project created.", "success");
      }
      closeProjectModal();
      await loadCourseProjects();
    } catch (err) {
      showToast(parseApiErrorMessage(err), "error");
    } finally {
      setCreateProjectSubmitting(false);
    }
  };

  const handleDeleteProject = async (p: DoctorCourseProject) => {
    if (idInvalid || deletingProjectId != null) return;
    const ok = window.confirm(
      `Delete project "${p.title}"? This cannot be undone.`,
    );
    if (!ok) return;
    setDeletingProjectId(p.id);
    try {
      await deleteDoctorCourseProject(p.id);
      showToast("Project deleted.", "success");
      await loadCourseProjects();
    } catch (err) {
      showToast(parseApiErrorMessage(err), "error");
    } finally {
      setDeletingProjectId(null);
    }
  };

  const formatProjectSectionScope = (p: DoctorCourseProject): string => {
    if (p.applyToAllSections) return "All sections";
    if (p.sections.length === 0) return "—";
    return [...p.sections]
      .sort((a, b) => a.sectionNumber - b.sectionNumber)
      .map((s) => String(s.sectionNumber))
      .join(", ");
  };

  const formatProjectCreatedAt = (iso: string): string => {
    try {
      const d = new Date(iso);
      if (Number.isNaN(d.getTime())) return "—";
      return d.toLocaleString(undefined, {
        dateStyle: "medium",
        timeStyle: "short",
      });
    } catch {
      return "—";
    }
  };

  const allStudentsSelectedForAssign =
    students.length > 0 &&
    students.every((s) => selectedStudentIdsForSection.has(s.studentId));

  const handleCreateSection = async (e: FormEvent) => {
    e.preventDefault();
    if (idInvalid) return;
    const raw = newSectionNumber.trim();
    const n = parseInt(raw, 10);
    if (!Number.isFinite(n) || n < 1 || n > 999) {
      showToast("Enter a section number between 1 and 999.", "error");
      return;
    }
    setCreatingSection(true);
    try {
      await createDoctorCourseSection(courseId, { sectionNumber: n });
      showToast("Section created.", "success");
      setNewSectionNumber("");
      await Promise.all([loadSections(), loadCourseAndStudents()]);
    } catch (err) {
      showToast(parseApiErrorMessage(err), "error");
    } finally {
      setCreatingSection(false);
    }
  };

  const patchSectionDraft = (sectionId: number, patch: Partial<SectionProjectDraft>) => {
    setSectionProjectDrafts((prev) => ({
      ...prev,
      [sectionId]: {
        ...defaultSectionProjectDraft(),
        ...prev[sectionId],
        ...patch,
      },
    }));
  };

  const handleSectionProjectSubmit = async (e: FormEvent, sectionId: number) => {
    e.preventDefault();
    if (idInvalid || course == null || course.useSharedProjectAcrossSections) {
      return;
    }
    const d = sectionProjectDrafts[sectionId] ?? defaultSectionProjectDraft();
    const title = d.title.trim();
    if (!title) {
      showToast("Title is required.", "error");
      return;
    }
    let teamSize = Number(d.teamSize);
    if (Number.isNaN(teamSize)) teamSize = 2;
    teamSize = Math.min(10, Math.max(2, Math.round(teamSize)));
    setSavingSectionProjectId(sectionId);
    try {
      await upsertDoctorSectionProjectSetting(sectionId, {
        title,
        description: d.description ?? "",
        teamSize,
      });
      showToast("Section project setting saved.", "success");
      const updated = await getDoctorSectionProjectSetting(sectionId);
      setSectionProjectDrafts((prev) => ({
        ...prev,
        [sectionId]: {
          title: updated?.title ?? title,
          description: updated?.description ?? "",
          teamSize:
            updated != null && updated.teamSize >= 2 && updated.teamSize <= 10
              ? updated.teamSize
              : teamSize,
        },
      }));
      await loadSections();
    } catch (err) {
      showToast(parseApiErrorMessage(err), "error");
    } finally {
      setSavingSectionProjectId(null);
    }
  };

  const handleAssignToSection = async () => {
    if (idInvalid) return;
    const sectionId = parseInt(assignTargetSectionId, 10);
    if (!Number.isFinite(sectionId) || sectionId < 1) {
      showToast("Select a target section.", "error");
      return;
    }
    const picked = students.filter((s) =>
      selectedStudentIdsForSection.has(s.studentId),
    );
    if (picked.length === 0) {
      showToast("Select at least one student.", "error");
      return;
    }
    const universityIds = picked
      .map((s) => s.universityId.trim())
      .filter((id) => id.length > 0);
    if (universityIds.length !== picked.length) {
      showToast(
        "One or more selected students are missing a university ID.",
        "error",
      );
      return;
    }
    setAssigningToSection(true);
    try {
      await addStudentsToDoctorSection(sectionId, universityIds);
      showToast("Students assigned to section.", "success");
      setSelectedStudentIdsForSection(new Set());
      await Promise.all([loadCourseAndStudents(), loadSections()]);
    } catch (err) {
      showToast(parseApiErrorMessage(err), "error");
    } finally {
      setAssigningToSection(false);
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
              <div style={S.tabBar} role="tablist" aria-label="Course workspace">
                {(
                  [
                    ["overview", "Overview"],
                    ["sections", "Sections"],
                    ["projectSettings", "Project Settings"],
                    ["students", "Students"],
                    ["projects", "Projects"],
                  ] as const
                ).map(([id, label]) => {
                  const isActive = activeTab === id;
                  return (
                    <button
                      key={id}
                      type="button"
                      role="tab"
                      aria-selected={isActive}
                      id={`dd-course-tab-${id}`}
                      onClick={() => setActiveTab(id)}
                      style={{
                        ...S.tabBtn,
                        ...(isActive ? S.tabBtnActive : {}),
                      }}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
              <div style={S.tabPanel}>
              {activeTab === "overview" && (
              <>
              <section style={S.configSection} aria-label="Course configuration">
                <p style={S.configEyebrow}>Course configuration</p>
                <div style={S.configGrid}>
                  <div style={S.configCard}>
                    <div style={S.configCardHead}>
                      <Calendar
                        size={16}
                        color={dash.accent}
                        style={{ flexShrink: 0 }}
                        aria-hidden
                      />
                      <span style={S.configCardEyebrow}>Semester</span>
                    </div>
                    <p style={S.configCardValue}>
                      {formatSemesterLabel(course.semester)}
                    </p>
                  </div>
                  <div style={S.configCard}>
                    <div style={S.configCardHead}>
                      <Layers
                        size={16}
                        color="#7c3aed"
                        style={{ flexShrink: 0 }}
                        aria-hidden
                      />
                      <span style={S.configCardEyebrow}>Project mode</span>
                    </div>
                    <p style={S.configCardValue}>
                      {course.useSharedProjectAcrossSections
                        ? "Shared across sections"
                        : "Section-specific projects"}
                    </p>
                  </div>
                  <div style={S.configCard}>
                    <div style={S.configCardHead}>
                      <Network
                        size={16}
                        color="#0d9488"
                        style={{ flexShrink: 0 }}
                        aria-hidden
                      />
                      <span style={S.configCardEyebrow}>Team rule</span>
                    </div>
                    <p style={S.configCardValue}>
                      {course.allowCrossSectionTeams
                        ? "Cross-section teams allowed"
                        : "Same-section only"}
                    </p>
                  </div>
                  <div style={S.configCard}>
                    <div style={S.configCardHead}>
                      <Hash
                        size={16}
                        color={dash.muted}
                        style={{ flexShrink: 0 }}
                        aria-hidden
                      />
                      <span style={S.configCardEyebrow}>Sections</span>
                    </div>
                    <p style={S.configCardValue}>
                      {sectionCountDisplay(course.sectionCount)}
                    </p>
                  </div>
                </div>
              </section>

              <section style={S.overviewSection}>
                <p style={S.sectionEyebrow}>At a glance</p>
                <p style={S.sectionLead}>
                  Enrollment and teams tie to the{" "}
                  <strong style={{ color: dash.text }}>project setting</strong> in the
                  Project Settings tab: students join the course, then form teams up to
                  the configured size.
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
              {activeTab === "projectSettings" && (
              <>
              <section style={S.section}>
                <h3 style={S.sectionTitle}>Project Settings</h3>
                {course.useSharedProjectAcrossSections ? (
                  <>
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
                  </>
                ) : (
                  <>
                    <div style={S.projectSectionNotice}>
                      <p style={S.projectSectionNoticeText}>
                        This course uses section-specific project settings.
                      </p>
                    </div>
                    <p style={S.sectionHint}>
                      Configure the active project for each section below.
                    </p>
                    <div
                      style={{
                        ...S.sectionCardsColumn,
                        ...(creatingSection ? { opacity: 0.65 } : {}),
                      }}
                    >
                    {!sectionProjectHydrated && sections.length > 0 ? (
                      <p style={S.sectionProjectHydrating}>
                        Loading section project settings…
                      </p>
                    ) : null}
                    {sections.map((sec) => {
                      const draft =
                        sectionProjectDrafts[sec.id] ?? defaultSectionProjectDraft();
                      const expanded = sectionProjectExpanded[sec.id] ?? false;
                      const savingThis = savingSectionProjectId === sec.id;
                      const formDisabled =
                        !sectionProjectHydrated || savingThis;
                      return (
                        <div key={sec.id} style={S.sectionCard}>
                          <div style={S.sectionCardTop}>
                            <div style={S.sectionCardTitleBlock}>
                              <span style={S.sectionNumBadge}>
                                Section {sec.sectionNumber}
                              </span>
                              <span style={S.sectionCardMeta}>
                                {sec.studentCount} student
                                {sec.studentCount === 1 ? "" : "s"}
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() =>
                                setSectionProjectExpanded((prev) => ({
                                  ...prev,
                                  [sec.id]: !prev[sec.id],
                                }))
                              }
                              style={S.sectionCardToggle}
                              disabled={creatingSection}
                            >
                              {expanded ? (
                                <ChevronDown size={16} aria-hidden />
                              ) : (
                                <ChevronRight size={16} aria-hidden />
                              )}
                              Project setting
                            </button>
                          </div>
                          {expanded ? (
                            <form
                              onSubmit={(e) =>
                                void handleSectionProjectSubmit(e, sec.id)
                              }
                              style={S.secProjForm}
                            >
                              <label style={S.secProjLabel}>
                                Title
                                <input
                                  style={S.secProjInput}
                                  value={draft.title}
                                  onChange={(e) =>
                                    patchSectionDraft(sec.id, {
                                      title: e.target.value,
                                    })
                                  }
                                  placeholder="e.g. Section project brief"
                                  autoComplete="off"
                                  disabled={formDisabled}
                                />
                              </label>
                              <label style={S.secProjLabel}>
                                Description
                                <textarea
                                  style={S.secProjTextarea}
                                  value={draft.description}
                                  onChange={(e) =>
                                    patchSectionDraft(sec.id, {
                                      description: e.target.value,
                                    })
                                  }
                                  placeholder="Goals, deliverables…"
                                  rows={3}
                                  disabled={formDisabled}
                                />
                              </label>
                              <label style={S.secProjLabel}>
                                Team size
                                <input
                                  style={S.secProjInput}
                                  type="number"
                                  min={2}
                                  max={10}
                                  value={draft.teamSize}
                                  onChange={(e) => {
                                    const v = parseInt(e.target.value, 10);
                                    patchSectionDraft(sec.id, {
                                      teamSize: Number.isFinite(v)
                                        ? v
                                        : draft.teamSize,
                                    });
                                  }}
                                  disabled={formDisabled}
                                />
                              </label>
                              <button
                                type="submit"
                                style={{
                                  ...S.secProjSubmitBtn,
                                  ...(formDisabled
                                    ? { opacity: 0.65, cursor: "not-allowed" }
                                    : {}),
                                }}
                                disabled={formDisabled}
                              >
                                {savingThis ? "Saving…" : "Save"}
                              </button>
                            </form>
                          ) : null}
                        </div>
                      );
                    })}
                  </div>
                  </>
                )}
              </section>
              </>
              )}
              {activeTab === "sections" && (
              <>
              <section style={S.section}>
                <h3 style={S.sectionTitle}>Sections</h3>
                <p style={S.sectionHint}>
                  Define sections for this course (numbers must be unique). Assign roster
                  students to sections once they appear in the course list.
                </p>
                <form
                  onSubmit={(e) => void handleCreateSection(e)}
                  style={S.sectionsCreateForm}
                >
                  <label style={S.sectionsFieldLabel}>
                    Section number
                    <input
                      style={S.input}
                      type="number"
                      min={1}
                      max={999}
                      step={1}
                      value={newSectionNumber}
                      onChange={(e) => setNewSectionNumber(e.target.value)}
                      placeholder="e.g. 1"
                      autoComplete="off"
                      disabled={creatingSection}
                    />
                  </label>
                  <button
                    type="submit"
                    style={{
                      ...S.secondaryBtnSections,
                      ...(creatingSection
                        ? { opacity: 0.7, cursor: "not-allowed" }
                        : {}),
                    }}
                    disabled={creatingSection}
                  >
                    <Plus size={16} />
                    {creatingSection ? "Creating…" : "Create Section"}
                  </button>
                </form>
                {sections.length === 0 ? (
                  <div
                    style={{
                      ...S.emptyInline,
                      ...(creatingSection ? { opacity: 0.65 } : {}),
                    }}
                  >
                    <p style={S.emptyTitle}>No sections yet</p>
                    <p style={S.emptyDesc}>
                      Add a section number above. You can create multiple sections
                      (e.g. 1, 2, 3) and assign students to them later.
                    </p>
                  </div>
                ) : (
                  <div
                    style={{
                      ...S.tableWrap,
                      ...(creatingSection ? { opacity: 0.65 } : {}),
                    }}
                  >
                    <table style={S.table}>
                      <thead>
                        <tr>
                          <th style={S.th}>Section</th>
                          <th style={S.th}>Students</th>
                        </tr>
                      </thead>
                      <tbody>
                        {sections.map((sec) => (
                          <tr key={sec.id}>
                            <td style={S.td}>
                              <span style={S.sectionNumBadge}>
                                Section {sec.sectionNumber}
                              </span>
                            </td>
                            <td style={S.td}>{sec.studentCount}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>

              <section style={S.section}>
                <h3 style={S.sectionTitle}>Assign students to section</h3>
                <p style={S.sectionHint}>
                  Everyone listed here is enrolled in this course. They can organize
                  into teams once a project setting exists. Select students to assign
                  them to a section (create sections in the block above first).
                </p>
                {students.length === 0 ? (
                  <div style={S.emptyInline}>
                    <p style={S.emptyTitle}>No students enrolled yet</p>
                    <p style={S.emptyDesc}>
                      Students must exist on the course roster before you can assign them
                      to a section. Add enrollments from the course workspace per section.
                    </p>
                  </div>
                ) : (
                  <>
                    <div style={S.assignToolbar}>
                      <label style={S.assignToolbarLabel} htmlFor="dd-assign-section">
                        Target section
                      </label>
                      <select
                        id="dd-assign-section"
                        style={S.assignSelect}
                        value={assignTargetSectionId}
                        onChange={(e) => setAssignTargetSectionId(e.target.value)}
                        disabled={assigningToSection || sections.length === 0}
                      >
                        <option value="">
                          {sections.length === 0
                            ? "No sections — create one above"
                            : "Select section…"}
                        </option>
                        {sections.map((sec) => (
                          <option key={sec.id} value={String(sec.id)}>
                            Section {sec.sectionNumber}
                          </option>
                        ))}
                      </select>
                      <button
                        type="button"
                        onClick={() => void handleAssignToSection()}
                        style={{
                          ...S.assignBtn,
                          ...(assigningToSection ||
                          selectedStudentIdsForSection.size === 0 ||
                          !assignTargetSectionId
                            ? { opacity: 0.55, cursor: "not-allowed" }
                            : {}),
                        }}
                        disabled={
                          assigningToSection ||
                          selectedStudentIdsForSection.size === 0 ||
                          !assignTargetSectionId
                        }
                      >
                        {assigningToSection ? "Assigning…" : "Assign to Section"}
                      </button>
                    </div>
                    <div
                      style={{
                        ...S.tableWrap,
                        ...(assigningToSection ? { opacity: 0.75 } : {}),
                      }}
                    >
                      <table style={S.table}>
                        <thead>
                          <tr>
                            <th style={{ ...S.th, width: 44 }}>
                              <input
                                type="checkbox"
                                title="Select all"
                                checked={allStudentsSelectedForAssign}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setSelectedStudentIdsForSection(
                                      new Set(
                                        students.map((st) => st.studentId),
                                      ),
                                    );
                                  } else {
                                    setSelectedStudentIdsForSection(new Set());
                                  }
                                }}
                                disabled={assigningToSection}
                                style={S.rowCheckbox}
                              />
                            </th>
                            <th style={S.th}>Name</th>
                            <th style={S.th}>Section</th>
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
                            const secLabel = formatStudentSectionLabel(s);
                            return (
                              <tr key={`${s.studentId}-${s.userId}`}>
                                <td
                                  style={{
                                    ...S.td,
                                    ...(rowBusy ? { opacity: 0.55 } : {}),
                                    width: 44,
                                    textAlign: "center",
                                  }}
                                >
                                  <input
                                    type="checkbox"
                                    checked={selectedStudentIdsForSection.has(
                                      s.studentId,
                                    )}
                                    onChange={() => {
                                      setSelectedStudentIdsForSection((prev) => {
                                        const next = new Set(prev);
                                        if (next.has(s.studentId)) {
                                          next.delete(s.studentId);
                                        } else {
                                          next.add(s.studentId);
                                        }
                                        return next;
                                      });
                                    }}
                                    disabled={rowBusy || assigningToSection}
                                    style={S.rowCheckbox}
                                  />
                                </td>
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
                                  <span
                                    style={
                                      secLabel === "Unassigned"
                                        ? S.sectionUnassigned
                                        : S.sectionAssigned
                                    }
                                  >
                                    {secLabel}
                                  </span>
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
                  </>
                )}
              </section>
              </>
              )}
              {activeTab === "projects" && (
              <>
              <section style={S.section}>
                <div style={S.projectsTabHead}>
                  <div>
                    <h3 style={{ ...S.sectionTitle, marginBottom: 4 }}>
                      Projects
                    </h3>
                    <p style={{ ...S.sectionHint, marginBottom: 0 }}>
                      Define projects for this course, scoped to all sections or
                      selected sections. Team size and cross-section rules apply per
                      project.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={openCreateProjectModal}
                    style={S.createProjectBtn}
                  >
                    <Plus size={16} aria-hidden />
                    Create Project
                  </button>
                </div>
                {courseProjects.length === 0 ? (
                  <div style={S.emptyInline}>
                    <Briefcase size={28} color="#cbd5e1" style={{ marginBottom: 8 }} />
                    <p style={S.emptyTitle}>No projects yet</p>
                    <p style={S.emptyDesc}>
                      Create a project to assign it to all sections or pick specific
                      sections. Team size and cross-section rules can be set per
                      project.
                    </p>
                  </div>
                ) : (
                  <div style={S.localProjectList}>
                    {courseProjects.map((p) => (
                      <article key={p.id} style={S.localProjectCard}>
                        <div style={S.localProjectCardTop}>
                          <p style={S.localProjectName}>{p.title}</p>
                          <div style={S.projectCardActions}>
                            <button
                              type="button"
                              style={{
                                ...S.projectCardActionBtn,
                                ...(deletingProjectId != null
                                  ? { opacity: 0.55, cursor: "not-allowed" }
                                  : {}),
                              }}
                              disabled={deletingProjectId != null}
                              onClick={() => openEditProjectModal(p)}
                              aria-label="Edit project"
                            >
                              <Pencil size={14} aria-hidden />
                              Edit
                            </button>
                            <button
                              type="button"
                              style={{
                                ...S.projectCardActionBtnDanger,
                                ...(deletingProjectId != null
                                  ? { opacity: 0.55, cursor: "not-allowed" }
                                  : {}),
                              }}
                              disabled={deletingProjectId != null}
                              onClick={() => void handleDeleteProject(p)}
                              aria-label="Delete project"
                            >
                              <Trash2 size={14} aria-hidden />
                              {deletingProjectId === p.id ? "Deleting…" : "Delete"}
                            </button>
                          </div>
                        </div>
                        <p
                          style={{
                            ...S.localProjectDesc,
                            ...(p.description?.trim()
                              ? {}
                              : { fontStyle: "italic", color: dash.subtle }),
                          }}
                        >
                          {p.description?.trim() ? p.description.trim() : "No description"}
                        </p>
                        <div style={S.localProjectMetaRow}>
                          <span style={S.localProjectMetaLabel}>Team size</span>
                          <span style={S.localProjectMetaValue}>{p.teamSize}</span>
                        </div>
                        <div style={S.localProjectMetaRow}>
                          <span style={S.localProjectMetaLabel}>Section scope</span>
                          <span style={S.localProjectMetaValue}>
                            {formatProjectSectionScope(p)}
                          </span>
                        </div>
                        <div style={S.localProjectMetaRow}>
                          <span style={S.localProjectMetaLabel}>
                            Cross-section teams
                          </span>
                          <span style={S.localProjectMetaValue}>
                            {p.allowCrossSectionTeams
                              ? "Allowed"
                              : "Same section only"}
                          </span>
                        </div>
                        <div style={S.localProjectMetaRow}>
                          <span style={S.localProjectMetaLabel}>Created</span>
                          <span style={S.localProjectMetaValue}>
                            {formatProjectCreatedAt(p.createdAt)}
                          </span>
                        </div>
                      </article>
                    ))}
                  </div>
                )}
              </section>
              {createProjectModalOpen && (
                <div
                  style={P.nestedOverlay}
                  className="dd-course-create-project-overlay"
                  onClick={
                    createProjectSubmitting ? undefined : closeProjectModal
                  }
                >
                  <div
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="dd-project-modal-title"
                    style={P.nestedModal}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div style={P.nestedModalHeader}>
                      <h2 id="dd-project-modal-title" style={P.nestedModalTitle}>
                        {editingProjectId != null ? "Edit project" : "Create project"}
                      </h2>
                      <button
                        type="button"
                        onClick={closeProjectModal}
                        style={P.closeBtn}
                        aria-label="Close"
                        disabled={createProjectSubmitting}
                      >
                        <X size={20} />
                      </button>
                    </div>
                    <p style={P.nestedModalHint}>
                      {editingProjectId != null
                        ? "Update how this project applies to sections and team rules."
                        : "New projects are saved to the course and appear in this list."}
                    </p>
                    <form
                      onSubmit={(e) => void handleProjectModalSubmit(e)}
                      style={S.createProjectForm}
                    >
                      <label style={S.label}>
                        Title
                        <input
                          style={S.input}
                          value={cpTitle}
                          onChange={(e) => setCpTitle(e.target.value)}
                          placeholder="e.g. Semester build milestone"
                          autoComplete="off"
                          autoFocus={editingProjectId == null}
                          disabled={createProjectSubmitting}
                        />
                      </label>
                      <label style={S.label}>
                        Description
                        <textarea
                          style={S.textarea}
                          value={cpDescription}
                          onChange={(e) => setCpDescription(e.target.value)}
                          placeholder="Goals, deliverables…"
                          rows={3}
                          disabled={createProjectSubmitting}
                        />
                      </label>
                      <label style={S.label}>
                        Team size
                        <input
                          style={S.input}
                          type="number"
                          min={2}
                          max={10}
                          step={1}
                          value={cpTeamSize}
                          onChange={(e) => setCpTeamSize(Number(e.target.value))}
                          disabled={createProjectSubmitting}
                        />
                      </label>
                      <label style={S.checkboxLabel}>
                        <input
                          type="checkbox"
                          checked={cpApplyAllSections}
                          onChange={(e) => {
                            const v = e.target.checked;
                            setCpApplyAllSections(v);
                            if (v) setCpSectionIds(new Set());
                          }}
                          style={S.checkboxInput}
                          disabled={createProjectSubmitting}
                        />
                        <span>Apply to all sections</span>
                      </label>
                      {!cpApplyAllSections ? (
                        <div style={S.sectionPickBox}>
                          <p style={S.sectionPickTitle}>Sections</p>
                          {sections.length === 0 ? (
                            <p style={S.sectionPickEmpty}>
                              No sections yet. Add sections in the Sections tab, then pick
                              them here.
                            </p>
                          ) : (
                            <div style={S.sectionPickList}>
                              {sections.map((sec) => {
                                const checked = cpSectionIds.has(sec.id);
                                return (
                                  <label key={sec.id} style={S.sectionPickRow}>
                                    <input
                                      type="checkbox"
                                      checked={checked}
                                      onChange={() => {
                                        setCpSectionIds((prev) => {
                                          const next = new Set(prev);
                                          if (next.has(sec.id)) next.delete(sec.id);
                                          else next.add(sec.id);
                                          return next;
                                        });
                                      }}
                                      disabled={createProjectSubmitting}
                                      style={S.rowCheckbox}
                                    />
                                    <span>
                                      Section {sec.sectionNumber}{" "}
                                      <span
                                        style={{ color: dash.muted, fontWeight: 600 }}
                                      >
                                        ({sec.studentCount} enrolled)
                                      </span>
                                    </span>
                                  </label>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      ) : null}
                      <label style={S.checkboxLabel}>
                        <input
                          type="checkbox"
                          checked={cpAllowCrossSectionTeams}
                          onChange={(e) =>
                            setCpAllowCrossSectionTeams(e.target.checked)
                          }
                          style={S.checkboxInput}
                          disabled={createProjectSubmitting}
                        />
                        <span>Allow cross-section teams</span>
                      </label>
                      <div style={S.createProjectActions}>
                        <button
                          type="button"
                          onClick={closeProjectModal}
                          style={S.secondaryBtnSections}
                          disabled={createProjectSubmitting}
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          style={{
                            ...S.primaryBtn,
                            ...(createProjectSubmitting
                              ? { opacity: 0.75, cursor: "not-allowed" }
                              : {}),
                          }}
                          disabled={createProjectSubmitting}
                        >
                          {createProjectSubmitting
                            ? editingProjectId != null
                              ? "Saving…"
                              : "Creating…"
                            : editingProjectId != null
                              ? "Save changes"
                              : "Create project"}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}
              </>
              )}
              {activeTab === "students" && (
              <>
              <section style={S.section}>
                <h3 style={S.sectionTitle}>Enrolled students</h3>
                <p style={S.sectionHint}>
                  Course roster from the server. New enrollments are added per section from
                  the course workspace, not here.
                </p>
                {students.length === 0 ? (
                  <div style={S.emptyInline}>
                    <p style={S.emptyTitle}>No students enrolled yet</p>
                    <p style={S.emptyDesc}>
                      When students are enrolled for this course, they will appear here. Use
                      the course workspace to manage section rosters.
                    </p>
                  </div>
                ) : (
                  <div style={S.tableWrap}>
                    <table style={S.table}>
                      <thead>
                        <tr>
                          <th style={S.th}>Name</th>
                          <th style={S.th}>Section</th>
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
                          const secLabel = formatStudentSectionLabel(s);
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
                                <span
                                  style={
                                    secLabel === "Unassigned"
                                      ? S.sectionUnassigned
                                      : S.sectionAssigned
                                  }
                                >
                                  {secLabel}
                                </span>
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
              </>
              )}
              </div>
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
  nestedOverlay: {
    position: "fixed",
    inset: 0,
    zIndex: 2100,
    background: "rgba(15,23,42,0.5)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
  },
  nestedModal: {
    zIndex: 2101,
    width: "min(440px, 94vw)",
    maxHeight: "min(640px, 90vh)",
    overflowY: "auto",
    borderRadius: 16,
    padding: 20,
    background: "#fff",
    border: `1px solid ${dash.border}`,
    boxShadow: dash.shadowLg,
    fontFamily: dash.font,
    color: dash.text,
  },
  nestedModalHeader: {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 6,
  },
  nestedModalTitle: {
    margin: 0,
    fontSize: 17,
    fontWeight: 800,
    fontFamily: dash.fontDisplay,
    lineHeight: 1.3,
  },
  nestedModalHint: {
    margin: "0 0 16px",
    fontSize: 12,
    color: dash.muted,
    lineHeight: 1.45,
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
  tabBar: {
    display: "flex",
    flexWrap: "wrap",
    gap: 6,
    marginBottom: 14,
    paddingBottom: 12,
    borderBottom: `1px solid ${dash.border}`,
  },
  tabBtn: {
    padding: "8px 14px",
    borderRadius: 10,
    border: `1px solid ${dash.border}`,
    background: dash.surface,
    color: dash.muted,
    fontSize: 12,
    fontWeight: 700,
    cursor: "pointer",
    fontFamily: dash.font,
  },
  tabBtnActive: {
    borderColor: dash.accent,
    background: "linear-gradient(180deg, #f0f9ff 0%, #fff 100%)",
    color: dash.text,
    boxShadow: "0 1px 2px rgba(14, 165, 233, 0.12)",
  },
  tabPanel: {
    minHeight: 120,
  },
  projectsTabHead: {
    display: "flex",
    flexWrap: "wrap",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 14,
  },
  createProjectBtn: {
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
    fontFamily: dash.font,
    boxShadow: "0 4px 16px rgba(79,70,229,0.22)",
    flexShrink: 0,
  },
  localProjectList: {
    display: "flex",
    flexDirection: "column",
    gap: 10,
  },
  localProjectCard: {
    padding: "14px 14px",
    borderRadius: 12,
    border: `1px solid ${dash.border}`,
    background: "#fafafa",
    boxShadow: "0 1px 2px rgba(15,23,42,0.04)",
  },
  localProjectCardTop: {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 10,
    flexWrap: "wrap",
    marginBottom: 8,
  },
  projectCardActions: {
    display: "flex",
    flexWrap: "wrap",
    alignItems: "center",
    gap: 8,
    flexShrink: 0,
  },
  projectCardActionBtn: {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    padding: "6px 12px",
    borderRadius: 8,
    border: `1px solid ${dash.border}`,
    background: "#fff",
    fontSize: 12,
    fontWeight: 700,
    color: dash.text,
    cursor: "pointer",
    fontFamily: dash.font,
  },
  projectCardActionBtnDanger: {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    padding: "6px 12px",
    borderRadius: 8,
    border: `1px solid ${dash.border}`,
    background: "#fff",
    fontSize: 12,
    fontWeight: 700,
    color: dash.danger,
    cursor: "pointer",
    fontFamily: dash.font,
  },
  localProjectName: {
    margin: 0,
    fontSize: 15,
    fontWeight: 800,
    color: dash.text,
    lineHeight: 1.35,
  },
  localProjectTeamPill: {
    fontSize: 11,
    fontWeight: 700,
    color: dash.subtle,
    textTransform: "uppercase",
    letterSpacing: "0.04em",
    padding: "4px 10px",
    borderRadius: 999,
    background: "#fff",
    border: `1px solid ${dash.border}`,
    flexShrink: 0,
  },
  localProjectDesc: {
    margin: "0 0 10px",
    fontSize: 13,
    color: dash.muted,
    lineHeight: 1.5,
  },
  localProjectMetaRow: {
    display: "flex",
    flexWrap: "wrap",
    alignItems: "baseline",
    gap: 8,
    fontSize: 13,
    marginTop: 6,
  },
  localProjectMetaLabel: {
    fontWeight: 700,
    color: dash.muted,
    minWidth: 120,
  },
  localProjectMetaValue: {
    fontWeight: 600,
    color: dash.text,
    flex: "1 1 200px",
  },
  createProjectForm: {
    display: "flex",
    flexDirection: "column",
    gap: 12,
  },
  checkboxLabel: {
    display: "flex",
    alignItems: "flex-start",
    gap: 10,
    fontSize: 13,
    fontWeight: 600,
    color: dash.text,
    cursor: "pointer",
    userSelect: "none",
  },
  checkboxInput: {
    width: 18,
    height: 18,
    marginTop: 2,
    accentColor: dash.accent,
    cursor: "pointer",
    flexShrink: 0,
  },
  sectionPickBox: {
    padding: "12px 12px",
    borderRadius: 12,
    border: `1px dashed ${dash.border}`,
    background: dash.surface,
  },
  sectionPickTitle: {
    margin: "0 0 8px",
    fontSize: 11,
    fontWeight: 700,
    color: dash.subtle,
    textTransform: "uppercase",
    letterSpacing: "0.06em",
  },
  sectionPickEmpty: {
    margin: 0,
    fontSize: 12,
    color: dash.muted,
    lineHeight: 1.45,
  },
  sectionPickList: {
    display: "flex",
    flexDirection: "column",
    gap: 8,
  },
  sectionPickRow: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    fontSize: 13,
    fontWeight: 600,
    color: dash.text,
    cursor: "pointer",
  },
  createProjectActions: {
    display: "flex",
    flexWrap: "wrap",
    justifyContent: "flex-end",
    gap: 10,
    marginTop: 6,
    paddingTop: 14,
    borderTop: `1px solid ${dash.border}`,
  },
  configSection: {
    marginBottom: 16,
  },
  configEyebrow: {
    margin: "0 0 10px",
    fontSize: 11,
    fontWeight: 700,
    color: dash.subtle,
    letterSpacing: "0.08em",
    textTransform: "uppercase",
  },
  configGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
    gap: 10,
  },
  configCard: {
    padding: "12px 12px",
    minWidth: 0,
    background: "linear-gradient(180deg, #fafafa 0%, #fff 100%)",
    borderRadius: dash.radiusLg,
    border: `1px solid ${dash.border}`,
    boxShadow: "0 1px 2px rgba(15,23,42,0.04)",
  },
  configCardHead: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  configCardEyebrow: {
    fontSize: 10,
    fontWeight: 700,
    color: dash.muted,
    textTransform: "uppercase",
    letterSpacing: "0.06em",
  },
  configCardValue: {
    margin: 0,
    fontSize: 14,
    fontWeight: 700,
    color: dash.text,
    lineHeight: 1.4,
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
  projectSectionNotice: {
    padding: "14px 16px",
    borderRadius: 12,
    background: "#f0f9ff",
    border: "1px solid #bae6fd",
  },
  projectSectionNoticeText: {
    margin: 0,
    fontSize: 13,
    fontWeight: 600,
    color: "#0c4a6e",
    lineHeight: 1.5,
  },
  sectionsCreateForm: {
    display: "flex",
    flexWrap: "wrap",
    alignItems: "flex-end",
    gap: 12,
    marginBottom: 16,
  },
  sectionsFieldLabel: {
    display: "block",
    flex: "1 1 200px",
    minWidth: 0,
    fontSize: 10,
    fontWeight: 700,
    color: dash.muted,
    textTransform: "uppercase",
    letterSpacing: "0.06em",
    marginBottom: 0,
  },
  secondaryBtnSections: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    padding: "10px 16px",
    borderRadius: 10,
    border: `1px solid ${dash.border}`,
    background: dash.surface,
    color: dash.text,
    fontSize: 13,
    fontWeight: 700,
    cursor: "pointer",
    fontFamily: "inherit",
    flexShrink: 0,
    boxShadow: dash.shadow,
  },
  sectionNumBadge: {
    fontWeight: 700,
    color: dash.text,
  },
  sectionCardsColumn: {
    display: "flex",
    flexDirection: "column",
    gap: 10,
  },
  sectionProjectHydrating: {
    margin: "0 0 4px",
    fontSize: 12,
    color: dash.muted,
    fontWeight: 600,
  },
  sectionCard: {
    borderRadius: 12,
    border: `1px solid ${dash.border}`,
    background: "#fafafa",
    padding: "10px 12px",
    boxShadow: "0 1px 2px rgba(15,23,42,0.04)",
  },
  sectionCardTop: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
    flexWrap: "wrap",
  },
  sectionCardTitleBlock: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    flexWrap: "wrap",
    minWidth: 0,
  },
  sectionCardMeta: {
    fontSize: 12,
    fontWeight: 600,
    color: dash.muted,
  },
  sectionCardToggle: {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    padding: "6px 10px",
    borderRadius: 8,
    border: `1px solid ${dash.border}`,
    background: "#fff",
    fontSize: 12,
    fontWeight: 700,
    color: dash.text,
    cursor: "pointer",
    fontFamily: "inherit",
  },
  secProjForm: {
    marginTop: 10,
    paddingTop: 10,
    borderTop: `1px dashed ${dash.border}`,
    display: "flex",
    flexDirection: "column",
    gap: 8,
  },
  secProjLabel: {
    display: "block",
    fontSize: 9,
    fontWeight: 700,
    color: dash.muted,
    textTransform: "uppercase",
    letterSpacing: "0.05em",
    marginBottom: 0,
  },
  secProjInput: {
    width: "100%",
    marginTop: 4,
    padding: "7px 9px",
    borderRadius: 8,
    border: `1.5px solid ${dash.border}`,
    fontSize: 13,
    color: dash.text,
    boxSizing: "border-box",
    fontFamily: "inherit",
    background: "#fff",
  },
  secProjTextarea: {
    width: "100%",
    marginTop: 4,
    padding: "7px 9px",
    borderRadius: 8,
    border: `1.5px solid ${dash.border}`,
    fontSize: 13,
    color: dash.text,
    boxSizing: "border-box",
    fontFamily: "inherit",
    background: "#fff",
    resize: "vertical",
    minHeight: 56,
  },
  secProjSubmitBtn: {
    alignSelf: "flex-start",
    marginTop: 2,
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    padding: "7px 14px",
    borderRadius: 8,
    border: "none",
    background: `linear-gradient(135deg,${dash.accent},#7c3aed)`,
    color: "#fff",
    fontSize: 12,
    fontWeight: 700,
    cursor: "pointer",
    fontFamily: "inherit",
    boxShadow: "0 2px 10px rgba(79,70,229,0.22)",
  },
  assignToolbar: {
    display: "flex",
    flexWrap: "wrap",
    alignItems: "center",
    gap: 10,
    marginBottom: 14,
    padding: "12px 14px",
    borderRadius: 12,
    background: "#f8fafc",
    border: `1px solid ${dash.border}`,
  },
  assignToolbarLabel: {
    fontSize: 11,
    fontWeight: 700,
    color: dash.muted,
    textTransform: "uppercase",
    letterSpacing: "0.06em",
    margin: 0,
  },
  assignSelect: {
    minWidth: 200,
    flex: "1 1 200px",
    padding: "9px 11px",
    borderRadius: 10,
    border: `1.5px solid ${dash.border}`,
    fontSize: 14,
    color: dash.text,
    fontFamily: "inherit",
    background: "#fff",
    cursor: "pointer",
  },
  assignBtn: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    padding: "10px 16px",
    borderRadius: 10,
    border: "none",
    background: `linear-gradient(135deg,${dash.accent},#7c3aed)`,
    color: "#fff",
    fontSize: 13,
    fontWeight: 700,
    cursor: "pointer",
    fontFamily: "inherit",
    boxShadow: "0 4px 16px rgba(79,70,229,0.25)",
  },
  rowCheckbox: {
    width: 16,
    height: 16,
    accentColor: dash.accent,
    cursor: "pointer",
    verticalAlign: "middle",
  },
  sectionAssigned: {
    fontWeight: 700,
    color: "#0f766e",
    fontSize: 13,
  },
  sectionUnassigned: {
    fontWeight: 600,
    color: dash.muted,
    fontSize: 13,
  },
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
