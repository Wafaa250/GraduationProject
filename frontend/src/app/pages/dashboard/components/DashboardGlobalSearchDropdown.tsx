import { useNavigate } from "react-router-dom";
import type { GlobalSearchResponse } from "../dashboardSearchTypes";

type Props = {
  loading: boolean;
  results: GlobalSearchResponse | null;
  onNavigate: () => void;
};

export function DashboardGlobalSearchDropdown({ loading, results, onNavigate }: Props) {
  const navigate = useNavigate();

  if (loading) {
    return <p className="text-sm text-muted-foreground px-2 py-3">Searching...</p>;
  }

  const students = results?.students ?? [];
  const doctors = results?.doctors ?? [];

  if (students.length === 0 && doctors.length === 0) {
    return <p className="text-sm text-muted-foreground px-2 py-3">No results found</p>;
  }

  return (
    <>
      <div className="mb-2">
        <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground px-2 mb-1">
          Students
        </p>
        {students.length === 0 ? (
          <p className="text-xs text-muted-foreground px-2 py-1">No students</p>
        ) : (
          students.map((student) => (
            <button
              key={`gs-st-${student.id}`}
              type="button"
              className="w-full text-left px-2 py-2 rounded-lg hover:bg-muted transition-colors"
              onClick={() => {
                navigate(`/students/${student.id}`);
                onNavigate();
              }}
            >
              <span className="block text-sm font-semibold text-foreground">{student.name}</span>
              <span className="block text-xs text-muted-foreground">
                {student.major || student.email}
              </span>
            </button>
          ))
        )}
      </div>
      <div>
        <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground px-2 mb-1">
          Doctors
        </p>
        {doctors.length === 0 ? (
          <p className="text-xs text-muted-foreground px-2 py-1">No doctors</p>
        ) : (
          doctors.map((doctor) => (
            <button
              key={`gs-dr-${doctor.id}`}
              type="button"
              className="w-full text-left px-2 py-2 rounded-lg hover:bg-muted transition-colors"
              onClick={() => {
                navigate(`/doctors/${doctor.id}`);
                onNavigate();
              }}
            >
              <span className="block text-sm font-semibold text-foreground">{doctor.name}</span>
              <span className="block text-xs text-muted-foreground">
                {doctor.specialization || doctor.email}
              </span>
            </button>
          ))
        )}
      </div>
    </>
  );
}
