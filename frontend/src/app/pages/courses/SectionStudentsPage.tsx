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
import {
    getDoctorSectionStudents,
    addStudentsToDoctorSection,
    type DoctorCourseStudent,
} from "../../../api/doctorCoursesApi";
import { parseApiErrorMessage } from "../../../api/axiosInstance";
import { useToast } from "../../../context/ToastContext";

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
    const { showToast } = useToast();

    const backendSectionId = sectionId && /^\d+$/.test(sectionId) ? Number(sectionId) : null;

    // ── State ──────────────────────────────────────────────────────────────────
    const [students, setStudents] = useState<DoctorCourseStudent[]>([]);
    const [loadingStudents, setLoadingStudents] = useState(true);

    const [showAddStudents, setShowAddStudents] = useState(false);
    const [addStudentsTab, setAddStudentsTab] = useState<AddStudentsTab>("manual");

    // Manual entry — one or more IDs/emails separated by newlines or commas
    const [inputValue, setInputValue] = useState("");
    const [inputError, setInputError] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);

    // File upload
    const [uploadFile, setUploadFile] = useState<File | null>(null);
    const [uploadFileLabel, setUploadFileLabel] = useState<string | null>(null);
    const [uploadError, setUploadError] = useState<string | null>(null);
    const [uploading, setUploading] = useState(false);
    const uploadInputRef = useRef<HTMLInputElement>(null);

    const courseLabel = courseId?.trim() || "—";

    // ── Load students from backend ─────────────────────────────────────────────
    useEffect(() => {
        if (backendSectionId == null) {
            setLoadingStudents(false);
            return;
        }
        let cancelled = false;
        setLoadingStudents(true);
        getDoctorSectionStudents(backendSectionId)
            .then((data) => {
                if (!cancelled) setStudents(data);
            })
            .catch((err) => {
                if (!cancelled) showToast(parseApiErrorMessage(err), "error");
            })
            .finally(() => {
                if (!cancelled) setLoadingStudents(false);
            });
        return () => { cancelled = true; };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [backendSectionId]);

    // ── Parse raw text into student ID list ────────────────────────────────────
    function parseIds(raw: string): string[] {
        return raw
            .split(/[\n,]+/)
            .map((s) => s.trim())
            .filter((s) => s.length > 0);
    }

    // ── Manual add ─────────────────────────────────────────────────────────────
    const handleAddManual = async (e: FormEvent) => {
        e.preventDefault();
        setInputError(null);
        const ids = parseIds(inputValue);
        if (ids.length === 0) {
            setInputError("Enter at least one student ID or email.");
            return;
        }
        if (backendSectionId == null) {
            setInputError("Cannot save — section ID is not a valid number.");
            return;
        }
        setSubmitting(true);
        try {
            await addStudentsToDoctorSection(backendSectionId, ids);
            // Reload the list from the backend so we see the real student names
            const updated = await getDoctorSectionStudents(backendSectionId);
            setStudents(updated);
            setInputValue("");
            setShowAddStudents(false);
            showToast(`${ids.length} student(s) added successfully.`, "success");
        } catch (err) {
            setInputError(parseApiErrorMessage(err));
        } finally {
            setSubmitting(false);
        }
    };

    // ── File upload add ────────────────────────────────────────────────────────
    const handleUploadFilePick = () => uploadInputRef.current?.click();

    const handleUploadInputChange = (e: ChangeEvent<HTMLInputElement>) => {
        const f = e.target.files?.[0] ?? null;
        setUploadError(null);
        setUploadFile(f);
        setUploadFileLabel(f ? f.name : null);
    };

    const handleUploadAndAddStudents = async () => {
        setUploadError(null);
        if (!uploadFile) { setUploadError("Choose a file first."); return; }
        if (backendSectionId == null) { setUploadError("Cannot save — section ID is not valid."); return; }
        let ids: string[] = [];
        try {
            const text = await uploadFile.text();
            ids = parseIds(text);
            if (ids.length === 0) { setUploadError("No entries found in this file."); return; }
        } catch {
            setUploadError("Could not read this file.");
            return;
        }
        setUploading(true);
        try {
            await addStudentsToDoctorSection(backendSectionId, ids);
            const updated = await getDoctorSectionStudents(backendSectionId);
            setStudents(updated);
            setUploadFile(null);
            setUploadFileLabel(null);
            if (uploadInputRef.current) uploadInputRef.current.value = "";
            setShowAddStudents(false);
            showToast(`${ids.length} student(s) added successfully.`, "success");
        } catch (err) {
            setUploadError(parseApiErrorMessage(err));
        } finally {
            setUploading(false);
        }
    };

    // ── Render ─────────────────────────────────────────────────────────────────
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
                    <p style={{ margin: "0 0 6px", fontSize: 11, fontWeight: 700, color: dash.subtle, letterSpacing: "0.08em", textTransform: "uppercase" }}>
                        Section students
                    </p>
                    <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, fontFamily: dash.fontDisplay, lineHeight: 1.25 }}>
                        Section{" "}
                        <span style={{ color: dash.accent }}>{sectionId}</span>
                    </h1>
                    <p style={{ margin: "10px 0 0", fontSize: 12, color: dash.muted, lineHeight: 1.45 }}>
                        Course <span style={{ fontWeight: 700, color: dash.text }}>{courseLabel}</span>
                    </p>
                </header>

                <div style={{ marginTop: 20, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
                    <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: dash.muted }}>
                        {loadingStudents
                            ? "Loading…"
                            : students.length === 0
                                ? "No students in this section"
                                : `${students.length} ${students.length === 1 ? "student" : "students"}`}
                    </p>
                    <button
                        type="button"
                        style={S.primaryBtn}
                        onClick={() => { setAddStudentsTab("manual"); setShowAddStudents(true); }}
                    >
                        <UserPlus size={17} />
                        Add Students
                    </button>
                </div>

                {showAddStudents ? (
                    <div style={{ ...card, marginTop: 16, padding: 0, overflow: "hidden" }}>
                        <div
                            style={{ display: "flex", gap: 4, flexWrap: "wrap", borderBottom: `1px solid ${dash.border}`, padding: "0 12px" }}
                            role="tablist"
                        >
                            <button type="button" role="tab" aria-selected={addStudentsTab === "manual"} onClick={() => setAddStudentsTab("manual")} style={addStudentsTabStyle(addStudentsTab === "manual")}>
                                Manual Entry
                            </button>
                            <button type="button" role="tab" aria-selected={addStudentsTab === "upload"} onClick={() => setAddStudentsTab("upload")} style={addStudentsTabStyle(addStudentsTab === "upload")}>
                                Upload File
                            </button>
                        </div>

                        {addStudentsTab === "manual" ? (
                            <form onSubmit={(e) => void handleAddManual(e)} style={{ padding: 18, display: "flex", flexDirection: "column", gap: 12 }}>
                                <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: dash.subtle, letterSpacing: "0.06em" }}>
                                    ADD BY UNIVERSITY STUDENT ID
                                </p>
                                <p style={{ margin: 0, fontSize: 12, color: dash.muted }}>
                                    Enter one or more student IDs separated by commas or new lines.
                                </p>
                                <textarea
                                    style={{ ...S.input, minHeight: 90, resize: "vertical" }}
                                    value={inputValue}
                                    onChange={(e) => { setInputValue(e.target.value); setInputError(null); }}
                                    placeholder={"2021001\n2021002, 2021003"}
                                    autoComplete="off"
                                />
                                {inputError ? (
                                    <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: dash.danger }}>{inputError}</p>
                                ) : null}
                                <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
                                    <button type="button" style={S.secondaryBtn} onClick={() => setShowAddStudents(false)}>
                                        Cancel
                                    </button>
                                    <button type="submit" style={S.primaryBtn} disabled={submitting}>
                                        <Plus size={17} />
                                        {submitting ? "Adding…" : "Add"}
                                    </button>
                                </div>
                            </form>
                        ) : (
                            <div style={{ padding: 18, display: "flex", flexDirection: "column", gap: 14 }}>
                                <input ref={uploadInputRef} type="file" accept=".txt,.csv,text/plain,text/csv" style={{ display: "none" }} onChange={handleUploadInputChange} />
                                <p style={{ margin: 0, fontSize: 13, color: dash.muted, lineHeight: 1.5 }}>
                                    Each line (or comma-separated value) should contain one university student ID.
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
                                {uploadError ? (
                                    <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: dash.danger }}>{uploadError}</p>
                                ) : null}
                                <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
                                    <button type="button" style={S.secondaryBtn} onClick={() => setShowAddStudents(false)}>
                                        Cancel
                                    </button>
                                    <button type="button" style={S.primaryBtn} onClick={() => void handleUploadAndAddStudents()} disabled={uploading}>
                                        <Upload size={17} />
                                        {uploading ? "Uploading…" : "Upload & Add"}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                ) : null}

                <div style={{ marginTop: 20 }}>
                    {!loadingStudents && students.length === 0 && !showAddStudents ? (
                        <div style={{ ...card, padding: "48px 24px", textAlign: "center" }}>
                            <Users size={40} color="#cbd5e1" style={{ marginBottom: 14 }} />
                            <p style={{ margin: 0, fontSize: 15, fontWeight: 700, color: dash.muted }}>No students yet</p>
                            <p style={{ margin: "10px auto 0", fontSize: 13, color: dash.subtle, lineHeight: 1.55, maxWidth: 400 }}>
                                Use <strong style={{ color: dash.text }}>Add Students</strong> to enroll students by their university ID.
                            </p>
                        </div>
                    ) : null}

                    {students.length > 0 ? (
                        <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 12 }}>
                            {students.map((s) => (
                                <li
                                    key={s.studentId}
                                    style={{ ...card, padding: "16px 18px", boxShadow: dash.shadow, display: "flex", alignItems: "center", gap: 14 }}
                                >
                                    <div style={{ width: 44, height: 44, borderRadius: 12, background: dash.accentMuted, display: "flex", alignItems: "center", justifyContent: "center", color: dash.accent, flexShrink: 0 }}>
                                        <GraduationCap size={22} />
                                    </div>
                                    <div style={{ minWidth: 0, flex: 1 }}>
                                        <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: dash.text }}>{s.name}</p>
                                        <p style={{ margin: "3px 0 0", fontSize: 12, color: dash.subtle }}>
                                            {s.universityId && <span style={{ marginRight: 10 }}>ID: {s.universityId}</span>}
                                            {s.university && <span style={{ marginRight: 10 }}>{s.university}</span>}
                                            {s.major && <span>{s.major}</span>}
                                        </p>
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
        display: "inline-flex", alignItems: "center", gap: 8, padding: "8px 14px",
        borderRadius: 10, border: `1px solid ${dash.border}`, background: dash.surface,
        color: dash.muted, fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: dash.font,
    },
    primaryBtn: {
        display: "inline-flex", alignItems: "center", gap: 8, padding: "11px 18px",
        borderRadius: 10, border: "none", background: `linear-gradient(135deg,${dash.accent},#7c3aed)`,
        color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: dash.font,
        boxShadow: "0 4px 16px rgba(79,70,229,0.3)",
    },
    secondaryBtn: {
        display: "inline-flex", alignItems: "center", gap: 8, padding: "10px 14px",
        borderRadius: 10, border: `1px solid ${dash.border}`, background: dash.surface,
        color: dash.muted, fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: dash.font,
    },
    input: {
        width: "100%", padding: "11px 12px", borderRadius: 10,
        border: `1.5px solid ${dash.border}`, fontSize: 14, color: dash.text,
        boxSizing: "border-box" as const, fontFamily: dash.font, background: "#f8fafc",
    },
};