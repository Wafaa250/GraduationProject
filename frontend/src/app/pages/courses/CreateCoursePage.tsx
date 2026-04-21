import { useState, type CSSProperties, type FormEvent } from "react";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "../../../context/ToastContext";
import { dash, card } from "../doctor/dashboard/doctorDashTokens";

export default function CreateCoursePage() {
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [semester, setSemester] = useState("");
  const [useSharedProjectAcrossSections, setUseSharedProjectAcrossSections] = useState(false);
  const [allowCrossSectionTeams, setAllowCrossSectionTeams] = useState(false);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const nameTrim = name.trim();
    const codeTrim = code.trim();
    if (!nameTrim || !codeTrim) {
      showToast("Please enter name and code.", "error");
      return;
    }
    const semesterTrim = semester.trim();
    const shared = useSharedProjectAcrossSections;
    const allowCross = shared ? allowCrossSectionTeams : false;
    const newCourse = {
      id: `temp-${Date.now()}`,
      name: nameTrim,
      code: codeTrim,
      createdAt: new Date().toISOString(),
      semester: semesterTrim.length > 0 ? semesterTrim : null,
      useSharedProjectAcrossSections: shared,
      allowCrossSectionTeams: allowCross,
    };
    navigate("/doctor-dashboard", { state: { newCourse } });
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: dash.bg,
        fontFamily: dash.font,
        color: dash.text,
        padding: "24px 28px 40px",
      }}
    >
      <div style={{ maxWidth: 1120, margin: "0 auto" }}>
        <button
          type="button"
          onClick={() => navigate("/doctor-dashboard")}
          style={S.backBtn}
        >
          <ArrowLeft size={18} />
          Back to dashboard
        </button>

        <h2
          style={{
            margin: "20px 0 18px",
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
              padding: "20px 24px",
              borderBottom: `1px solid ${dash.border}`,
            }}
          >
            <h1
              style={{
                margin: 0,
                fontSize: 18,
                fontWeight: 800,
                fontFamily: dash.fontDisplay,
                color: dash.text,
              }}
            >
              Create Course
            </h1>
          </div>

          <form onSubmit={handleSubmit} style={{ padding: "24px" }}>
            <label style={S.label}>
              Name
              <input
                style={S.input}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Software Engineering"
                autoComplete="off"
              />
            </label>
            <label style={S.label}>
              Code
              <input
                style={S.input}
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="e.g. CS401"
                autoComplete="off"
              />
            </label>
            <label style={S.label}>
              Semester
              <input
                style={S.input}
                value={semester}
                onChange={(e) => setSemester(e.target.value)}
                placeholder="e.g. Fall 2026 (optional)"
                autoComplete="off"
              />
            </label>
            <div style={S.checkRow}>
              <input
                id="create-course-shared"
                type="checkbox"
                style={S.checkbox}
                checked={useSharedProjectAcrossSections}
                onChange={(e) => {
                  const on = e.target.checked;
                  setUseSharedProjectAcrossSections(on);
                  if (!on) setAllowCrossSectionTeams(false);
                }}
              />
              <label htmlFor="create-course-shared" style={S.checkLabel}>
                Shared project across sections
              </label>
            </div>
            {useSharedProjectAcrossSections && (
              <div style={S.checkRow}>
                <input
                  id="create-course-cross"
                  type="checkbox"
                  style={S.checkbox}
                  checked={allowCrossSectionTeams}
                  onChange={(e) => setAllowCrossSectionTeams(e.target.checked)}
                />
                <label htmlFor="create-course-cross" style={S.checkLabel}>
                  Allow cross-section teams
                </label>
              </div>
            )}
            <div style={S.actions}>
              <button
                type="button"
                onClick={() => navigate("/doctor-dashboard")}
                style={S.secondaryBtn}
              >
                Cancel
              </button>
              <button type="submit" style={S.primaryBtn}>
                Create
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

const S: Record<string, CSSProperties> = {
  backBtn: {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    padding: "8px 14px",
    borderRadius: 10,
    border: `1px solid ${dash.border}`,
    background: dash.surface,
    color: dash.muted,
    fontSize: 13,
    fontWeight: 700,
    cursor: "pointer",
    fontFamily: dash.font,
  },
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
  checkRow: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    marginBottom: 16,
  },
  checkbox: {
    width: 18,
    height: 18,
    flexShrink: 0,
    accentColor: dash.accent,
    cursor: "pointer",
  },
  checkLabel: {
    fontSize: 14,
    fontWeight: 600,
    color: dash.text,
    cursor: "pointer",
    lineHeight: 1.35,
    userSelect: "none" as const,
  },
  actions: {
    display: "flex",
    justifyContent: "flex-end",
    gap: 10,
    marginTop: 22,
    paddingTop: 4,
  },
};
