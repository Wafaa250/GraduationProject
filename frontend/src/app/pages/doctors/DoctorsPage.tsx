import { useCallback, useEffect, useState, type CSSProperties } from "react";
import { ArrowLeft, Search } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { apiClient } from "../../../api/client";
import { parseApiErrorMessage } from "../../../api/axiosInstance";
import { navigateHome } from "../../../utils/homeNavigation";
import ProfileLink from "../../components/common/ProfileLink";

type DoctorItem = {
  userId: number;
  profileId: number;
  name: string;
  email: string;
  specialization: string;
  faculty: string;
  university: string;
  coursesCount: number;
};

export default function DoctorsPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [doctors, setDoctors] = useState<DoctorItem[]>([]);

  const fetchDoctors = useCallback(async (queryText: string) => {
    setLoading(true);
    setError(null);
    try {
      const q = queryText.trim();
      const res = await apiClient.get<DoctorItem[]>("/doctors", {
        params: q ? { search: q } : {},
      });
      setDoctors(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      setError(parseApiErrorMessage(err));
      setDoctors([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      void fetchDoctors(search);
    }, 300);
    return () => clearTimeout(timer);
  }, [search, fetchDoctors]);

  return (
    <div style={S.page}>
      <div style={S.nav}>
        <button type="button" onClick={() => navigateHome(navigate)} style={S.backBtn}>
          <ArrowLeft size={15} /> Dashboard
        </button>
      </div>

      <div style={S.content}>
        <h1 style={S.title}>Browse Doctors</h1>
        <p style={S.subtitle}>
          {loading ? "Loading..." : `${doctors.length} doctor${doctors.length === 1 ? "" : "s"} found`}
        </p>

        <div style={S.searchWrap}>
          <Search size={15} style={S.searchIcon} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, email, specialization, faculty, course..."
            style={S.searchInput}
          />
        </div>

        {error ? <p style={S.error}>{error}</p> : null}

        {loading ? (
          <div style={S.stateWrap}>Loading doctors...</div>
        ) : doctors.length === 0 ? (
          <div style={S.stateWrap}>No doctors found.</div>
        ) : (
          <div style={S.grid}>
            {doctors.map((doctor) => (
              <article key={doctor.profileId} style={S.card}>
                <div style={S.avatar}>
                  {(doctor.name || "DR")
                    .split(" ")
                    .map((p) => p[0] || "")
                    .join("")
                    .slice(0, 2)
                    .toUpperCase()}
                </div>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <p style={S.name}>
                    <ProfileLink userId={doctor.userId} role="doctor" style={{ color: "#0f172a" }}>
                      {doctor.name || "Doctor"}
                    </ProfileLink>
                  </p>
                  <p style={S.meta}>{doctor.email || "—"}</p>
                  <p style={S.meta}>{doctor.specialization || "Specialization not provided"}</p>
                  <p style={S.meta}>
                    {doctor.faculty || "Faculty not provided"}
                    {doctor.university ? ` · ${doctor.university}` : ""}
                  </p>
                  <span style={S.badge}>{doctor.coursesCount ?? 0} courses</span>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

const S: Record<string, CSSProperties> = {
  page: {
    minHeight: "100vh",
    background: "linear-gradient(155deg,#f8f7ff 0%,#f0f4ff 40%,#faf5ff 100%)",
    fontFamily: "DM Sans, sans-serif",
  },
  nav: {
    position: "sticky",
    top: 0,
    zIndex: 20,
    padding: "12px 20px",
    background: "rgba(248,247,255,0.9)",
    borderBottom: "1px solid #e2e8f0",
  },
  backBtn: {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    border: "1px solid #e2e8f0",
    background: "#fff",
    borderRadius: 9,
    padding: "7px 12px",
    fontSize: 12,
    fontWeight: 700,
    color: "#64748b",
    cursor: "pointer",
    fontFamily: "inherit",
  },
  content: { maxWidth: 1100, margin: "0 auto", padding: "22px 24px 48px" },
  title: { margin: 0, fontSize: 26, fontWeight: 800, color: "#0f172a", fontFamily: "Syne, sans-serif" },
  subtitle: { margin: "6px 0 16px", color: "#94a3b8", fontSize: 13 },
  searchWrap: { position: "relative", marginBottom: 18 },
  searchIcon: { position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#94a3b8" },
  searchInput: {
    width: "100%",
    boxSizing: "border-box",
    border: "1.5px solid #e2e8f0",
    borderRadius: 12,
    background: "#fff",
    fontSize: 14,
    padding: "11px 12px 11px 38px",
    fontFamily: "inherit",
  },
  error: { margin: "0 0 12px", color: "#b91c1c", fontWeight: 600, fontSize: 13 },
  stateWrap: {
    border: "1px dashed #cbd5e1",
    borderRadius: 12,
    background: "#f8fafc",
    padding: "26px 18px",
    fontSize: 13,
    color: "#64748b",
    textAlign: "center",
  },
  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(320px,1fr))", gap: 14 },
  card: {
    border: "1px solid #e2e8f0",
    borderRadius: 14,
    background: "#fff",
    padding: 14,
    display: "flex",
    gap: 12,
    alignItems: "flex-start",
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: "50%",
    background: "linear-gradient(135deg,#6366f1,#a855f7)",
    color: "#fff",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: 800,
    fontSize: 13,
    flexShrink: 0,
  },
  name: { margin: "0 0 3px", fontSize: 15, fontWeight: 800, color: "#0f172a" },
  meta: { margin: "0 0 4px", fontSize: 12, color: "#64748b" },
  badge: {
    display: "inline-flex",
    alignItems: "center",
    gap: 5,
    marginTop: 3,
    padding: "4px 10px",
    borderRadius: 999,
    background: "#eef2ff",
    border: "1px solid #c7d2fe",
    color: "#4f46e5",
    fontSize: 11,
    fontWeight: 700,
  },
};
