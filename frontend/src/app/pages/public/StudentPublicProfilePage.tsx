import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { ArrowLeft, BookOpen, GraduationCap, MapPin, Sparkles } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { apiClient } from "../../../api/client";

type StudentDto = Record<string, unknown>;
type ProjectDto = Record<string, unknown>;

type StudentPublicProfile = {
  id: number;
  fullName: string;
  email: string;
  faculty: string;
  major: string;
  university: string;
  academicYear: string;
  gpa: string;
  skills: string[];
};

type PublicProject = {
  id: number;
  name: string;
  abstract: string;
  requiredSkills: string[];
  teamSize: number | null;
};

const text = (value: unknown): string => (typeof value === "string" ? value.trim() : "");
const num = (value: unknown): number | null =>
  typeof value === "number" && Number.isFinite(value) ? value : null;

function mapStudent(raw: StudentDto): StudentPublicProfile {
  const profile = (raw.studentProfile ?? raw.StudentProfile ?? {}) as StudentDto;
  const allSkills = [
    ...(Array.isArray(raw.generalSkills) ? raw.generalSkills : []),
    ...(Array.isArray(raw.majorSkills) ? raw.majorSkills : []),
    ...(Array.isArray(raw.skills) ? raw.skills : []),
    ...(Array.isArray(profile.technicalSkills) ? profile.technicalSkills : []),
    ...(Array.isArray(profile.roles) ? profile.roles : []),
    ...(Array.isArray(profile.tools) ? profile.tools : []),
  ]
    .map(text)
    .filter(Boolean);

  return {
    id: num(raw.userId ?? raw.id ?? raw.Id) ?? 0,
    fullName: text(raw.name ?? raw.fullName ?? raw.full_name) || "Student",
    email: text(raw.email),
    faculty: text(raw.faculty ?? profile.faculty ?? profile.Faculty),
    major: text(raw.major ?? profile.major ?? profile.Major),
    university: text(raw.university ?? profile.university ?? profile.University),
    academicYear: text(raw.academicYear ?? raw.year ?? profile.academicYear ?? profile.AcademicYear),
    gpa: String(raw.gpa ?? profile.gpa ?? "").trim(),
    skills: [...new Set(allSkills)],
  };
}

function mapProject(raw: ProjectDto): PublicProject {
  const requiredSkills = (
    Array.isArray(raw.requiredSkills) ? raw.requiredSkills : Array.isArray(raw.skills) ? raw.skills : []
  )
    .map(text)
    .filter(Boolean);

  return {
    id: num(raw.id ?? raw.Id) ?? 0,
    name: text(raw.name ?? raw.title ?? raw.Title) || "Untitled Project",
    abstract: text(raw.abstract ?? raw.description ?? raw.Abstract ?? raw.Description),
    requiredSkills,
    teamSize: num(raw.partnersCount ?? raw.teamSize ?? raw.TeamSize),
  };
}

