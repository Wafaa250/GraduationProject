import { useState, useEffect, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Search, ArrowLeft, SlidersHorizontal, X, Users, Star } from 'lucide-react'
import api from '../../../api/axiosInstance'

// ─── Types ────────────────────────────────────────────────────────────────────

interface Student {
  userId:         number
  profileId:      number
  name:           string
  university:     string
  major:          string
  academicYear:   string
  skills:         string[]
  matchScore:     number
  profilePicture: string | null
}

interface Filters {
  universities: string[]
  majors:       string[]
  skills:       string[]
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function StudentsPage() {
  const navigate = useNavigate()

  const [students, setStudents]       = useState<Student[]>([])
  const [filters, setFilters]         = useState<Filters>({ universities: [], majors: [], skills: [] })
  const [loading, setLoading]         = useState(true)
  const [filtersOpen, setFiltersOpen] = useState(false)

  // Active filter values
  const [search,     setSearch]     = useState('')
  const [university, setUniversity] = useState('')
  const [major,      setMajor]      = useState('')
  const [skill,      setSkill]      = useState('')

  // ── جلب الفلاتر المتاحة عند التحميل ──────────────────────────────────────
  useEffect(() => {
    api.get('/students/filters')
      .then(res => setFilters(res.data))
      .catch(() => {})
  }, [])

  // ── جلب الطلاب مع الفلاتر ────────────────────────────────────────────────
  const fetchStudents = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (search)     params.set('search',     search)
      if (university) params.set('university', university)
      if (major)      params.set('major',      major)
      if (skill)      params.set('skill',      skill)

      const res = await api.get(`/students?${params.toString()}`)
      setStudents(res.data)
    } catch {
      setStudents([])
    } finally {
      setLoading(false)
    }
  }, [search, university, major, skill])

  useEffect(() => {
    const timer = setTimeout(fetchStudents, 300) // debounce الـ search
    return () => clearTimeout(timer)
  }, [fetchStudents])

  const clearFilters = () => {
    setSearch('')
    setUniversity('')
    setMajor('')
    setSkill('')
  }

  const hasActiveFilters = search || university || major || skill
  const activeCount = [university, major, skill].filter(Boolean).length

  return (
    <div style={S.page}>
      <BgDecor />

      {/* ── NAV ── */}
      <nav style={S.nav}>
        <div style={S.navInner}>
          <button onClick={() => navigate('/dashboard')} style={S.backBtn}>
            <ArrowLeft size={15} /> Dashboard
          </button>
          <div style={S.navLogo}>
            <div style={S.logoIcon}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"
                  stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <span style={S.logoText}>Skill<span style={S.logoAccent}>Swap</span></span>
          </div>
          <Link to="/dashboard" style={{ ...S.backBtn, marginLeft: 'auto', textDecoration: 'none' }}>
            <Users size={14} /> My Dashboard
          </Link>
        </div>
      </nav>

      <div style={S.content}>

        {/* ── HEADER ── */}
        <div style={S.header}>
          <div>
            <h1 style={S.title}>Browse Students</h1>
            <p style={S.subtitle}>
              {loading ? 'Loading...' : `${students.length} student${students.length !== 1 ? 's' : ''} found`}
              {hasActiveFilters && ' · Filters active'}
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {hasActiveFilters && (
              <button onClick={clearFilters} style={S.clearBtn}>
                <X size={13} /> Clear all
              </button>
            )}
            <button
              onClick={() => setFiltersOpen(o => !o)}
              style={{ ...S.filterToggle, ...(filtersOpen ? S.filterToggleActive : {}) }}
            >
              <SlidersHorizontal size={14} />
              Filters
              {activeCount > 0 && (
                <span style={S.filterBadge}>{activeCount}</span>
              )}
            </button>
          </div>
        </div>

        {/* ── SEARCH ── */}
        <div style={S.searchWrap}>
          <Search size={15} style={S.searchIcon} />
          <input
            style={S.searchInput}
            placeholder="Search by name..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          {search && (
            <button onClick={() => setSearch('')} style={S.searchClear}>
              <X size={13} />
            </button>
          )}
        </div>

        {/* ── FILTER PANEL ── */}
        {filtersOpen && (
          <div style={S.filterPanel}>
            <div style={S.filterGrid}>

              {/* University */}
              <div>
                <label style={S.filterLabel}>University</label>
                <select
                  style={S.select}
                  value={university}
                  onChange={e => setUniversity(e.target.value)}
                >
                  <option value="">All universities</option>
                  {filters.universities.map(u => (
                    <option key={u} value={u}>{u}</option>
                  ))}
                </select>
              </div>

              {/* Major */}
              <div>
                <label style={S.filterLabel}>Major</label>
                <select
                  style={S.select}
                  value={major}
                  onChange={e => setMajor(e.target.value)}
                >
                  <option value="">All majors</option>
                  {filters.majors.map(m => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>

              {/* Skill */}
              <div>
                <label style={S.filterLabel}>Skill</label>
                <select
                  style={S.select}
                  value={skill}
                  onChange={e => setSkill(e.target.value)}
                >
                  <option value="">All skills</option>
                  {filters.skills.map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

            </div>
          </div>
        )}

        {/* ── ACTIVE FILTER CHIPS ── */}
        {hasActiveFilters && (
          <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: 6, marginBottom: 16 }}>
            {university && (
              <span style={S.chip}>
                🏛 {university}
                <button onClick={() => setUniversity('')} style={S.chipX}>×</button>
              </span>
            )}
            {major && (
              <span style={S.chip}>
                📚 {major}
                <button onClick={() => setMajor('')} style={S.chipX}>×</button>
              </span>
            )}
            {skill && (
              <span style={S.chip}>
                ⚡ {skill}
                <button onClick={() => setSkill('')} style={S.chipX}>×</button>
              </span>
            )}
          </div>
        )}

        {/* ── STUDENTS GRID ── */}
        {loading ? (
          <div style={S.loadingWrap}>
            <div style={S.spinner} />
            <p style={{ fontSize: 13, color: '#94a3b8', marginTop: 12 }}>Finding students...</p>
          </div>
        ) : students.length === 0 ? (
          <div style={S.emptyWrap}>
            <span style={{ fontSize: 40 }}>🔍</span>
            <p style={{ fontSize: 16, fontWeight: 700, color: '#475569', margin: '8px 0 4px' }}>No students found</p>
            <p style={{ fontSize: 13, color: '#94a3b8', margin: 0 }}>Try adjusting your filters or search</p>
            {hasActiveFilters && (
              <button onClick={clearFilters} style={{ ...S.clearBtn, marginTop: 12 }}>
                Clear filters
              </button>
            )}
          </div>
        ) : (
          <div style={S.grid}>
            {students.map(student => (
              <StudentCard
                key={student.userId}
                student={student}
                onView={() => navigate(`/students/${student.userId}`)}
              />
            ))}
          </div>
        )}

      </div>

      <style>{`
        select:focus, input:focus { outline: none; border-color: #6366f1 !important; box-shadow: 0 0 0 3px rgba(99,102,241,0.1); }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
        .student-card { animation: fadeUp 0.3s ease forwards; }
        .student-card:hover { transform: translateY(-2px) !important; box-shadow: 0 8px 28px rgba(99,102,241,0.12) !important; }
      `}</style>
    </div>
  )
}

