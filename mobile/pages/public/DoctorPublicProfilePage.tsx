import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { ArrowLeft, BookOpen, GraduationCap } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { apiClient } from "../../../api/client";

type DoctorDto = Record<string, unknown>;
type CourseDto = Record<string, unknown>;
type ProjectDto = Record<string, unknown>;

type DoctorPublicProfile = {
  id: number;
  name: string;
  email: string;
  specialization: string;
  faculty: string;
};

type PublicCourse = { id: number; name: string; code: string; semester: string };
type PublicProject = { id: number; name: string };

const text = (v: unknown) => (typeof v === "string" ? v.trim() : "");
const num = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? v : null);

function mapDoctor(raw: DoctorDto): DoctorPublicProfile {
  const user = (raw.user ?? raw.User ?? raw) as DoctorDto;
  const profile = (raw.doctorProfile ?? raw.DoctorProfile ?? {}) as DoctorDto;

  return {
    id: num(user.id ?? user.userId ?? user.Id) ?? 0,
    name: text(user.name ?? user.fullName ?? raw.name) || "Doctor",
    email: text(user.email ?? raw.email),
    specialization: text(profile.specialization ?? profile.Specialization ?? raw.specialization),
    faculty: text(profile.faculty ?? profile.Faculty ?? raw.faculty),
  };
}

function mapCourse(raw: CourseDto): PublicCourse {
  return {
    id: num(raw.courseId ?? raw.id ?? raw.Id) ?? 0,
    name: text(raw.name ?? raw.Name) || "Course",
    code: text(raw.code ?? raw.Code),
    semester: text(raw.semester ?? raw.Semester),
  };
}

function mapProject(raw: ProjectDto): PublicProject {
  return {
    id: num(raw.id ?? raw.Id) ?? 0,
    name: text(raw.name ?? raw.title ?? raw.Title) || "Project",
  };
}

