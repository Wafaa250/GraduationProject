import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Loader2 } from "lucide-react";
import {
  getDoctorSupervisedProjects,
  resignDoctorSupervision,
  parseApiErrorMessage,
} from "@/api/doctorDashboardApi";
import { mapSupervisedProjectToCard, type DoctorHubProjectCardModel } from "@/lib/doctorHubMappers";
import { ProjectCard } from "@/components/doctor/hub/ProjectCard";
import { DoctorHubSectionEmpty } from "@/components/doctor/hub/DoctorHubSectionEmpty";
import { DoctorHubPageHeader } from "@/components/doctor/hub/DoctorHubPageHeader";
import { ROUTES } from "@/routes/paths";
import { toast } from "@/hooks/use-toast";

export default function DoctorProjectsPage() {
  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState<DoctorHubProjectCardModel[]>([]);
  const [resigningId, setResigningId] = useState<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const rows = await getDoctorSupervisedProjects();
      setProjects(rows.map(mapSupervisedProjectToCard));
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Could not load projects",
        description: parseApiErrorMessage(err),
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const handleResign = async (projectId: number) => {
    if (!confirm("Resign supervision for this project?")) return;
    setResigningId(projectId);
    try {
      await resignDoctorSupervision(projectId);
      toast({ title: "Supervision ended" });
      await load();
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Resign failed",
        description: parseApiErrorMessage(err),
      });
    } finally {
      setResigningId(null);
    }
  };

  return (
    <main className="flex-1 bg-gradient-mesh">
      <div className="px-5 lg:px-8 py-5 max-w-[1200px] mx-auto">
        <DoctorHubPageHeader
          title="Active Projects"
          description="Graduation projects you currently supervise"
        />
        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
          </div>
        ) : projects.length === 0 ? (
          <DoctorHubSectionEmpty message="No supervised projects yet." />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {projects.map((p) => (
              <ProjectCard
                key={p.id}
                p={p}
                onResign={handleResign}
                resigning={resigningId === Number(p.id)}
              />
            ))}
          </div>
        )}
        <p className="mt-6 text-center">
          <Link to={ROUTES.doctorDashboard} className="text-sm font-semibold text-primary hover:underline">
            Back to dashboard
          </Link>
        </p>
      </div>
    </main>
  );
}
