import { useCallback, useEffect, useState, type CSSProperties } from "react";
import { ArrowLeft, Plus, Search, Trash2, Users } from "lucide-react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import api, { parseApiErrorMessage } from "../../../api/axiosInstance";
import { useToast } from "../../../context/ToastContext";

type TeamMember = {
    studentId: number;
    userId: number;
    name: string;
    universityId: string;
    matchScore: number;
    skills: string[];
};

type TeamResponse = {
    teamId: number;
    teamIndex: number;
    memberCount: number;
    members: TeamMember[];
};

type EnrolledStudent = {
    studentId: number;
    name: string;
    universityId: string;
    major: string;
    email: string;
};

type LocationState = {
    courseId?: number;
    projectName?: string;
};

export default function TeamManagementPage() {
    const navigate = useNavigate();
    const location = useLocation();
    const { projectId, teamId } = useParams<{ projectId: string; teamId: string }>();
    const { showToast } = useToast();

    const st = location.state as LocationState | null;
    const courseId = st?.courseId ?? null;
    const projectName = st?.projectName ?? `Project #${projectId ?? "—"}`;
    const teamIndex = Number(teamId ?? 0);
    const teamLabel = `Team ${String.fromCharCode(65 + teamIndex)}`;

    const [members, setMembers] = useState<TeamMember[]>([]);
    const [loading, setLoading] = useState(false);
    const [removingId, setRemovingId] = useState<number | null>(null);
    const [showAddModal, setShowAddModal] = useState(false);
    const [enrolledStudents, setEnrolledStudents] = useState<EnrolledStudent[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedStudentId, setSelectedStudentId] = useState<number | null>(null);
    const [loadingStudents, setLoadingStudents] = useState(false);
    const [adding, setAdding] = useState(false);

    const loadTeam = useCallback(async () => {
        if (!courseId || !projectId) return;
        setLoading(true);
        try {
            const res = await api.get<TeamResponse>(
                `/courses/${courseId}/projects/${projectId}/teams/${teamIndex}`
            );
            setMembers(res.data.members);
        } catch (err) {
            showToast(parseApiErrorMessage(err), "error");
        } finally {
            setLoading(false);
        }
    }, [courseId, projectId, teamIndex, showToast]);

    useEffect(() => {
        void loadTeam();
    }, [loadTeam]);

    const openAddModal = async () => {
        if (!courseId) return;
        setShowAddModal(true);
        setSearchQuery("");
        setSelectedStudentId(null);
        setLoadingStudents(true);
        try {
            const res = await api.get<EnrolledStudent[]>(`/courses/${courseId}/enrolled-students`);
            // Filter out students already in the team
            const memberIds = new Set(members.map((m) => m.studentId));
            setEnrolledStudents(res.data.filter((s) => !memberIds.has(s.studentId)));
        } catch (err) {
            showToast(parseApiErrorMessage(err), "error");
            setShowAddModal(false);
        } finally {
            setLoadingStudents(false);
        }
    };

    const handleRemoveMember = async (studentId: number) => {
        if (!courseId || !projectId) return;
        setRemovingId(studentId);
        try {
            await api.delete(
                `/courses/${courseId}/projects/${projectId}/teams/${teamIndex}/members/${studentId}`
            );
            setMembers((prev) => prev.filter((m) => m.studentId !== studentId));
            showToast("Member removed.", "success");
        } catch (err) {
            showToast(parseApiErrorMessage(err), "error");
        } finally {
            setRemovingId(null);
        }
    };

    const handleConfirmAddStudent = async () => {
        if (!selectedStudentId) {
            showToast("Please select a student.", "error");
            return;
        }
        if (!courseId || !projectId) return;
        const student = enrolledStudents.find((s) => s.studentId === selectedStudentId);
        if (!student) return;
        setAdding(true);
        try {
            const res = await api.post<TeamResponse>(
                `/courses/${courseId}/projects/${projectId}/teams/${teamIndex}/members`,
                { universityId: student.universityId }
            );
            setMembers(res.data.members);
            showToast("Student added successfully.", "success");
            setShowAddModal(false);
        } catch (err) {
            showToast(parseApiErrorMessage(err), "error");
        } finally {
            setAdding(false);
        }
    };

    const filteredStudents = enrolledStudents.filter((s) => {
        const q = searchQuery.toLowerCase();
        return (
            s.name.toLowerCase().includes(q) ||
            s.universityId?.toLowerCase().includes(q) ||
            s.major?.toLowerCase().includes(q)
        );
    });

    return (
        <div style={S.page}>
            <div style={S.container}>
                <button
                    type="button"
                    onClick={() =>
                        navigate(`/doctor/projects/${projectId}/teams`, {
                            state: { courseId, projectName },
                        })
                    }
                    style={S.backBtn}
                >
                    <ArrowLeft size={16} />
                    Back to teams
                </button>

                <header style={S.header}>
                    <div>
                        <h1 style={S.title}>Team Management</h1>
                        <p style={S.subtitle}>
                            {projectName} · {teamLabel}
                        </p>
                    </div>
                    <button
                        type="button"
                        style={S.primaryBtn}
                        onClick={() => void openAddModal()}
                        disabled={!courseId}
                    >
                        <Plus size={14} />
                        Add Student
                    </button>
                </header>

                <section style={S.card}>
                    <div style={S.cardHead}>
                        <h2 style={S.cardTitle}>Team Members</h2>
                        <span style={S.countChip}>
                            <Users size={12} />
                            {members.length} members
                        </span>
                    </div>

                    {loading ? (
                        <p style={S.empty}>Loading…</p>
                    ) : members.length === 0 ? (
                        <p style={S.empty}>No members in this team yet.</p>
                    ) : (
                        <div style={S.membersList}>
                            {members.map((member) => (
                                <div key={member.studentId} style={S.memberRow}>
                                    <div style={S.memberLeft}>
                                        <div style={S.avatar}>
                                            {member.name.charAt(0).toUpperCase()}
                                        </div>
                                        <div>
                                            <p style={S.memberName}>{member.name}</p>
                                            {member.universityId && (
                                                <p style={S.memberSub}>ID: {member.universityId}</p>
                                            )}
                                        </div>
                                    </div>
                                    <div style={S.memberRight}>
                                        <span style={S.scoreBadge}>
                                            {member.matchScore.toFixed(0)}%
                                        </span>
                                        <button
                                            type="button"
                                            style={{
                                                ...S.dangerBtn,
                                                opacity: removingId === member.studentId ? 0.6 : 1,
                                            }}
                                            onClick={() => void handleRemoveMember(member.studentId)}
                                            disabled={removingId === member.studentId}
                                        >
                                            <Trash2 size={13} />
                                            Remove
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </section>
            </div>

            {showAddModal && (
                <div style={S.modalOverlay}>
                    <div style={S.modalCard}>
                        <h3 style={S.modalTitle}>Add Student</h3>
                        <p style={S.modalSubtitle}>Select a student enrolled in this course</p>

                        {/* Search */}
                        <div style={S.searchWrapper}>
                            <Search size={14} style={S.searchIcon} />
                            <input
                                type="text"
                                placeholder="Search by name, ID, or major…"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                style={S.searchInput}
                                autoFocus
                            />
                        </div>

                        {/* Student list */}
                        <div style={S.studentList}>
                            {loadingStudents ? (
                                <p style={S.modalEmpty}>Loading students…</p>
                            ) : filteredStudents.length === 0 ? (
                                <p style={S.modalEmpty}>
                                    {enrolledStudents.length === 0
                                        ? "No enrolled students available."
                                        : "No students match your search."}
                                </p>
                            ) : (
                                filteredStudents.map((s) => (
                                    <div
                                        key={s.studentId}
                                        style={{
                                            ...S.studentRow,
                                            background:
                                                selectedStudentId === s.studentId
                                                    ? "#f3e8ff"
                                                    : "#f8fafc",
                                            border:
                                                selectedStudentId === s.studentId
                                                    ? "1.5px solid #8b5cf6"
                                                    : "1px solid #e2e8f0",
                                        }}
                                        onClick={() => setSelectedStudentId(s.studentId)}
                                    >
                                        <div style={S.studentAvatar}>
                                            {s.name.charAt(0).toUpperCase()}
                                        </div>
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <p style={S.studentName}>{s.name}</p>
                                            <p style={S.studentMeta}>
                                                {s.universityId}
                                                {s.major ? ` · ${s.major}` : ""}
                                            </p>
                                        </div>
                                        {selectedStudentId === s.studentId && (
                                            <div style={S.selectedDot} />
                                        )}
                                    </div>
                                ))
                            )}
                        </div>

                        <div style={S.modalActions}>
                            <button
                                type="button"
                                style={S.modalCancelBtn}
                                onClick={() => setShowAddModal(false)}
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                style={{
                                    ...S.modalAddBtn,
                                    opacity: adding || !selectedStudentId ? 0.6 : 1,
                                }}
                                onClick={() => void handleConfirmAddStudent()}
                                disabled={adding || !selectedStudentId}
                            >
                                {adding ? "Adding…" : "Add"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

const S: Record<string, CSSProperties> = {
    page: {
        minHeight: "100vh",
        background: "#f8fafc",
        color: "#0f172a",
        fontFamily: "Inter, system-ui, -apple-system, Segoe UI, Roboto, sans-serif",
        padding: "24px 28px 40px",
    },
    container: { maxWidth: 980, margin: "0 auto" },
    backBtn: {
        display: "inline-flex", alignItems: "center", gap: 8, padding: "8px 12px",
        borderRadius: 10, border: "1px solid #e2e8f0", background: "#fff",
        color: "#334155", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
    },
    header: {
        marginTop: 14, border: "1px solid #e2e8f0", borderRadius: 14,
        background: "#fff", padding: 18, boxShadow: "0 8px 22px rgba(15,23,42,0.05)",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        gap: 12, flexWrap: "wrap",
    },
    title: { margin: 0, fontSize: 24, fontWeight: 800, color: "#1f2937" },
    subtitle: { margin: "6px 0 0", fontSize: 13, color: "#64748b" },
    primaryBtn: {
        border: "none", borderRadius: 10,
        background: "linear-gradient(135deg,#7c3aed,#8b5cf6)",
        color: "#fff", fontSize: 12, fontWeight: 700, padding: "9px 12px",
        cursor: "pointer", fontFamily: "inherit",
        display: "inline-flex", alignItems: "center", gap: 8,
    },
    card: {
        marginTop: 16, border: "1px solid #e2e8f0", borderRadius: 14,
        background: "#fff", padding: 16, boxShadow: "0 8px 22px rgba(15,23,42,0.05)",
    },
    cardHead: {
        display: "flex", alignItems: "center", justifyContent: "space-between",
        gap: 8, marginBottom: 12,
    },
    cardTitle: { margin: 0, fontSize: 18, fontWeight: 800, color: "#0f172a" },
    countChip: {
        display: "inline-flex", alignItems: "center", gap: 5,
        fontSize: 11, fontWeight: 700, color: "#6d28d9",
        background: "#f3e8ff", border: "1px solid #e9d5ff",
        borderRadius: 999, padding: "4px 8px",
    },
    empty: { margin: 0, color: "#64748b", fontSize: 14 },
    membersList: { display: "flex", flexDirection: "column", gap: 10 },
    memberRow: {
        display: "flex", alignItems: "center", justifyContent: "space-between",
        gap: 12, border: "1px solid #e2e8f0", borderRadius: 10,
        background: "#f8fafc", padding: "10px 12px",
    },
    memberLeft: { minWidth: 0, flex: 1, display: "flex", alignItems: "center", gap: 10 },
    memberRight: { display: "flex", alignItems: "center", gap: 10, flexShrink: 0 },
    avatar: {
        width: 34, height: 34, borderRadius: "50%",
        background: "#ddd6fe", color: "#6d28d9",
        display: "inline-flex", alignItems: "center", justifyContent: "center",
        fontSize: 13, fontWeight: 800, flexShrink: 0,
    },
    memberName: { margin: 0, fontSize: 14, fontWeight: 600, color: "#1f2937" },
    memberSub: { margin: "2px 0 0", fontSize: 11, color: "#94a3b8" },
    scoreBadge: {
        fontSize: 11, fontWeight: 800, color: "#6d28d9",
        background: "#f3e8ff", border: "1px solid #e9d5ff",
        borderRadius: 999, padding: "3px 8px",
    },
    dangerBtn: {
        border: "1px solid #fecaca", borderRadius: 9, background: "#fff1f2",
        color: "#be123c", fontSize: 12, fontWeight: 700, padding: "7px 10px",
        cursor: "pointer", fontFamily: "inherit",
        display: "inline-flex", alignItems: "center", gap: 6,
    },
    modalOverlay: {
        position: "fixed", inset: 0, background: "rgba(15,23,42,0.3)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: 16, zIndex: 50,
    },
    modalCard: {
        width: "100%", maxWidth: 400, borderRadius: 14,
        border: "1px solid #e2e8f0", background: "#fff", padding: 20,
        boxShadow: "0 16px 40px rgba(15,23,42,0.2)",
        display: "flex", flexDirection: "column", gap: 12,
    },
    modalTitle: { margin: 0, fontSize: 18, fontWeight: 800, color: "#111827" },
    modalSubtitle: { margin: "4px 0 0", fontSize: 13, color: "#64748b" },
    searchWrapper: {
        position: "relative", display: "flex", alignItems: "center",
    },
    searchIcon: {
        position: "absolute", left: 10, color: "#94a3b8", pointerEvents: "none",
    } as CSSProperties,
    searchInput: {
        width: "100%", border: "1px solid #cbd5e1", borderRadius: 10,
        padding: "9px 12px 9px 32px", fontSize: 13, color: "#0f172a",
        fontFamily: "inherit", boxSizing: "border-box", background: "#fff",
    } as CSSProperties,
    studentList: {
        maxHeight: 280, overflowY: "auto", display: "flex", flexDirection: "column", gap: 6,
        padding: "2px 0",
    } as CSSProperties,
    modalEmpty: { margin: "12px 0", fontSize: 13, color: "#94a3b8", textAlign: "center" },
    studentRow: {
        display: "flex", alignItems: "center", gap: 10,
        borderRadius: 10, padding: "9px 10px", cursor: "pointer",
        transition: "all 0.12s",
    },
    studentAvatar: {
        width: 32, height: 32, borderRadius: "50%",
        background: "#ddd6fe", color: "#6d28d9",
        display: "inline-flex", alignItems: "center", justifyContent: "center",
        fontSize: 12, fontWeight: 800, flexShrink: 0,
    },
    studentName: { margin: 0, fontSize: 13, fontWeight: 600, color: "#1f2937" },
    studentMeta: { margin: "2px 0 0", fontSize: 11, color: "#94a3b8" },
    selectedDot: {
        width: 10, height: 10, borderRadius: "50%",
        background: "#7c3aed", flexShrink: 0,
    },
    modalActions: { display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 4 },
    modalCancelBtn: {
        border: "1px solid #e2e8f0", borderRadius: 10, background: "#fff",
        color: "#334155", fontSize: 13, fontWeight: 700, padding: "8px 12px",
        cursor: "pointer", fontFamily: "inherit",
    },
    modalAddBtn: {
        border: "none", borderRadius: 10, background: "#7c3aed",
        color: "#fff", fontSize: 13, fontWeight: 700, padding: "8px 14px",
        cursor: "pointer", fontFamily: "inherit",
    },
};
