import { useCallback, useEffect, useMemo, useState, type CSSProperties } from "react";
import { BookOpen, Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { parseApiErrorMessage } from "../../../../api/axiosInstance";
import { getDoctorMyCourses, type DoctorCourse } from "../../../../api/doctorCoursesApi";
import type { DoctorUiTestCourse } from "../doctorDashboardTypes";
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

type CourseListRow =
  | { kind: "ui"; course: DoctorUiTestCourse }
  | { kind: "api"; course: DoctorCourse };

type Props = {
  /** Merged into the list for UI testing (session + navigation); not from the API. */
  uiCourses?: DoctorUiTestCourse[];
};

export function DoctorCoursesSection({ uiCourses = [] }: Props) {
  const navigate = useNavigate();
  const [courses, setCourses] = useState<DoctorCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [manageCourseId, setManageCourseId] = useState<number | null>(null);

  const mergedRows = useMemo<CourseListRow[]>(
    () => [
      ...uiCourses.map((course) => ({ kind: "ui" as const, course })),
      ...courses.map((course) => ({ kind: "api" as const, course })),
    ],
    [uiCourses, courses],
  );

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

  const openManage = (id: number) => setManageCourseId(id);

  const openRow = (row: CourseListRow) => {
    if (row.kind === "ui") {
      navigate(`/courses/${row.course.id}`, {
        state: { courseName: row.course.name, courseCode: row.course.code },
      });
      return;
    }
    openManage(row.course.courseId);
  };

  const rowKey = (row: CourseListRow) =>
    row.kind === "ui" ? `ui-${row.course.id}` : `api-${row.course.courseId}`;

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
              {loading && mergedRows.length === 0
                ? "…"
                : `${mergedRows.length} ${mergedRows.length === 1 ? "course" : "courses"}`}
            </span>
            <button
              type="button"
              onClick={() => navigate("/courses/create")}
              style={C.primaryBtn}
            >
              <Plus size={17} />
              Create Course
            </button>
          </div>
        </div>

        {loading && mergedRows.length === 0 ? <SectionSpinner label="Loading courses…" /> : null}

        {!loading && loadError && mergedRows.length === 0 && (
          <div style={{ padding: "16px 20px" }}>
            <div style={C.errorBanner}>{loadError}</div>
          </div>
        )}

        {!loading && !loadError && mergedRows.length === 0 && (
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

        {mergedRows.length > 0 && (
          <div
            style={{
              padding: "16px 20px 24px",
              display: "flex",
              flexDirection: "column",
              gap: 16,
            }}
          >
            {mergedRows.map((row) => {
              const c = row.course;
              return (
                <button
                  key={rowKey(row)}
                  type="button"
                  onClick={() => openRow(row)}
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
              );
            })}
          </div>
        )}
      </div>

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
  errorBanner: {
    padding: "14px 16px",
    borderRadius: 12,
    background: "#fef2f2",
    border: "1px solid #fecaca",
    color: dash.danger,
    fontSize: 14,
    fontWeight: 600,
  },
};