export default function StudentPublicProfilePage() {
  const { studentId } = useParams<{ studentId: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [profile, setProfile] = useState<StudentPublicProfile | null>(null);
  const [projects, setProjects] = useState<PublicProject[]>([]);

  useEffect(() => {
    if (!studentId) return;
    let cancelled = false;

    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const [studentRes, projectsRes] = await Promise.allSettled([
          apiClient.get(`/students/${studentId}`),
          apiClient.get("/graduation-projects", { params: { studentId } }),
        ]);

        if (cancelled) return;
        if (studentRes.status !== "fulfilled") {
          throw studentRes.reason;
        }

        setProfile(mapStudent((studentRes.value.data ?? {}) as StudentDto));

        if (projectsRes.status === "fulfilled" && Array.isArray(projectsRes.value.data)) {
          setProjects(projectsRes.value.data.map((item: ProjectDto) => mapProject(item)));
        } else {
          setProjects([]);
        }
      } catch (err: unknown) {
        const message =
          (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
          "Failed to load student profile.";
        setError(message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void fetchData();
    return () => {
      cancelled = true;
    };
  }, [studentId]);

  const initials = useMemo(
    () =>
      (profile?.fullName || "ST")
        .split(" ")
        .map((part) => part[0] ?? "")
        .join("")
        .slice(0, 2)
        .toUpperCase(),
    [profile?.fullName],
  );

  if (loading) {
    return <div style={S.center}>Loading profile...</div>;
  }

  if (error || !profile) {
    return (
      <div style={S.center}>
        <p style={{ margin: 0, color: "#b91c1c", fontWeight: 700 }}>{error || "Profile not found."}</p>
        <button type="button" onClick={() => navigate(-1)} style={S.backBtn}>
          <ArrowLeft size={14} /> Back
        </button>
      </div>
    );
  }

  return (
    <div style={S.page}>
      <div style={S.topBar}>
        <button type="button" onClick={() => navigate(-1)} style={S.backBtn}>
          <ArrowLeft size={14} /> Back
        </button>
      </div>

      <div style={S.content}>
        <section style={S.heroCard}>
          <div style={S.avatar}>{initials}</div>
          <div style={{ minWidth: 0, flex: 1 }}>
            <h1 style={S.name}>{profile.fullName}</h1>
            <p style={S.email}>{profile.email || "—"}</p>
            <div style={S.badges}>
              {profile.major ? <span style={S.badge}><GraduationCap size={12} /> {profile.major}</span> : null}
              {profile.university ? <span style={S.badge}><MapPin size={12} /> {profile.university}</span> : null}
              {profile.academicYear ? <span style={S.badge}>{profile.academicYear}</span> : null}
            </div>
          </div>
        </section>

        <div style={S.grid}>
          <section style={S.card}>
            <h2 style={S.sectionTitle}><BookOpen size={14} /> Academic Info</h2>
            {[
              ["Email", profile.email],
              ["Faculty", profile.faculty],
              ["Year", profile.academicYear],
              ["GPA", profile.gpa],
            ].map(([label, value]) => (
              <div key={label} style={S.infoRow}>
                <span style={S.infoLabel}>{label}</span>
                <span style={S.infoValue}>{value || "—"}</span>
              </div>
            ))}
          </section>

          <section style={S.card}>
            <h2 style={S.sectionTitle}><Sparkles size={14} /> Skills</h2>
            {profile.skills.length === 0 ? (
              <p style={S.muted}>No skills listed.</p>
            ) : (
              <div style={S.tags}>
                {profile.skills.map((skill) => (
                  <span key={skill} style={S.tag}>{skill}</span>
                ))}
              </div>
            )}
          </section>
        </div>

        <section style={S.card}>
          <h2 style={S.sectionTitle}>Projects</h2>
          {projects.length === 0 ? (
            <p style={S.muted}>No graduation projects found.</p>
          ) : (
            <div style={S.projects}>
              {projects.map((project) => (
                <article key={`${project.id}-${project.name}`} style={S.projectCard}>
                  <p style={S.projectTitle}>{project.name}</p>
                  <p style={S.projectAbstract}>{project.abstract || "No abstract provided."}</p>
                  <div style={S.tags}>
                    {project.requiredSkills.length > 0 ? project.requiredSkills.map((skill) => (
                      <span key={`${project.id}-${skill}`} style={S.tag}>{skill}</span>
                    )) : <span style={S.muted}>No required skills</span>}
                  </div>
                  <p style={S.meta}>Team size: {project.teamSize ?? "—"}</p>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

const S: Record<string, CSSProperties> = {
  page: { minHeight: "100vh", background: "linear-gradient(155deg,#f8f7ff,#f0f4ff,#faf5ff)", fontFamily: "DM Sans, sans-serif", color: "#0f172a" },
  center: { minHeight: "100vh", display: "flex", flexDirection: "column", gap: 12, alignItems: "center", justifyContent: "center", fontFamily: "DM Sans, sans-serif" },
  topBar: { position: "sticky", top: 0, zIndex: 10, background: "rgba(248,247,255,0.9)", borderBottom: "1px solid #e2e8f0", padding: "10px 18px" },
  backBtn: { display: "inline-flex", alignItems: "center", gap: 6, border: "1px solid #e2e8f0", background: "#fff", borderRadius: 9, padding: "7px 12px", fontSize: 12, fontWeight: 700, color: "#64748b", cursor: "pointer", fontFamily: "inherit" },
  content: { maxWidth: 980, margin: "0 auto", padding: 20, display: "flex", flexDirection: "column", gap: 16 },
  heroCard: { display: "flex", gap: 14, alignItems: "center", flexWrap: "wrap", background: "#fff", border: "1px solid #e2e8f0", borderRadius: 16, padding: 16, boxShadow: "0 2px 12px rgba(99,102,241,0.06)" },
  avatar: { width: 70, height: 70, borderRadius: "50%", background: "linear-gradient(135deg,#6366f1,#a855f7)", color: "#fff", fontSize: 24, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 },
  name: { margin: "0 0 4px", fontSize: 24, fontWeight: 800, fontFamily: "Syne, sans-serif" },
  email: { margin: "0 0 8px", color: "#64748b", fontSize: 13 },
  badges: { display: "flex", flexWrap: "wrap", gap: 6 },
  badge: { display: "inline-flex", alignItems: "center", gap: 4, borderRadius: 999, padding: "4px 10px", background: "#eef2ff", border: "1px solid #c7d2fe", color: "#4f46e5", fontSize: 11, fontWeight: 700 },
  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))", gap: 16 },
  card: { background: "#fff", border: "1px solid #e2e8f0", borderRadius: 14, padding: 16, boxShadow: "0 1px 8px rgba(99,102,241,0.05)" },
  sectionTitle: { margin: "0 0 12px", display: "flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.06em", color: "#475569" },
  infoRow: { display: "flex", justifyContent: "space-between", gap: 12, padding: "8px 0", borderBottom: "1px solid #f1f5f9" },
  infoLabel: { fontSize: 12, color: "#64748b", fontWeight: 700 },
  infoValue: { fontSize: 13, color: "#0f172a", fontWeight: 700, textAlign: "right" },
  tags: { display: "flex", flexWrap: "wrap", gap: 6 },
  tag: { fontSize: 11, fontWeight: 700, color: "#6366f1", background: "#eef2ff", border: "1px solid #c7d2fe", borderRadius: 999, padding: "4px 10px" },
  projects: { display: "flex", flexDirection: "column", gap: 10 },
  projectCard: { border: "1px solid #e2e8f0", borderRadius: 12, padding: 12, background: "#f8fafc" },
  projectTitle: { margin: "0 0 6px", fontSize: 14, fontWeight: 800, color: "#0f172a" },
  projectAbstract: { margin: "0 0 8px", fontSize: 12, color: "#64748b", lineHeight: 1.5 },
  meta: { margin: "8px 0 0", fontSize: 12, fontWeight: 700, color: "#475569" },
  muted: { margin: 0, fontSize: 12, color: "#94a3b8" },
};
import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { ArrowLeft, BookOpen, GraduationCap, Mail, MapPin } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { apiClient } from "../../../api/client";
import { parseApiErrorMessage } from "../../../api/axiosInstance";
import { card, dash } from "../doctor/dashboard/doctorDashTokens";

type StudentProfile = {
  id: number;
  name: string;
  email: string | null;
  major: string | null;
  faculty: string | null;
  university: string | null;
  year: string | null;
  gpa: number | null;
  technicalSkills: string[];
  roles: string[];
  tools: string[];
  profilePictureBase64: string | null;
};

type StudentProject = {
  id: number;
  name: string;
  abstract: string | null;
  requiredSkills: string[];
  teamSize: number | null;
};

function text(v: unknown): string | null {
  if (typeof v !== "string") return null;
  const t = v.trim();
  return t.length > 0 ? t : null;
}

function mapStudent(raw: unknown): StudentProfile {
  const r = (raw ?? {}) as Record<string, unknown>;
  const id = Number(r.userId ?? r.UserId ?? r.id ?? r.Id ?? 0);
  return {
    id: Number.isFinite(id) ? id : 0,
    name: text(r.name ?? r.Name) ?? "Student",
    email: text(r.email ?? r.Email),
    major: text(r.major ?? r.Major),
    faculty: text(r.faculty ?? r.Faculty),
    university: text(r.university ?? r.University),
    year: text(r.academicYear ?? r.AcademicYear),
    gpa: typeof r.gpa === "number" ? r.gpa : typeof r.Gpa === "number" ? (r.Gpa as number) : null,
    technicalSkills: Array.isArray(r.technicalSkills) ? r.technicalSkills.map(String) : [],
    roles: Array.isArray(r.roles) ? r.roles.map(String) : [],
    tools: Array.isArray(r.tools) ? r.tools.map(String) : [],
    profilePictureBase64: text(r.profilePictureBase64 ?? r.ProfilePictureBase64),
  };
}

function mapProjects(raw: unknown): StudentProject[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((row) => {
      const r = row as Record<string, unknown>;
      const id = Number(r.id ?? r.Id ?? 0);
      if (!Number.isFinite(id) || id <= 0) return null;
      const partnersCount = Number(r.partnersCount ?? r.PartnersCount);
      return {
        id,
        name: text(r.name ?? r.Name) ?? "Untitled Project",
        abstract: text(r.abstract ?? r.Abstract ?? r.description ?? r.Description),
        requiredSkills: Array.isArray(r.requiredSkills ?? r.RequiredSkills)
          ? (r.requiredSkills ?? r.RequiredSkills as string[]).map(String)
          : [],
        teamSize: Number.isFinite(partnersCount) ? partnersCount : null,
      } as StudentProject;
    })
    .filter((p): p is StudentProject => p !== null);
}

export default function StudentPublicProfilePage() {
  const navigate = useNavigate();
  const { studentId } = useParams<{ studentId: string }>();
  const id = useMemo(() => (studentId && /^\d+$/.test(studentId) ? Number(studentId) : null), [studentId]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [projects, setProjects] = useState<StudentProject[]>([]);

  useEffect(() => {
    if (id == null) {
      setLoading(false);
      setError("Student not found");
      return;
    }

    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const [studentRes, projectsRes] = await Promise.allSettled([
          apiClient.get(`/students/${id}`),
          apiClient.get("/graduation-projects", { params: { studentId: id } }),
        ]);
        if (cancelled) return;

        if (studentRes.status !== "fulfilled") throw studentRes.reason;
        setProfile(mapStudent(studentRes.value.data));
        setProjects(projectsRes.status === "fulfilled" ? mapProjects(projectsRes.value.data) : []);
      } catch (err) {
        if (!cancelled) setError(parseApiErrorMessage(err) || "Student not found");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (loading) return <div style={S.center}>Loading student profile...</div>;
  if (error || !profile) return <div style={S.center}>{error || "Student not found"}</div>;

  const initials = profile.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
  const skills = [...profile.roles, ...profile.technicalSkills, ...profile.tools];

  return (
    <div style={S.page}>
      <div style={S.container}>
        <button type="button" onClick={() => navigate(-1)} style={S.backBtn}>
          <ArrowLeft size={14} /> Back
        </button>

        <section style={{ ...card, ...S.topCard }}>
          <div style={S.avatarWrap}>
            {profile.profilePictureBase64 ? (
              <img src={profile.profilePictureBase64} alt={profile.name} style={S.avatarImg} />
            ) : (
              <div style={S.avatarFallback}>{initials || "ST"}</div>
            )}
          </div>
          <div style={{ minWidth: 0, flex: 1 }}>
            <h1 style={S.title}>{profile.name}</h1>
            <div style={S.metaRow}>
              <span style={S.meta}><Mail size={12} /> {profile.email ?? "No email"}</span>
              <span style={S.meta}><GraduationCap size={12} /> {profile.major ?? "Major not provided"}</span>
              <span style={S.meta}><MapPin size={12} /> {profile.university ?? "University not provided"}</span>
              <span style={S.meta}><BookOpen size={12} /> {profile.year ?? "Year not provided"}</span>
            </div>
          </div>
        </section>

        <section style={{ ...card, ...S.section }}>
          <h2 style={S.sectionTitle}>Academic Info</h2>
          <div style={S.grid}>
            <Cell label="Email" value={profile.email ?? "Not provided"} />
            <Cell label="Faculty" value={profile.faculty ?? "Not provided"} />
            <Cell label="Year" value={profile.year ?? "Not provided"} />
            <Cell label="GPA" value={profile.gpa != null ? String(profile.gpa) : "Not provided"} />
          </div>
        </section>

        <section style={{ ...card, ...S.section }}>
          <h2 style={S.sectionTitle}>Skills</h2>
          {skills.length === 0 ? (
            <p style={S.emptyText}>No skills available.</p>
          ) : (
            <div style={S.tags}>
              {skills.map((skill) => (
                <span key={skill} style={S.tag}>{skill}</span>
              ))}
            </div>
          )}
        </section>

        <section style={{ ...card, ...S.section }}>
          <h2 style={S.sectionTitle}>Projects</h2>
          {projects.length === 0 ? (
            <p style={S.emptyText}>No graduation projects found.</p>
          ) : (
            <div style={S.projectList}>
              {projects.map((p) => (
                <article key={p.id} style={S.projectCard}>
                  <p style={S.projectTitle}>{p.name}</p>
                  <p style={S.projectDesc}>{p.abstract ?? "No abstract provided."}</p>
                  <p style={S.projectMeta}>Team size: {p.teamSize ?? "—"}</p>
                  <div style={S.tags}>
                    {p.requiredSkills.map((skill) => (
                      <span key={`${p.id}-${skill}`} style={S.tag}>{skill}</span>
                    ))}
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function Cell({ label, value }: { label: string; value: string }) {
  return (
    <div style={S.cell}>
      <p style={S.cellLabel}>{label}</p>
      <p style={S.cellValue}>{value}</p>
    </div>
  );
}

const S: Record<string, CSSProperties> = {
  page: { minHeight: "100vh", background: dash.bg, fontFamily: dash.font, padding: 24 },
  container: { maxWidth: 1100, margin: "0 auto", display: "flex", flexDirection: "column", gap: 16 },
  center: { minHeight: "70vh", display: "grid", placeItems: "center", color: dash.muted, fontFamily: dash.font },
  backBtn: {
    width: "fit-content", display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 12px",
    borderRadius: 10, border: `1px solid ${dash.border}`, background: "#fff", color: dash.muted, cursor: "pointer",
    fontWeight: 700, fontFamily: dash.font,
  },
  topCard: { padding: 20, display: "flex", gap: 16, alignItems: "center", flexWrap: "wrap" },
  avatarWrap: { width: 88, height: 88, borderRadius: "50%", overflow: "hidden" },
  avatarImg: { width: "100%", height: "100%", objectFit: "cover" },
  avatarFallback: { width: "100%", height: "100%", background: dash.accent, color: "#fff", display: "grid", placeItems: "center", fontWeight: 800 },
  title: { margin: 0, fontSize: 24, fontWeight: 800, fontFamily: dash.fontDisplay, color: dash.text },
  metaRow: { marginTop: 8, display: "flex", flexWrap: "wrap", gap: 8 },
  meta: { display: "inline-flex", alignItems: "center", gap: 5, fontSize: 12, color: dash.muted, background: "#f8fafc", border: `1px solid ${dash.border}`, borderRadius: 999, padding: "4px 10px" },
  section: { padding: 18 },
  sectionTitle: { margin: "0 0 12px", fontSize: 12, color: dash.subtle, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.08em" },
  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: 10 },
  cell: { border: `1px solid ${dash.border}`, borderRadius: 10, padding: 10, background: "#f8fafc" },
  cellLabel: { margin: 0, fontSize: 11, color: dash.subtle, fontWeight: 700, textTransform: "uppercase" },
  cellValue: { margin: "6px 0 0", fontSize: 13, color: dash.text, fontWeight: 700 },
  tags: { display: "flex", flexWrap: "wrap", gap: 8 },
  tag: { borderRadius: 999, border: "1px solid #c7d2fe", background: "#eef2ff", color: dash.accent, padding: "4px 10px", fontSize: 12, fontWeight: 700 },
  emptyText: { margin: 0, color: dash.subtle, fontSize: 13 },
  projectList: { display: "flex", flexDirection: "column", gap: 10 },
  projectCard: { border: `1px solid ${dash.border}`, borderRadius: 12, padding: 12, background: "#fff" },
  projectTitle: { margin: 0, fontSize: 14, fontWeight: 800, color: dash.text },
  projectDesc: { margin: "8px 0", fontSize: 13, color: dash.muted, lineHeight: 1.55 },
  projectMeta: { margin: "0 0 8px", fontSize: 12, color: dash.subtle, fontWeight: 700 },
};
