import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type CSSProperties,
  type FormEvent,
} from "react";
import { ArrowLeft, GraduationCap, Plus, Upload, UserPlus, Users } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { dash, card } from "../doctor/dashboard/doctorDashTokens";

type LocalStudentRow = {
  id: string;
  value: string;
};

function readSectionStudentsFromStorage(key: string | null): LocalStudentRow[] {
  if (!key) return [];
  try {
    const raw = sessionStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (row): row is LocalStudentRow =>
        row != null &&
        typeof row === "object" &&
        typeof (row as LocalStudentRow).id === "string" &&
        typeof (row as LocalStudentRow).value === "string",
    );
  } catch {
    return [];
  }
}

type AddStudentsTab = "manual" | "upload";

function addStudentsTabStyle(active: boolean): CSSProperties {
  return {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    padding: "12px 16px",
    marginBottom: -1,
    border: "none",
    borderBottom: active ? `2px solid ${dash.accent}` : "2px solid transparent",
    background: "transparent",
    color: active ? dash.accent : dash.muted,
    fontSize: 14,
    fontWeight: active ? 700 : 600,
    cursor: "pointer",
    fontFamily: dash.font,
    borderRadius: "10px 10px 0 0",
  };
}

export default function SectionStudentsPage() {
  const navigate = useNavigate();
  const { courseId, sectionId } = useParams<{ courseId: string; sectionId: string }>();

  const storageKey =
    courseId && sectionId ? `course-ui-students-${courseId}-${sectionId}` : null;

  const [students, setStudents] = useState<LocalStudentRow[]>(() =>
    readSectionStudentsFromStorage(
      courseId && sectionId ? `course-ui-students-${courseId}-${sectionId}` : null,
    ),
  );
  const [showAddStudents, setShowAddStudents] = useState(false);
  const [addStudentsTab, setAddStudentsTab] = useState<AddStudentsTab>("manual");
  const [inputValue, setInputValue] = useState("");
  const [inputError, setInputError] = useState<string | null>(null);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadFileLabel, setUploadFileLabel] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const uploadInputRef = useRef<HTMLInputElement>(null);

  const courseLabel = courseId?.trim() || "—";
  const sectionLabel = sectionId?.trim() || "—";

  useEffect(() => {
    setStudents(readSectionStudentsFromStorage(storageKey));
  }, [storageKey]);

  useEffect(() => {
    if (!storageKey) return;
    try {
      sessionStorage.setItem(storageKey, JSON.stringify(students));
    } catch {
      /* ignore quota / privacy mode */
    }
  }, [storageKey, students]);

  const handleAddRow = (e: FormEvent) => {
    e.preventDefault();
    setInputError(null);
    const v = inputValue.trim();
    if (!v) {
      setInputError("Enter an email or student ID.");
      return;
    }
    setStudents((prev) => [...prev, { id: `temp-${Date.now()}`, value: v }]);
    setInputValue("");
  };

  const handleUploadFilePick = () => {
    uploadInputRef.current?.click();
  };

  const handleUploadInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] ?? null;
    setUploadError(null);
    setUploadFile(f);
    setUploadFileLabel(f ? f.name : null);
  };

  const handleUploadAndAddStudents = async () => {
    setUploadError(null);
    if (!uploadFile) {
      setUploadError("Choose a file first.");
      return;
    }
    try {
      const text = await uploadFile.text();
      const lines = text
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter((line) => line.length > 0);
      if (lines.length === 0) {
        setUploadError("No non-empty lines found in this file.");
        return;
      }
      const base = Date.now();
      const rows: LocalStudentRow[] = lines.map((value) => ({
        id: `temp-${base}-${Math.random()}`,
        value,
      }));
      setStudents((prev) => [...prev, ...rows]);
      setUploadFile(null);
      setUploadFileLabel(null);
      if (uploadInputRef.current) uploadInputRef.current.value = "";
    } catch {
      setUploadError("Could not read this file.");
    }
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
      <div style={{ maxWidth: 720, margin: "0 auto" }}>
        <button
          type="button"
          onClick={() => navigate(courseId ? `/courses/${courseId}` : "/doctor-dashboard")}
          style={S.backBtn}
        >
          <ArrowLeft size={18} />
          Back to course
        </button>

        <header style={{ ...card, padding: "22px 24px", marginTop: 20 }}>
          <p
            style={{
              margin: "0 0 6px",
              fontSize: 11,
              fontWeight: 700,
              color: dash.subtle,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
            }}
          >
            Section students
          </p>
          <h1
            style={{
              margin: 0,
              fontSize: 22,
              fontWeight: 800,
              fontFamily: dash.fontDisplay,
              lineHeight: 1.25,
            }}
          >
            Section{" "}
            <span style={{ color: dash.accent, wordBreak: "break-all" }}>{sectionLabel}</span>
          </h1>
          <p style={{ margin: "10px 0 0", fontSize: 12, color: dash.muted, lineHeight: 1.45 }}>
            Course <span style={{ fontWeight: 700, color: dash.text }}>{courseLabel}</span>
            {" · "}
            Roster is local only until persistence is added.
          </p>
        </header>

        <div
          style={{
            marginTop: 20,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 16,
            flexWrap: "wrap",
          }}
        >
          <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: dash.muted }}>
            {students.length === 0
              ? "No students in this list"
              : `${students.length} ${students.length === 1 ? "student" : "students"}`}
          </p>
          <button
            type="button"
            style={S.primaryBtn}
            onClick={() => {
              setAddStudentsTab("manual");
              setShowAddStudents(true);
            }}
          >
            <UserPlus size={17} />
            Add Students
          </button>
        </div>

        {showAddStudents ? (
          <div
            style={{
              ...card,
              marginTop: 16,
              padding: 0,
              overflow: "hidden",
            }}
          >
            <div
              style={{
                display: "flex",
                gap: 4,
                flexWrap: "wrap",
                borderBottom: `1px solid ${dash.border}`,
                padding: "0 12px",
              }}
              role="tablist"
              aria-label="Add students"
            >
              <button
                type="button"
                role="tab"
                aria-selected={addStudentsTab === "manual"}
                onClick={() => setAddStudentsTab("manual")}
                style={addStudentsTabStyle(addStudentsTab === "manual")}
              >
                Manual Entry
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={addStudentsTab === "upload"}
                onClick={() => setAddStudentsTab("upload")}
                style={addStudentsTabStyle(addStudentsTab === "upload")}
              >
                Upload File
              </button>
            </div>

            {addStudentsTab === "manual" ? (
              <form
                onSubmit={handleAddRow}
                style={{
                  padding: 18,
                  display: "flex",
                  flexDirection: "column",
                  gap: 12,
                }}
              >
                <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: dash.subtle, letterSpacing: "0.06em" }}>
                  ADD BY EMAIL OR ID
                </p>
                <div
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: 10,
                    alignItems: "stretch",
                  }}
                >
                  <input
                    style={{ ...S.input, flex: "1 1 220px", minWidth: 0 }}
                    value={inputValue}
                    onChange={(e) => {
                      setInputValue(e.target.value);
                      setInputError(null);
                    }}
                    placeholder="student@university.edu or 2021001"
                    autoComplete="off"
                    aria-invalid={Boolean(inputError)}
                    aria-describedby={inputError ? "section-student-input-err" : undefined}
                  />
                  <button type="submit" style={{ ...S.primaryBtn, flex: "0 0 auto" }}>
                    <Plus size={17} />
                    Add
                  </button>
                </div>
                {inputError ? (
                  <p id="section-student-input-err" style={{ margin: 0, fontSize: 13, fontWeight: 600, color: dash.danger }}>
                    {inputError}
                  </p>
                ) : null}
              </form>
            ) : (
              <div style={{ padding: 18, display: "flex", flexDirection: "column", gap: 14 }}>
                <input
                  ref={uploadInputRef}
                  type="file"
                  accept=".txt,.csv,text/plain,text/csv"
                  style={{ display: "none" }}
                  onChange={handleUploadInputChange}
                />
                <p style={{ margin: 0, fontSize: 13, color: dash.muted, lineHeight: 1.5 }}>
                  Each line should contain one email or student ID
                </p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 10, alignItems: "center" }}>
                  <button type="button" style={S.secondaryBtn} onClick={handleUploadFilePick}>
                    <Upload size={16} />
                    Choose File
                  </button>
                  <span style={{ fontSize: 13, color: uploadFileLabel ? dash.text : dash.subtle }}>
                    {uploadFileLabel ?? "No file selected"}
                  </span>
                </div>
                <button type="button" style={S.primaryBtn} onClick={() => void handleUploadAndAddStudents()}>
                  <Upload size={17} />
                  Upload & Add Students
                </button>
                {uploadError ? (
                  <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: dash.danger }}>{uploadError}</p>
                ) : null}
              </div>
            )}
          </div>
        ) : null}

        <div style={{ marginTop: 20 }}>
          {students.length === 0 && !showAddStudents ? (
            <div style={{ ...card, padding: "48px 24px", textAlign: "center" }}>
              <Users size={40} color="#cbd5e1" style={{ marginBottom: 14 }} />
              <p style={{ margin: 0, fontSize: 15, fontWeight: 700, color: dash.muted }}>No students yet</p>
              <p
                style={{
                  margin: "10px auto 0",
                  fontSize: 13,
                  color: dash.subtle,
                  lineHeight: 1.55,
                  maxWidth: 400,
                }}
              >
                Use <strong style={{ color: dash.text }}>Add Students</strong> to add entries manually or from a
                .txt / .csv file. Nothing is saved to the server yet.
              </p>
            </div>
          ) : null}
          {students.length === 0 && showAddStudents ? (
            <p
              style={{
                margin: "16px 0 0",
                fontSize: 13,
                color: dash.subtle,
                textAlign: "center",
                lineHeight: 1.5,
              }}
            >
              Use the panel above — manual entry or file upload — to add the first student for this section.
            </p>
          ) : null}
          {students.length > 0 ? (
            <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 12 }}>
              {students.map((s) => (
                <li
                  key={s.id}
                  style={{
                    ...card,
                    padding: "16px 18px",
                    boxShadow: dash.shadow,
                    display: "flex",
                    alignItems: "center",
                    gap: 14,
                  }}
                >
                  <div
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 12,
                      background: dash.accentMuted,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: dash.accent,
                      flexShrink: 0,
                    }}
                  >
                    <GraduationCap size={22} />
                  </div>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: dash.text, wordBreak: "break-word" }}>
                      {s.value}
                    </p>
                    <p style={{ margin: "4px 0 0", fontSize: 12, color: dash.subtle }}>Email or university ID</p>
                  </div>
                </li>
              ))}
            </ul>
          ) : null}
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
  input: {
    padding: "11px 12px",
    borderRadius: 10,
    border: `1.5px solid ${dash.border}`,
    fontSize: 14,
    color: dash.text,
    boxSizing: "border-box",
    fontFamily: dash.font,
    background: "#f8fafc",
  },
  secondaryBtn: {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    padding: "10px 14px",
    borderRadius: 10,
    border: `1px solid ${dash.border}`,
    background: dash.surface,
    color: dash.muted,
    fontSize: 13,
    fontWeight: 700,
    cursor: "pointer",
    fontFamily: dash.font,
  },
};
