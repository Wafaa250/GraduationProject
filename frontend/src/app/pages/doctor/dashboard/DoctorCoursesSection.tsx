import { useCallback, useEffect, useState, type CSSProperties, type FormEvent } from "react";
import { BookOpen, Plus, X } from "lucide-react";
import { parseApiErrorMessage } from "../../../../api/axiosInstance";
import {
  createDoctorCourse,
  getDoctorMyCourses,
  type DoctorCourse,
} from "../../../../api/doctorCoursesApi";
import { useToast } from "../../../../context/ToastContext";
import { SectionSpinner } from "./SectionSpinner";
import { dash, card } from "./doctorDashTokens";
import { DoctorCourseManagePanel } from "./DoctorCourseManagePanel";

function formatCreatedAt(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export function DoctorCoursesSection() {
  const { showToast } = useToast();
  const [courses, setCourses] = useState<DoctorCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [createOpen, setCreateOpen] = useState(false);
  const [createName, setCreateName] = useState("");
  const [createCode, setCreateCode] = useState("");
  const [createSubmitting, setCreateSubmitting] = useState(false);

  const [manageCourseId, setManageCourseId] = useState<number | null>(null);

  const fetchCourses = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const data = await getDoctorMyCourses();
      setCourses(data);
    } catch (err) {
      setLoadError(parseApiErrorMessage(err));
      setCourses([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchCourses();
  }, [fetchCourses]);

  const closeModal = useCallback(() => {
    setCreateOpen(false);
    setCreateName("");
    setCreateCode("");
    setCreateSubmitting(false);
  }, []);

  const handleCreateSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const name = createName.trim();
    const code = createCode.trim();
    if (!name || !code) {
      showToast("Please enter name and code.", "error");
      return;
    }
    setCreateSubmitting(true);
    try {
      await createDoctorCourse({ name, code });
      showToast("Course created.", "success");
      closeModal();
      await fetchCourses();
    } catch (err) {
      showToast(parseApiErrorMessage(err), "error");
      setCreateSubmitting(false);
    }
  };

  const openManage = (id: number) => setManageCourseId(id);

  return (
    <div>
      <h2
        style={{
          margin: "0 0 18px",
          fontSize: 13,
          fontWeight: 700,
          color: dash.subtle,
          letterSpacing: "0.06em",
        }}
      >
        MY COURSES
      </h2>

      <div style={{ ...card, padding: 0, overflow: "hidden" }}>
        <div
          style={{
            padding: "16px 20px",
            borderBottom: `1px solid ${dash.border}`,
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: 16,
            flexWrap: "wrap",
          }}
        >
          <div style={{ display: "flex", alignItems: "flex-start", gap: 10, flex: 1, minWidth: 200 }}>
            <BookOpen size={18} color={dash.accent} style={{ flexShrink: 0, marginTop: 2 }} />
            <div>
              <div
                style={{
                  fontSize: 15,
                  fontWeight: 800,
                  fontFamily: dash.fontDisplay,
                  color: dash.text,
                }}
              >
                Your courses
              </div>
              <p style={{ margin: "4px 0 0", fontSize: 12, color: dash.muted, lineHeight: 1.45 }}>
                Manage enrollments, project settings, and teams from one place.
              </p>
            </div>
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              flexShrink: 0,
            }}
          >
            <span style={{ fontSize: 12, color: dash.muted, whiteSpace: "nowrap" }}>
              {loading ? "…" : `${courses.length} ${courses.length === 1 ? "course" : "courses"}`}
            </span>
            <button
              type="button"
              onClick={() => setCreateOpen(true)}
              style={C.primaryBtn}
            >
              <Plus size={17} />
              Create Course
            </button>
          </div>
        </div>

        {loading && <SectionSpinner label="Loading courses…" />}

        {!loading && loadError && (
          <div style={{ padding: "16px 20px" }}>
            <div style={C.errorBanner}>{loadError}</div>
          </div>
        )}

        {!loading && !loadError && courses.length === 0 && (
          <div style={{ padding: "40px 24px", textAlign: "center" }}>
            <BookOpen size={36} color="#cbd5e1" style={{ marginBottom: 12 }} />
            <p style={{ margin: 0, fontSize: 15, fontWeight: 700, color: dash.muted }}>
              No courses yet
            </p>
            <p style={{ margin: "10px 0 0", fontSize: 13, color: dash.subtle, lineHeight: 1.55, maxWidth: 360, marginLeft: "auto", marginRight: "auto" }}>
              Use <strong style={{ color: dash.text }}>Create Course</strong> in the header
              above to add your first course.
            </p>
          </div>
        )}

        {!loading && !loadError && courses.length > 0 && (
          <div
            style={{
              padding: "16px 20px 24px",
              display: "flex",
              flexDirection: "column",
              gap: 16,
            }}
          >
            {courses.map((c) => (
              <button
                key={c.courseId}
                type="button"
                onClick={() => openManage(c.courseId)}
                style={{
                  ...card,
                  padding: "16px 14px",
                  textAlign: "left",
                  cursor: "pointer",
                  fontFamily: "inherit",
                  display: "flex",
                  flexDirection: "column",
                  gap: 10,
                  transition: "transform 0.12s ease, box-shadow 0.12s ease",
                  boxShadow: dash.shadow,
                }}
                className="dd-course-card-btn"
              >
                <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "flex-start" }}>
                  <span
                    style={{
                      margin: 0,
                      fontSize: 15,
                      fontWeight: 800,
                      color: dash.text,
                      lineHeight: 1.35,
                      flex: 1,
                      minWidth: 0,
                    }}
                  >
                    {c.name}
                  </span>
                  <span
                    style={{
                      flexShrink: 0,
                      fontSize: 11,
                      fontWeight: 700,
                      padding: "4px 8px",
                      borderRadius: 8,
                      background: dash.accentMuted,
                      color: dash.accent,
                      border: "1px solid #c7d2fe",
                    }}
                  >
                    {c.code}
                  </span>
                </div>
                <p style={{ margin: 0, fontSize: 12, color: dash.subtle }}>
                  Created {formatCreatedAt(c.createdAt)}
                </p>
                <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 2 }}>
                  <span
                    style={{
                      fontSize: 12,
                      fontWeight: 700,
                      color: dash.accent,
                    }}
                  >
                    Open workspace →
                  </span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {createOpen && (
        <div style={C.overlay} onClick={closeModal}>
          <div
            style={C.modal}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="dd-create-course-title"
          >
            <div style={C.modalHead}>
              <h2 id="dd-create-course-title" style={C.modalTitle}>
                Create Course
              </h2>
              <button
                type="button"
                style={C.iconBtn}
                onClick={closeModal}
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleCreateSubmit}>
              <label style={C.label}>
                Name
                <input
                  style={C.input}
                  value={createName}
                  onChange={(e) => setCreateName(e.target.value)}
                  placeholder="e.g. Software Engineering"
                  autoComplete="off"
                  disabled={createSubmitting}
                />
              </label>
              <label style={C.label}>
                Code
                <input
                  style={C.input}
                  value={createCode}
                  onChange={(e) => setCreateCode(e.target.value)}
                  placeholder="e.g. CS401"
                  autoComplete="off"
                  disabled={createSubmitting}
                />
              </label>
              <div style={C.modalActions}>
                <button
                  type="button"
                  onClick={closeModal}
                  style={C.secondaryBtn}
                  disabled={createSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={C.primaryBtn}
                  disabled={createSubmitting}
                >
                  {createSubmitting ? "Creating…" : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <DoctorCourseManagePanel
        open={manageCourseId != null}
        courseId={manageCourseId}
        onClose={() => {
          setManageCourseId(null);
          void fetchCourses();
        }}
      />

      <style>{`
        .dd-course-card-btn:hover {
          transform: translateY(-2px);
          box-shadow: ${dash.shadowLg};
        }
      `}</style>
    </div>
  );
}

const C: Record<string, CSSProperties> = {
  primaryBtn: {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    padding: "11px 18px",
    borderRadius: 10,
    border: "none",
    background: `linear-gradient(135deg,${dash.accent},#7c3aed)`,
    color: "#fff",
    fontSize: 13,
    fontWeight: 700,
    cursor: "pointer",
    fontFamily: dash.font,
    boxShadow: "0 4px 16px rgba(79,70,229,0.3)",
  },
  secondaryBtn: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    padding: "8px 14px",
    borderRadius: 9,
    border: `1px solid ${dash.border}`,
    background: dash.surface,
    color: dash.muted,
    fontSize: 12,
    fontWeight: 700,
    cursor: "pointer",
    fontFamily: dash.font,
  },
  errorBanner: {
    padding: "14px 16px",
    borderRadius: 12,
    background: "#fef2f2",
    border: "1px solid #fecaca",
    color: dash.danger,
    fontSize: 14,
    fontWeight: 600,
  },
  overlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(15,23,42,0.45)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 2100,
    padding: 16,
    backdropFilter: "blur(4px)",
  },
  modal: {
    width: "100%",
    maxWidth: 420,
    background: dash.surface,
    borderRadius: 16,
    padding: "24px",
    boxShadow: dash.shadowLg,
    border: `1px solid ${dash.border}`,
  },
  modalHead: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  modalTitle: {
    margin: 0,
    fontSize: 18,
    fontWeight: 800,
    fontFamily: dash.fontDisplay,
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    border: `1px solid ${dash.border}`,
    background: dash.surface,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: dash.muted,
  },
  label: {
    display: "block",
    fontSize: 11,
    fontWeight: 700,
    color: dash.muted,
    textTransform: "uppercase",
    letterSpacing: "0.06em",
    marginBottom: 16,
  },
  input: {
    width: "100%",
    marginTop: 6,
    padding: "11px 12px",
    borderRadius: 10,
    border: `1.5px solid ${dash.border}`,
    fontSize: 14,
    color: dash.text,
    boxSizing: "border-box",
    fontFamily: dash.font,
    background: "#f8fafc",
  },
  modalActions: {
    display: "flex",
    justifyContent: "flex-end",
    gap: 10,
    marginTop: 22,
  },
};