// ─── Student Card ─────────────────────────────────────────────────────────────

function StudentCard({ student, onView }: { student: Student; onView: () => void }) {
  const initials = student.name
    .split(' ')
    .map(n => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  const scoreColor =
    student.matchScore >= 70 ? '#16a34a' :
    student.matchScore >= 40 ? '#d97706' : '#64748b'

  const scoreBg =
    student.matchScore >= 70 ? '#f0fdf4' :
    student.matchScore >= 40 ? '#fffbeb' : '#f8fafc'

  const scoreBorder =
    student.matchScore >= 70 ? '#bbf7d0' :
    student.matchScore >= 40 ? '#fde68a' : '#e2e8f0'

  return (
    <div className="student-card" style={S.card}>
      {/* Match score badge */}
      {student.matchScore > 0 && (
        <div style={{ ...S.scoreBadge, background: scoreBg, border: `1px solid ${scoreBorder}`, color: scoreColor }}>
          <Star size={10} fill={scoreColor} />
          <span style={{ fontSize: 11, fontWeight: 800 }}>{student.matchScore}%</span>
        </div>
      )}

      {/* Avatar */}
      <div style={S.avatarWrap}>
        {student.profilePicture ? (
          <img
            src={student.profilePicture}
            alt={student.name}
            style={{ width: '100%', height: '100%', objectFit: 'cover' as const, borderRadius: '50%' }}
          />
        ) : (
          <div style={S.avatarFallback}>{initials}</div>
        )}
      </div>

      {/* Info */}
      <div style={{ flex: 1 }}>
        <p style={{ fontSize: 15, fontWeight: 700, color: '#0f172a', margin: '0 0 2px' }}>
          {student.name}
        </p>
        <p style={{ fontSize: 12, color: '#64748b', margin: '0 0 2px', fontWeight: 500 }}>
          {student.major || '—'}
        </p>
        {student.university && (
          <p style={{ fontSize: 11, color: '#94a3b8', margin: '0 0 8px' }}>
            🏛 {student.university}
            {student.academicYear && ` · ${student.academicYear}`}
          </p>
        )}

        {/* Skills */}
        {student.skills.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: 4 }}>
            {student.skills.slice(0, 4).map(sk => (
              <span key={sk} style={S.skillChip}>{sk}</span>
            ))}
            {student.skills.length > 4 && (
              <span style={{ ...S.skillChip, background: '#f8fafc', color: '#94a3b8', borderColor: '#e2e8f0' }}>
                +{student.skills.length - 4}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Action */}
      <button onClick={onView} style={S.viewBtn}>
        View Profile
      </button>
    </div>
  )
}

// ─── Background ───────────────────────────────────────────────────────────────

function BgDecor() {
  return (
    <>
      <div style={{ position: 'fixed' as const, top: -150, right: -150, width: 500, height: 500, borderRadius: '50%', background: 'radial-gradient(circle,rgba(99,102,241,0.07) 0%,transparent 70%)', pointerEvents: 'none' as const, zIndex: 0 }} />
      <div style={{ position: 'fixed' as const, bottom: -100, left: -100, width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle,rgba(168,85,247,0.05) 0%,transparent 70%)', pointerEvents: 'none' as const, zIndex: 0 }} />
    </>
  )
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const S: Record<string, React.CSSProperties> = {
  page:              { minHeight: '100vh', background: 'linear-gradient(155deg,#f8f7ff 0%,#f0f4ff 40%,#faf5ff 100%)', fontFamily: 'DM Sans, sans-serif', color: '#0f172a', position: 'relative' },
  nav:               { position: 'sticky', top: 0, zIndex: 100, background: 'rgba(248,247,255,0.9)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(99,102,241,0.1)' },
  navInner:          { maxWidth: 1100, margin: '0 auto', padding: '0 24px', height: 58, display: 'flex', alignItems: 'center', gap: 12 },
  navLogo:           { display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none', flex: 1, justifyContent: 'center' },
  logoIcon:          { width: 30, height: 30, borderRadius: 8, background: 'linear-gradient(135deg,#6366f1,#a855f7)', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  logoText:          { fontSize: 16, fontWeight: 800, color: '#0f172a', fontFamily: 'Syne, sans-serif' },
  logoAccent:        { background: 'linear-gradient(135deg,#6366f1,#a855f7)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' },
  backBtn:           { display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', background: 'white', border: '1.5px solid #e2e8f0', borderRadius: 9, fontSize: 12, fontWeight: 600, color: '#64748b', cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap' as const },
  content:           { maxWidth: 1100, margin: '0 auto', padding: '28px 24px 60px', position: 'relative', zIndex: 1 },
  header:            { display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20 },
  title:             { fontSize: 26, fontWeight: 800, color: '#0f172a', margin: '0 0 4px', fontFamily: 'Syne, sans-serif', letterSpacing: '-0.5px' },
  subtitle:          { fontSize: 13, color: '#94a3b8', margin: 0, fontWeight: 500 },
  clearBtn:          { display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px', background: 'white', border: '1.5px solid #fca5a5', borderRadius: 8, fontSize: 12, fontWeight: 600, color: '#ef4444', cursor: 'pointer', fontFamily: 'inherit' },
  filterToggle:      { display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', background: 'white', border: '1.5px solid #e2e8f0', borderRadius: 9, fontSize: 12, fontWeight: 700, color: '#64748b', cursor: 'pointer', fontFamily: 'inherit', position: 'relative' as const },
  filterToggleActive:{ background: '#eef2ff', borderColor: '#c7d2fe', color: '#6366f1' },
  filterBadge:       { position: 'absolute' as const, top: -6, right: -6, width: 16, height: 16, borderRadius: '50%', background: 'linear-gradient(135deg,#6366f1,#a855f7)', color: 'white', fontSize: 9, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  searchWrap:        { position: 'relative' as const, marginBottom: 14 },
  searchIcon:        { position: 'absolute' as const, left: 14, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', pointerEvents: 'none' as const },
  searchInput:       { width: '100%', padding: '11px 40px', background: 'white', border: '1.5px solid #e2e8f0', borderRadius: 12, fontSize: 14, color: '#0f172a', boxSizing: 'border-box' as const, fontFamily: 'inherit', transition: 'all 0.2s' },
  searchClear:       { position: 'absolute' as const, right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', display: 'flex', alignItems: 'center' },
  filterPanel:       { background: 'white', border: '1.5px solid #e2e8f0', borderRadius: 14, padding: '18px 20px', marginBottom: 14, boxShadow: '0 4px 16px rgba(99,102,241,0.06)' },
  filterGrid:        { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 },
  filterLabel:       { display: 'block', fontSize: 11, fontWeight: 700, color: '#64748b', marginBottom: 6, textTransform: 'uppercase' as const, letterSpacing: '0.06em' },
  select:            { width: '100%', padding: '9px 12px', background: 'white', border: '1.5px solid #e2e8f0', borderRadius: 9, fontSize: 13, color: '#334155', cursor: 'pointer', fontFamily: 'inherit', boxSizing: 'border-box' as const },
  chip:              { display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 10px', background: '#eef2ff', border: '1px solid #c7d2fe', borderRadius: 20, fontSize: 12, color: '#6366f1', fontWeight: 600 },
  chipX:             { background: 'none', border: 'none', cursor: 'pointer', color: '#a5b4fc', fontSize: 14, lineHeight: 1, padding: 0, fontFamily: 'inherit' },
  grid:              { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 14 },
  card:              { display: 'flex', alignItems: 'flex-start', gap: 14, padding: '18px', background: 'white', border: '1px solid #e2e8f0', borderRadius: 16, boxShadow: '0 2px 8px rgba(99,102,241,0.04)', position: 'relative' as const, transition: 'all 0.2s', cursor: 'default' },
  scoreBadge:        { position: 'absolute' as const, top: 14, right: 14, display: 'flex', alignItems: 'center', gap: 4, padding: '3px 8px', borderRadius: 20 },
  avatarWrap:        { width: 48, height: 48, borderRadius: '50%', flexShrink: 0, overflow: 'hidden' },
  avatarFallback:    { width: '100%', height: '100%', background: 'linear-gradient(135deg,#6366f1,#a855f7)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 800, color: 'white' },
  skillChip:         { padding: '3px 9px', background: '#eef2ff', border: '1px solid #c7d2fe', borderRadius: 20, fontSize: 10, color: '#6366f1', fontWeight: 600 },
  viewBtn:           { marginLeft: 'auto', flexShrink: 0, padding: '7px 14px', background: 'linear-gradient(135deg,#6366f1,#a855f7)', color: 'white', border: 'none', borderRadius: 9, fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', alignSelf: 'center' as const },
  loadingWrap:       { display: 'flex', flexDirection: 'column' as const, alignItems: 'center', justifyContent: 'center', padding: '80px 0' },
  spinner:           { width: 32, height: 32, borderRadius: '50%', border: '3px solid #e2e8f0', borderTopColor: '#6366f1', animation: 'spin 0.8s linear infinite' },
  emptyWrap:         { display: 'flex', flexDirection: 'column' as const, alignItems: 'center', justifyContent: 'center', padding: '80px 0', textAlign: 'center' as const },
}