export default function DoctorPublicProfilePage() {
  const { doctorId } = useParams<{ doctorId: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [profile, setProfile] = useState<DoctorPublicProfile | null>(null);
  const [courses, setCourses] = useState<PublicCourse[]>([]);
  const [projects, setProjects] = useState<PublicProject[]>([]);

  useEffect(() => {
    if (!doctorId) return;
    let cancelled = false;

    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const [doctorRes, coursesRes, projectsRes] = await Promise.allSettled([
          apiClient.get(`/doctors/${doctorId}`),
          apiClient.get("/courses", { params: { doctorId } }),
          apiClient.get("/graduation-projects", { params: { doctorId } }),
        ]);

        if (cancelled) return;
        if (doctorRes.status !== "fulfilled") throw doctorRes.reason;

        setProfile(mapDoctor((doctorRes.value.data ?? {}) as DoctorDto));
        setCourses(
          coursesRes.status === "fulfilled" && Array.isArray(coursesRes.value.data)
            ? coursesRes.value.data.map((item: CourseDto) => mapCourse(item))
            : [],
        );
        setProjects(
          projectsRes.status === "fulfilled" && Array.isArray(projectsRes.value.data)
            ? projectsRes.value.data.map((item: ProjectDto) => mapProject(item))
            : [],
        );
      } catch (err: unknown) {
        const message =
          (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
          "Failed to load doctor profile.";
        setError(message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void fetchData();
    return () => {
      cancelled = true;
    };
  }, [doctorId]);

  const initials = useMemo(
    () =>
      (profile?.name || "DR")
        .split(" ")
        .map((part) => part[0] ?? "")
        .join("")
        .slice(0, 2)
        .toUpperCase(),
    [profile?.name],
  );

  if (loading) return <div style={S.center}>Loading profile...</div>;

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
            <h1 style={S.name}>{profile.name}</h1>
            <p style={S.email}>{profile.email || "—"}</p>
            {profile.specialization ? (
              <span style={S.badge}>
                <GraduationCap size={12} /> {profile.specialization}
              </span>
            ) : null}
          </div>
        </section>

        <section style={S.card}>
          <h2 style={S.sectionTitle}>About Doctor</h2>
          <p style={S.row}>Specialization: <strong>{profile.specialization || "—"}</strong></p>
          <p style={S.row}>Faculty: <strong>{profile.faculty || "—"}</strong></p>
        </section>

        <section style={S.card}>
          <h2 style={S.sectionTitle}><BookOpen size={14} /> Courses</h2>
          {courses.length === 0 ? (
            <p style={S.muted}>No courses listed.</p>
          ) : (
            <div style={S.list}>
              {courses.map((course) => (
                <article key={`${course.id}-${course.name}`} style={S.itemCard}>
                  <p style={S.itemTitle}>{course.name}</p>
                  <p style={S.itemMeta}>Code: {course.code || "—"}</p>
                  <p style={S.itemMeta}>Semester: {course.semester || "—"}</p>
                </article>
              ))}
            </div>
          )}
        </section>

        <section style={S.card}>
          <h2 style={S.sectionTitle}>Projects</h2>
          {projects.length === 0 ? (
            <p style={S.muted}>No supervised projects found.</p>
          ) : (
            <div style={S.list}>
              {projects.map((project) => (
                <article key={`${project.id}-${project.name}`} style={S.itemCard}>
                  <p style={S.itemTitle}>{project.name}</p>
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
  badge: { display: "inline-flex", alignItems: "center", gap: 4, borderRadius: 999, padding: "4px 10px", background: "#eef2ff", border: "1px solid #c7d2fe", color: "#4f46e5", fontSize: 11, fontWeight: 700 },
  card: { background: "#fff", border: "1px solid #e2e8f0", borderRadius: 14, padding: 16, boxShadow: "0 1px 8px rgba(99,102,241,0.05)" },
  sectionTitle: { margin: "0 0 12px", display: "flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.06em", color: "#475569" },
  row: { margin: "6px 0", fontSize: 13, color: "#475569" },
  list: { display: "flex", flexDirection: "column", gap: 8 },
  itemCard: { border: "1px solid #e2e8f0", borderRadius: 12, padding: 12, background: "#f8fafc" },
  itemTitle: { margin: "0 0 4px", fontSize: 14, fontWeight: 800, color: "#0f172a" },
  itemMeta: { margin: 0, fontSize: 12, color: "#64748b" },
  muted: { margin: 0, fontSize: 12, color: "#94a3b8" },
};
import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { ArrowLeft, BookOpen, GraduationCap } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { apiClient } from "../../../api/client";

type DoctorDto = Record<string, unknown>;
type CourseDto = Record<string, unknown>;
type ProjectDto = Record<string, unknown>;

type DoctorPublicProfile = {
  id: number;
  name: string;
  email: string;
  specialization: string;
  faculty: string;
};

type PublicCourse = { id: number; name: string; code: string; semester: string };
type PublicProject = { id: number; name: string };

const text = (v: unknown) => (typeof v === "string" ? v.trim() : "");
const num = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? v : null);

function mapDoctor(raw: DoctorDto): DoctorPublicProfile {
  const user = (raw.user ?? raw.User ?? raw) as DoctorDto;
  const profile = (raw.doctorProfile ?? raw.DoctorProfile ?? {}) as DoctorDto;

  return {
    id: num(user.id ?? user.userId ?? user.Id) ?? 0,
    name: text(user.name ?? user.fullName ?? raw.name) || "Doctor",
    email: text(user.email ?? raw.email),
    specialization: text(profile.specialization ?? profile.Specialization ?? raw.specialization),
    faculty: text(profile.faculty ?? profile.Faculty ?? raw.faculty),
  };
}

function mapCourse(raw: CourseDto): PublicCourse {
  return {
    id: num(raw.courseId ?? raw.id ?? raw.Id) ?? 0,
    name: text(raw.name ?? raw.Name) || "Course",
    code: text(raw.code ?? raw.Code),
    semester: text(raw.semester ?? raw.Semester),
  };
}

function mapProject(raw: ProjectDto): PublicProject {
  return {
    id: num(raw.id ?? raw.Id) ?? 0,
    name: text(raw.name ?? raw.title ?? raw.Title) || "Project",
  };
}

export default function DoctorPublicProfilePage() {
  const { doctorId } = useParams<{ doctorId: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [profile, setProfile] = useState<DoctorPublicProfile | null>(null);
  const [courses, setCourses] = useState<PublicCourse[]>([]);
  const [projects, setProjects] = useState<PublicProject[]>([]);

  useEffect(() => {
    if (!doctorId) return;
    let cancelled = false;

    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const [doctorRes, coursesRes, projectsRes] = await Promise.allSettled([
          apiClient.get(`/doctors/${doctorId}`),
          apiClient.get("/courses", { params: { doctorId } }),
          apiClient.get("/graduation-projects", { params: { doctorId } }),
        ]);

        if (cancelled) return;
        if (doctorRes.status !== "fulfilled") {
          throw doctorRes.reason;
        }

        setProfile(mapDoctor((doctorRes.value.data ?? {}) as DoctorDto));
        setCourses(
          coursesRes.status === "fulfilled" && Array.isArray(coursesRes.value.data)
            ? coursesRes.value.data.map((item: CourseDto) => mapCourse(item))
            : [],
        );
        setProjects(
          projectsRes.status === "fulfilled" && Array.isArray(projectsRes.value.data)
            ? projectsRes.value.data.map((item: ProjectDto) => mapProject(item))
            : [],
        );
      } catch (err: unknown) {
        const message =
          (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
          "Failed to load doctor profile.";
        setError(message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void fetchData();
    return () => {
      cancelled = true;
    };
  }, [doctorId]);

  const initials = useMemo(
    () =>
      (profile?.name || "DR")
        .split(" ")
        .map((part) => part[0] ?? "")
        .join("")
        .slice(0, 2)
        .toUpperCase(),
    [profile?.name],
  );

  if (loading) return <div style={S.center}>Loading profile...</div>;

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
            <h1 style={S.name}>{profile.name}</h1>
            <p style={S.email}>{profile.email || "—"}</p>
            {profile.specialization ? (
              <span style={S.badge}>
                <GraduationCap size={12} /> {profile.specialization}
              </span>
            ) : null}
          </div>
        </section>

        <section style={S.card}>
          <h2 style={S.sectionTitle}>About Doctor</h2>
          <p style={S.row}>Specialization: <strong>{profile.specialization || "—"}</strong></p>
          <p style={S.row}>Faculty: <strong>{profile.faculty || "—"}</strong></p>
        </section>

        <section style={S.card}>
          <h2 style={S.sectionTitle}><BookOpen size={14} /> Courses</h2>
          {courses.length === 0 ? (
            <p style={S.muted}>No courses listed.</p>
          ) : (
            <div style={S.list}>
              {courses.map((course) => (
                <article key={`${course.id}-${course.name}`} style={S.itemCard}>
                  <p style={S.itemTitle}>{course.name}</p>
                  <p style={S.itemMeta}>Code: {course.code || "—"}</p>
                  <p style={S.itemMeta}>Semester: {course.semester || "—"}</p>
                </article>
              ))}
            </div>
          )}
        </section>

        <section style={S.card}>
          <h2 style={S.sectionTitle}>Projects</h2>
          {projects.length === 0 ? (
            <p style={S.muted}>No supervised projects found.</p>
          ) : (
            <div style={S.list}>
              {projects.map((project) => (
                <article key={`${project.id}-${project.name}`} style={S.itemCard}>
                  <p style={S.itemTitle}>{project.name}</p>
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
  badge: { display: "inline-flex", alignItems: "center", gap: 4, borderRadius: 999, padding: "4px 10px", background: "#eef2ff", border: "1px solid #c7d2fe", color: "#4f46e5", fontSize: 11, fontWeight: 700 },
  card: { background: "#fff", border: "1px solid #e2e8f0", borderRadius: 14, padding: 16, boxShadow: "0 1px 8px rgba(99,102,241,0.05)" },
  sectionTitle: { margin: "0 0 12px", display: "flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.06em", color: "#475569" },
  row: { margin: "6px 0", fontSize: 13, color: "#475569" },
  list: { display: "flex", flexDirection: "column", gap: 8 },
  itemCard: { border: "1px solid #e2e8f0", borderRadius: 12, padding: 12, background: "#f8fafc" },
  itemTitle: { margin: "0 0 4px", fontSize: 14, fontWeight: 800, color: "#0f172a" },
  itemMeta: { margin: 0, fontSize: 12, color: "#64748b" },
  muted: { margin: 0, fontSize: 12, color: "#94a3b8" },
};
import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { ArrowLeft, BookOpen, Mail } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { apiClient } from "../../../api/client";
import { parseApiErrorMessage } from "../../../api/axiosInstance";
import { card, dash } from "../doctor/dashboard/doctorDashTokens";

type DoctorProfile = {
  id: number;
  name: string;
  email: string | null;
  specialization: string | null;
  faculty: string | null;
  profilePictureBase64: string | null;
};

type Course = {
  id: number;
  name: string;
  code: string | null;
  semester: string | null;
};

type Project = {
  id: number;
  name: string;
};

function text(v: unknown): string | null {
  if (typeof v !== "string") return null;
  const t = v.trim();
  return t.length > 0 ? t : null;
}

function mapDoctor(raw: unknown): DoctorProfile {
  const r = (raw ?? {}) as Record<string, unknown>;
  const user = (r.user ?? r.User ?? r) as Record<string, unknown>;
  const dp = (r.doctorProfile ?? r.DoctorProfile ?? r) as Record<string, unknown>;
  const id = Number(user.id ?? user.Id ?? r.id ?? r.Id ?? 0);
  return {
    id: Number.isFinite(id) ? id : 0,
    name: text(user.name ?? user.fullName ?? r.name) ?? "Doctor",
    email: text(user.email ?? r.email),
    specialization: text(dp.specialization ?? r.specialization),
    faculty: text(dp.faculty ?? r.faculty),
    profilePictureBase64: text(user.profilePictureBase64 ?? dp.profilePictureBase64 ?? r.profilePictureBase64),
  };
}

function mapCourses(raw: unknown): Course[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((row) => {
      const r = row as Record<string, unknown>;
      const id = Number(r.id ?? r.Id ?? r.courseId ?? r.CourseId ?? 0);
      if (!Number.isFinite(id) || id <= 0) return null;
      return {
        id,
        name: text(r.name ?? r.Name) ?? "Untitled Course",
        code: text(r.code ?? r.Code),
        semester: text(r.semester ?? r.Semester),
      } as Course;
    })
    .filter((c): c is Course => c !== null);
}

function mapProjects(raw: unknown): Project[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((row) => {
      const r = row as Record<string, unknown>;
      const id = Number(r.id ?? r.Id ?? r.projectId ?? r.ProjectId ?? 0);
      if (!Number.isFinite(id) || id <= 0) return null;
      const name = text(r.name ?? r.Name ?? r.title ?? r.Title);
      if (!name) return null;
      return { id, name } as Project;
    })
    .filter((p): p is Project => p !== null);
}

export default function DoctorPublicProfilePage() {
  const navigate = useNavigate();
  const { doctorId } = useParams<{ doctorId: string }>();
  const id = useMemo(() => (doctorId && /^\d+$/.test(doctorId) ? Number(doctorId) : null), [doctorId]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [profile, setProfile] = useState<DoctorProfile | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);

  useEffect(() => {
    if (id == null) {
      setLoading(false);
      setError("Doctor not found");
      return;
    }

    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const [doctorRes, coursesRes, projectsRes] = await Promise.allSettled([
          apiClient.get(`/doctors/${id}`),
          apiClient.get("/courses", { params: { doctorId: id } }),
          apiClient.get("/graduation-projects", { params: { doctorId: id } }),
        ]);

        if (cancelled) return;
        if (doctorRes.status !== "fulfilled") throw doctorRes.reason;

        setProfile(mapDoctor(doctorRes.value.data));
        setCourses(coursesRes.status === "fulfilled" ? mapCourses(coursesRes.value.data) : []);
        setProjects(projectsRes.status === "fulfilled" ? mapProjects(projectsRes.value.data) : []);
      } catch (err) {
        if (!cancelled) setError(parseApiErrorMessage(err) || "Doctor not found");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (loading) return <div style={S.center}>Loading doctor profile...</div>;
  if (error || !profile) return <div style={S.center}>{error || "Doctor not found"}</div>;

  const initials = profile.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();

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
              <div style={S.avatarFallback}>{initials || "DR"}</div>
            )}
          </div>
          <div style={{ minWidth: 0, flex: 1 }}>
            <h1 style={S.title}>{profile.name}</h1>
            <p style={S.subtitle}>{profile.specialization ?? "Doctor"}</p>
            <p style={S.meta}><Mail size={12} /> {profile.email ?? "No email"}</p>
          </div>
        </section>

        <section style={{ ...card, ...S.section }}>
          <h2 style={S.sectionTitle}>About Doctor</h2>
          <div style={S.grid}>
            <Cell label="Specialization" value={profile.specialization ?? "Not provided"} />
            <Cell label="Faculty" value={profile.faculty ?? "Not provided"} />
          </div>
        </section>

        <section style={{ ...card, ...S.section }}>
          <h2 style={S.sectionTitle}>Courses</h2>
          {courses.length === 0 ? (
            <p style={S.emptyText}>No courses found.</p>
          ) : (
            <div style={S.list}>
              {courses.map((c) => (
                <article key={c.id} style={S.rowCard}>
                  <p style={S.rowTitle}>{c.name}</p>
                  <p style={S.rowMeta}>Code: {c.code ?? "—"}</p>
                  <p style={S.rowMeta}>Semester: {c.semester ?? "—"}</p>
                </article>
              ))}
            </div>
          )}
        </section>

        <section style={{ ...card, ...S.section }}>
          <h2 style={S.sectionTitle}>Projects</h2>
          {projects.length === 0 ? (
            <p style={S.emptyText}>No supervised projects found.</p>
          ) : (
            <ul style={S.projectList}>
              {projects.map((p) => (
                <li key={p.id} style={S.projectItem}>
                  <BookOpen size={14} /> {p.name}
                </li>
              ))}
            </ul>
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
  subtitle: { margin: "6px 0", color: dash.accent, fontWeight: 700, fontSize: 14 },
  meta: { margin: 0, display: "inline-flex", alignItems: "center", gap: 5, fontSize: 12, color: dash.muted },
  section: { padding: 18 },
  sectionTitle: { margin: "0 0 12px", fontSize: 12, color: dash.subtle, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.08em" },
  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: 10 },
  cell: { border: `1px solid ${dash.border}`, borderRadius: 10, padding: 10, background: "#f8fafc" },
  cellLabel: { margin: 0, fontSize: 11, color: dash.subtle, fontWeight: 700, textTransform: "uppercase" },
  cellValue: { margin: "6px 0 0", fontSize: 13, color: dash.text, fontWeight: 700 },
  emptyText: { margin: 0, color: dash.subtle, fontSize: 13 },
  list: { display: "flex", flexDirection: "column", gap: 10 },
  rowCard: { border: `1px solid ${dash.border}`, borderRadius: 10, padding: 12, background: "#fff" },
  rowTitle: { margin: 0, fontSize: 14, color: dash.text, fontWeight: 800 },
  rowMeta: { margin: "6px 0 0", fontSize: 12, color: dash.muted },
  projectList: { margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 8 },
  projectItem: { display: "inline-flex", alignItems: "center", gap: 8, color: dash.text, fontSize: 13 },
};
