import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Loader2, Search } from "lucide-react";
import { listStudents, type StudentDirectoryListItem } from "@/api/studentDirectoryApi";
import { DoctorHubPageHeader } from "@/components/doctor/hub/DoctorHubPageHeader";
import { DoctorHubSectionEmpty } from "@/components/doctor/hub/DoctorHubSectionEmpty";
import { Input } from "@/components/ui/input";
import { doctorStudentPath } from "@/routes/paths";
import { parseApiErrorMessage } from "@/api/axiosInstance";
import { toast } from "@/hooks/use-toast";
import { initialsFromName } from "@/lib/doctorHubMappers";

export default function DoctorStudentsDirectoryPage() {
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [students, setStudents] = useState<StudentDirectoryListItem[]>([]);

  const load = useCallback(async (term: string) => {
    setLoading(true);
    try {
      const rows = await listStudents(term.trim() ? { search: term.trim() } : undefined);
      setStudents(rows);
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Could not load students",
        description: parseApiErrorMessage(err),
      });
      setStudents([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => void load(search), 300);
    return () => window.clearTimeout(timer);
  }, [search, load]);

  const filtered = useMemo(() => students, [students]);

  return (
    <main className="flex-1 bg-gradient-mesh">
      <div className="px-5 lg:px-8 py-5 space-y-6">
        <DoctorHubPageHeader
          title="Students"
          description="Search and review student profiles across the university."
        />

        <div className="relative max-w-xl">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, major, university, or skills…"
            className="pl-9"
          />
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : filtered.length === 0 ? (
          <DoctorHubSectionEmpty
            message={
              search.trim()
                ? "No students found. Try a different name, major, or skill keyword."
                : "Students will appear here when they register on SkillSwap."
            }
          />
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {filtered.map((student) => (
              <li key={student.userId}>
                <Link
                  to={doctorStudentPath(student.userId)}
                  className="block rounded-2xl border border-border bg-card p-4 shadow-card transition-smooth hover:border-primary/30"
                >
                  <div className="flex items-start gap-3">
                    <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-primary/10 text-sm font-bold text-primary">
                      {initialsFromName(student.name)}
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-foreground truncate">{student.name}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {[student.major, student.university].filter(Boolean).join(" · ") || "—"}
                      </p>
                      {student.matchScore != null ? (
                        <p className="mt-1 text-[11px] font-medium text-primary">
                          {student.matchScore}% skill match
                        </p>
                      ) : null}
                    </div>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}
