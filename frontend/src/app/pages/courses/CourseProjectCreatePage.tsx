import { useEffect, useRef, useState, type CSSProperties, type FormEvent } from "react";
import { ArrowLeft, Bot, Sparkles, Upload, Users } from "lucide-react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { useToast } from "../../../context/ToastContext";
import { dash, card } from "../doctor/dashboard/doctorDashTokens";
import type {
    CourseProjectCreateLocationState,
    CourseWorkspaceSectionOption,
    NewWorkspaceProjectPayload,
} from "./courseProjectTypes";
import {
    createDoctorCourseProject,
    getDoctorCourseSections,
} from "../../../api/doctorCoursesApi";
import { parseApiErrorMessage } from "../../../api/axiosInstance";

export default function CourseProjectCreatePage() {
    const navigate = useNavigate();
    const { courseId } = useParams<{ courseId: string }>();
    const location = useLocation();
    const { showToast } = useToast();

    const [sectionOptions, setSectionOptions] = useState<CourseWorkspaceSectionOption[]>(
        (location.state as CourseProjectCreateLocationState | null)?.sections ?? []
    );

    const [title, setTitle] = useState("");
    const [abstract, setAbstract] = useState("");
    const [teamSize, setTeamSize] = useState(2);
    const [duration, setDuration] = useState("");
    const [allSections, setAllSections] = useState(true);
    const [sectionId, setSectionId] = useState("");
    const [aiMode, setAiMode] = useState<"doctor" | "student">("doctor");
    const [fileLabel, setFileLabel] = useState<string | null>(null);
    const fileRef = useRef<HTMLInputElement>(null);
    const [submitting, setSubmitting] = useState(false);

    // Load real sections from backend for numeric courseIds
    const backendCourseId = courseId && /^\d+$/.test(courseId) ? Number(courseId) : null;
    useEffect(() => {
        if (backendCourseId == null) return;
        let cancelled = false;
        getDoctorCourseSections(backendCourseId).then((secs) => {
            if (cancelled) return;
            // Merge with any sections passed via location state
            const apiOpts: CourseWorkspaceSectionOption[] = secs.map((s) => ({
                id: String(s.id),
                name: s.name,
            }));
            // Only replace if we got something (don't wipe manually-passed options)
            if (apiOpts.length > 0) setSectionOptions(apiOpts);
        }).catch(() => {/* ignore */ });
        return () => { cancelled = true; };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [backendCourseId]);

    const backToWorkspace = () => {
        if (!courseId) {
            navigate("/doctor-dashboard");
            return;
        }
        navigate(`/courses/${courseId}`);
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (submitting) return;
        const t = title.trim();
        if (!t) { showToast("Title is required.", "error"); return; }
        if (!allSections) {
            if (sectionOptions.length === 0) {
                showToast("Add sections in the workspace first, or choose All sections.", "error");
                return;
            }
            if (!sectionId) {
                showToast("Select a section, or enable All sections.", "error");
                return;
            }
        }
        const ts = Number(teamSize);
        if (!Number.isFinite(ts) || ts < 2 || ts > 50) {
            showToast("Team size must be between 2 and 50.", "error");
            return;
        }
        if (!courseId) { showToast("Missing course in route.", "error"); return; }

        let sectionLabel = "All sections";
        if (!allSections) {
            const pick = sectionOptions.find((s) => s.id === sectionId);
            sectionLabel = pick?.name?.trim() || "Section";
        }

        const payload: NewWorkspaceProjectPayload = {
            title: t,
            abstract: abstract.trim(),
            teamSize: ts,
            duration: duration.trim(),
            sectionLabel,
            aiMode,
        };

        // Save to backend for real (numeric) courseIds
        if (backendCourseId != null) {
            setSubmitting(true);
            try {
                const selectedSectionIds = allSections
                    ? []
                    : [Number(sectionId)].filter((n) => Number.isFinite(n) && n > 0);

                await createDoctorCourseProject(backendCourseId, {
                    title: t,
                    description: abstract.trim(),
                    teamSize: ts,
                    applyToAllSections: allSections,
                    allowCrossSectionTeams: false,
                    sectionIds: selectedSectionIds,
                });
            } catch (err) {
                showToast(parseApiErrorMessage(err), "error");
                setSubmitting(false);
                return;
            } finally {
                setSubmitting(false);
            }
        }

        // Original navigation — unchanged
        if (aiMode === "doctor") {
            const tempProjectId = `temp-${Date.now()}`;
            navigate(`/courses/${courseId}/projects/${tempProjectId}/teams`, {
                state: { projectName: t },
            });
            return;
        }
        navigate(`/courses/${courseId}`, {
            state: { newProject: payload, importNonce: Date.now() },
        });
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
            <div style={{ maxWidth: 640, margin: "0 auto" }}>
                <button type="button" onClick={backToWorkspace} style={S.backBtn}>
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
                        New project
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
                        Create project
                    </h1>
                    <p style={{ margin: "10px 0 0", fontSize: 12, color: dash.muted, lineHeight: 1.45 }}>
                        Local draft only — nothing is sent to the server yet.
                    </p>
                </header>

                <form
                    onSubmit={handleSubmit}
                    style={{ ...card, marginTop: 20, padding: 24, display: "flex", flexDirection: "column", gap: 18 }}
                >
                    <label style={F.label}>
                        Title
                        <input
                            style={F.input}
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="e.g. Capstone design project"
                            autoComplete="off"
                        />
                    </label>

                    <label style={F.label}>
                        Abstract
                        <textarea
                            style={{ ...F.input, minHeight: 100, resize: "vertical" as const }}
                            value={abstract}
                            onChange={(e) => setAbstract(e.target.value)}
                            placeholder="Short summary for students"
                            rows={4}
                        />
                    </label>

                    <div>
                        <span style={F.labelText}>Project file (UI only)</span>
                        <input
                            ref={fileRef}
                            type="file"
                            style={{ display: "none" }}
                            onChange={() => {
                                const f = fileRef.current?.files?.[0];
                                setFileLabel(f ? f.name : null);
                            }}
                        />
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 10, alignItems: "center", marginTop: 8 }}>
                            <button
                                type="button"
                                style={F.uploadBtn}
                                onClick={() => fileRef.current?.click()}
                            >
                                <Upload size={16} />
                                Choose file
                            </button>
                            <span style={{ fontSize: 13, color: fileLabel ? dash.text : dash.subtle }}>
                                {fileLabel ?? "No file selected"}
                            </span>
                        </div>
                    </div>

                    <div style={F.row2}>
                        <label style={{ ...F.label, flex: 1, minWidth: 120, marginBottom: 0 }}>
                            Team size
                            <input
                                type="number"
                                min={2}
                                max={50}
                                step={1}
                                style={F.input}
                                value={teamSize}
                                onChange={(e) => {
                                    const n = Number.parseInt(e.target.value, 10);
                                    setTeamSize(Number.isFinite(n) ? n : 2);
                                }}
                            />
                        </label>
                        <label style={{ ...F.label, flex: 1, minWidth: 140, marginBottom: 0 }}>
                            Duration
                            <input
                                style={F.input}
                                value={duration}
                                onChange={(e) => setDuration(e.target.value)}
                                placeholder="e.g. 8 weeks"
                                autoComplete="off"
                            />
                        </label>
                    </div>

                    <div style={F.block}>
                        <span style={F.labelText}>Sections</span>
                        <label style={F.checkRow}>
                            <input
                                type="checkbox"
                                checked={allSections}
                                onChange={(e) => {
                                    const on = e.target.checked;
                                    setAllSections(on);
                                    if (on) setSectionId("");
                                }}
                                style={F.checkbox}
                            />
                            <span style={F.checkLabel}>All sections</span>
                        </label>
                        <label style={{ ...F.label, marginBottom: 0, marginTop: 12 }}>
                            <span style={{ ...F.labelText, display: "block", marginBottom: 6 }}>Specific section</span>
                            <select
                                style={F.input}
                                value={sectionId}
                                onChange={(e) => setSectionId(e.target.value)}
                                disabled={allSections || sectionOptions.length === 0}
                            >
                                <option value="">
                                    {sectionOptions.length === 0 ? "No sections defined yet" : "Select section…"}
                                </option>
                                {sectionOptions.map((s) => (
                                    <option key={s.id} value={s.id}>
                                        {s.name}
                                    </option>
                                ))}
                            </select>
                        </label>
                    </div>

                    <div style={F.block}>
                        <span style={F.labelText}>AI mode</span>
                        <p style={{ margin: "6px 0 10px", fontSize: 12, color: dash.muted, lineHeight: 1.45 }}>
                            How teams are formed for this project.
                        </p>
                        <div style={F.segment}>
                            <button
                                type="button"
                                onClick={() => setAiMode("doctor")}
                                style={segmentBtn(aiMode === "doctor")}
                            >
                                <Bot size={17} />
                                Doctor assigns
                            </button>
                            <button
                                type="button"
                                onClick={() => setAiMode("student")}
                                style={segmentBtn(aiMode === "student")}
                            >
                                <Sparkles size={17} />
                                Student selects
                            </button>
                        </div>
                    </div>

                    {aiMode === "doctor" ? (
                        <p style={{ margin: 0, fontSize: 12, color: dash.muted, lineHeight: 1.5 }}>
                            Teams will be automatically formed using AI based on student profiles and skills
                        </p>
                    ) : null}

                    <div style={F.actions}>
                        <button type="button" onClick={backToWorkspace} style={F.secondaryBtn}>
                            Cancel
                        </button>
                        <button type="submit" style={F.primaryBtn} disabled={submitting}>
                            <Users size={17} />
                            {submitting ? "Creating…" : "Create project"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

function segmentBtn(active: boolean): CSSProperties {
    return {
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        flex: 1,
        minWidth: 0,
        padding: "12px 14px",
        borderRadius: 12,
        border: `1.5px solid ${active ? dash.accent : dash.border}`,
        background: active ? dash.accentMuted : dash.surface,
        color: active ? dash.accent : dash.muted,
        fontSize: 13,
        fontWeight: 700,
        cursor: "pointer",
        fontFamily: dash.font,
    };
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
};

const F: Record<string, CSSProperties> = {
    label: {
        display: "block",
        fontSize: 11,
        fontWeight: 700,
        color: dash.muted,
        textTransform: "uppercase",
        letterSpacing: "0.06em",
    },
    labelText: {
        display: "block",
        fontSize: 11,
        fontWeight: 700,
        color: dash.muted,
        textTransform: "uppercase",
        letterSpacing: "0.06em",
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
    row2: {
        display: "flex",
        flexWrap: "wrap",
        gap: 16,
    },
    block: {
        paddingTop: 4,
    },
    checkRow: {
        display: "flex",
        alignItems: "center",
        gap: 10,
        marginTop: 10,
    },
    checkbox: {
        width: 18,
        height: 18,
        accentColor: dash.accent,
        cursor: "pointer",
        flexShrink: 0,
    },
    checkLabel: {
        fontSize: 14,
        fontWeight: 600,
        color: dash.text,
        cursor: "pointer",
        userSelect: "none" as const,
    },
    uploadBtn: {
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
    segment: {
        display: "flex",
        gap: 10,
        flexWrap: "wrap",
    },
    actions: {
        display: "flex",
        justifyContent: "flex-end",
        gap: 10,
        marginTop: 8,
        paddingTop: 8,
        borderTop: `1px solid ${dash.border}`,
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
};