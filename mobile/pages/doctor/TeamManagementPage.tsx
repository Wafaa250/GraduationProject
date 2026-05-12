import type { CSSProperties } from "react";
import { useMemo, useState } from "react";
import { ArrowLeft, Plus, Trash2, Users } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";

type TeamMember = {
    id: number;
    name: string;
};

const teamMembersSeed: Record<number, TeamMember[]> = {
    1: [
        { id: 1, name: "Mohammad" },
        { id: 2, name: "Ahmad" },
    ],
    2: [
        { id: 3, name: "Sara" },
        { id: 4, name: "Lina" },
    ],
};

export default function TeamManagementPage() {
    const navigate = useNavigate();
    const { projectId, teamId } = useParams<{ projectId: string; teamId: string }>();

    const parsedTeamId = Number(teamId ?? 0);
    const initialMembers = useMemo(() => teamMembersSeed[parsedTeamId] ?? [], [parsedTeamId]);
    const [members, setMembers] = useState<TeamMember[]>(initialMembers);
    const [showAddStudentModal, setShowAddStudentModal] = useState(false);
    const [studentIdInput, setStudentIdInput] = useState("");
    const [selectedStudent, setSelectedStudent] = useState("");
    const mockStudents = [
        { id: "121", name: "Ahmad" },
        { id: "122", name: "Sara" },
        { id: "123", name: "Lina" },
    ];

    const handleRemoveMember = (memberId: number) => {
        setMembers((prev) => prev.filter((member) => member.id !== memberId));
    };

    const handleAddStudent = () => {
        setShowAddStudentModal(true);
    };

    const handleConfirmAddStudent = () => {
        const typedId = studentIdInput.trim();
        const pickedStudentId = selectedStudent.trim();

        if (typedId && pickedStudentId) {
            alert("Please use only one option (ID or select).");
            return;
        }

        if (!typedId && !pickedStudentId) {
            alert("Please enter student ID or select a student.");
            return;
        }

        const pickedId = typedId || pickedStudentId;
        const pickedFromList = mockStudents.find((student) => student.id === pickedId);
        setMembers((prev) => {
            const nextId = prev.reduce((max, current) => Math.max(max, current.id), 0) + 1;
            return [
                ...prev,
                {
                    id: nextId,
                    name: pickedFromList?.name ?? `Student ${pickedId}`,
                },
            ];
        });
        console.log("Add student:", pickedId);
        setStudentIdInput("");
        setSelectedStudent("");
        setShowAddStudentModal(false);
    };

    return (
        <div style={S.page}>
            <div style={S.container}>
                <button
                    type="button"
                    onClick={() => navigate(`/doctor/projects/${projectId}/teams`)}
                    style={S.backBtn}
                >
                    <ArrowLeft size={16} />
                    Back to teams
                </button>

                <header style={S.header}>
                    <div>
                        <h1 style={S.title}>Team Management</h1>
                        <p style={S.subtitle}>
                            Project #{projectId ?? "—"} - Team #{teamId ?? "—"}
                        </p>
                    </div>
                    <button type="button" style={S.primaryBtn} onClick={handleAddStudent}>
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

                    {members.length === 0 ? (
                        <p style={S.empty}>No members in this team yet.</p>
                    ) : (
                        <div style={S.membersList}>
                            {members.map((member) => (
                                <div key={member.id} style={S.memberRow}>
                                    <div style={S.memberLeft}>
                                        <div style={S.avatar}>{member.name.charAt(0).toUpperCase()}</div>
                                        <p style={S.memberName}>{member.name}</p>
                                    </div>
                                    <div style={S.actions}>
                                        <button
                                            type="button"
                                            style={S.dangerBtn}
                                            onClick={() => handleRemoveMember(member.id)}
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
            {showAddStudentModal ? (
                <div style={S.modalOverlay}>
                    <div style={S.modalCard}>
                        <h3 style={S.modalTitle}>Add Student</h3>

                        <input
                            type="text"
                            placeholder="Enter student ID"
                            value={studentIdInput}
                            onChange={(e) => setStudentIdInput(e.target.value)}
                            disabled={selectedStudent !== ""}
                            style={S.modalInput}
                        />

                        <div style={S.orText}>OR</div>

                        <select
                            value={selectedStudent}
                            onChange={(e) => setSelectedStudent(e.target.value)}
                            disabled={studentIdInput.trim() !== ""}
                            style={S.modalInput}
                        >
                            <option value="">Select student</option>
                            {mockStudents.map((student) => (
                                <option key={student.id} value={student.id}>
                                    {student.name}
                                </option>
                            ))}
                        </select>

                        <div style={S.modalActions}>
                            <button
                                type="button"
                                style={S.modalCancelBtn}
                                onClick={() => {
                                    setShowAddStudentModal(false);
                                    setStudentIdInput("");
                                    setSelectedStudent("");
                                }}
                            >
                                Cancel
                            </button>

                            <button
                                type="button"
                                style={S.modalAddBtn}
                                onClick={handleConfirmAddStudent}
                            >
                                Add
                            </button>
                        </div>
                    </div>
                </div>
            ) : null}
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
    container: {
        maxWidth: 980,
        margin: "0 auto",
    },
    backBtn: {
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        padding: "8px 12px",
        borderRadius: 10,
        border: "1px solid #e2e8f0",
        background: "#fff",
        color: "#334155",
        fontSize: 13,
        fontWeight: 700,
        cursor: "pointer",
        fontFamily: "inherit",
    },
    header: {
        marginTop: 14,
        border: "1px solid #e2e8f0",
        borderRadius: 14,
        background: "#fff",
        padding: 18,
        boxShadow: "0 8px 22px rgba(15,23,42,0.05)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 12,
        flexWrap: "wrap",
    },
    title: { margin: 0, fontSize: 24, fontWeight: 800, color: "#1f2937" },
    subtitle: { margin: "6px 0 0", fontSize: 13, color: "#64748b" },
    primaryBtn: {
        border: "none",
        borderRadius: 10,
        background: "linear-gradient(135deg,#7c3aed,#8b5cf6)",
        color: "#fff",
        fontSize: 12,
        fontWeight: 700,
        padding: "9px 12px",
        cursor: "pointer",
        fontFamily: "inherit",
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
    },
    card: {
        marginTop: 16,
        border: "1px solid #e2e8f0",
        borderRadius: 14,
        background: "#fff",
        padding: 16,
        boxShadow: "0 8px 22px rgba(15,23,42,0.05)",
    },
    cardHead: {
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 8,
        marginBottom: 12,
    },
    cardTitle: { margin: 0, fontSize: 18, fontWeight: 800, color: "#0f172a" },
    countChip: {
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
        fontSize: 11,
        fontWeight: 700,
        color: "#6d28d9",
        background: "#f3e8ff",
        border: "1px solid #e9d5ff",
        borderRadius: 999,
        padding: "4px 8px",
    },
    empty: {
        margin: 0,
        color: "#64748b",
        fontSize: 14,
    },
    membersList: {
        display: "flex",
        flexDirection: "column",
        gap: 10,
    },
    memberRow: {
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 12,
        border: "1px solid #e2e8f0",
        borderRadius: 10,
        background: "#f8fafc",
        padding: "10px 12px",
    },
    memberLeft: {
        minWidth: 0,
        flex: 1,
        display: "flex",
        alignItems: "center",
        gap: 10,
    },
    avatar: {
        width: 34,
        height: 34,
        borderRadius: "50%",
        background: "#ddd6fe",
        color: "#6d28d9",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: 13,
        fontWeight: 800,
        flexShrink: 0,
    },
    memberName: { margin: 0, fontSize: 14, fontWeight: 600, color: "#1f2937" },
    actions: {
        display: "flex",
        alignItems: "center",
        justifyContent: "flex-end",
    },
    dangerBtn: {
        border: "1px solid #fecaca",
        borderRadius: 9,
        background: "#fff1f2",
        color: "#be123c",
        fontSize: 12,
        fontWeight: 700,
        padding: "7px 10px",
        cursor: "pointer",
        fontFamily: "inherit",
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
    },
    modalOverlay: {
        position: "fixed",
        inset: 0,
        background: "rgba(15,23,42,0.3)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
        zIndex: 50,
    },
    modalCard: {
        width: "100%",
        maxWidth: 400,
        borderRadius: 14,
        border: "1px solid #e2e8f0",
        background: "#fff",
        padding: 20,
        boxShadow: "0 16px 40px rgba(15,23,42,0.2)",
        display: "flex",
        flexDirection: "column",
        gap: 12,
    },
    modalTitle: {
        margin: 0,
        fontSize: 18,
        fontWeight: 800,
        color: "#111827",
    },
    modalInput: {
        width: "100%",
        border: "1px solid #cbd5e1",
        borderRadius: 10,
        padding: "10px 12px",
        fontSize: 14,
        color: "#0f172a",
        fontFamily: "inherit",
        boxSizing: "border-box",
        background: "#fff",
    },
    orText: {
        textAlign: "center",
        color: "#94a3b8",
        fontSize: 12,
        fontWeight: 700,
        letterSpacing: "0.04em",
    },
    modalActions: {
        display: "flex",
        justifyContent: "flex-end",
        gap: 8,
        marginTop: 4,
    },
    modalCancelBtn: {
        border: "1px solid #e2e8f0",
        borderRadius: 10,
        background: "#fff",
        color: "#334155",
        fontSize: 13,
        fontWeight: 700,
        padding: "8px 12px",
        cursor: "pointer",
        fontFamily: "inherit",
    },
    modalAddBtn: {
        border: "none",
        borderRadius: 10,
        background: "#7c3aed",
        color: "#fff",
        fontSize: 13,
        fontWeight: 700,
        padding: "8px 14px",
        cursor: "pointer",
        fontFamily: "inherit",
    },
};
