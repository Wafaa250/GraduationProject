import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Loader2, MessageSquare, Pencil } from "lucide-react";
import { apiClient } from "../../../api/client";
import { parseApiErrorMessage } from "../../../api/axiosInstance";
import { navigateHome } from "../../../utils/homeNavigation";
import { DoctorHubPageHeader } from "../../components/doctor/hub/DoctorHubPageHeader";
import {
  DoctorProfileView,
  type DoctorPublicCourse,
  type DoctorPublicProject,
} from "../../components/doctor/profile/DoctorProfileView";
import { mapDoctorProfileFromApi, type DoctorProfileViewModel } from "./doctorProfileMappers";
import { Button } from "../../components/ui/button";
import { Alert, AlertDescription } from "../../components/ui/alert";
import "./hub/doctor-hub-theme.css";

export default function DoctorProfilePage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { doctorId } = useParams<{ doctorId?: string }>();
  const [profile, setProfile] = useState<DoctorProfileViewModel | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [publicCourses, setPublicCourses] = useState<DoctorPublicCourse[]>([]);
  const [publicProjects, setPublicProjects] = useState<DoctorPublicProject[]>([]);

  const mode: "me" | "public" = location.pathname === "/doctor/profile" ? "me" : "public";
  const isPublic = mode === "public";

  useEffect(() => {
    if (mode === "public") {
      const id = Number(doctorId);
      if (!Number.isFinite(id) || id <= 0) {
        setError("Invalid doctor profile link.");
        setLoading(false);
        return;
      }
    }

    const fetchProfile = async () => {
      try {
        setLoading(true);
        setError(null);
        const endpoint = mode === "public" ? `/doctors/${doctorId}` : "/me";
        const res = await apiClient.get(endpoint, {
          headers: {
            "Cache-Control": "no-cache",
            Pragma: "no-cache",
          },
        });
        setProfile(mapDoctorProfileFromApi(res.data));

        if (mode === "public") {
          const id = Number(doctorId);
          const [coursesRes, projectsRes] = await Promise.allSettled([
            apiClient.get("/courses", { params: { doctorId: id } }),
            apiClient.get("/graduation-projects", { params: { doctorId: id } }),
          ]);
          setPublicCourses(
            coursesRes.status === "fulfilled" && Array.isArray(coursesRes.value.data)
              ? coursesRes.value.data.map((c: Record<string, unknown>) => ({
                  id: Number(c.courseId ?? c.id ?? 0),
                  name: String(c.name ?? "Course"),
                  code: String(c.code ?? ""),
                  semester: String(c.semester ?? ""),
                }))
              : [],
          );
          setPublicProjects(
            projectsRes.status === "fulfilled" && Array.isArray(projectsRes.value.data)
              ? projectsRes.value.data.map((p: Record<string, unknown>) => ({
                  id: Number(p.id ?? p.projectId ?? 0),
                  name: String(p.name ?? p.title ?? "Project"),
                }))
              : [],
          );
        }
      } catch (err: unknown) {
        setError(parseApiErrorMessage(err) || "Failed to load doctor profile.");
        setPublicCourses([]);
        setPublicProjects([]);
      } finally {
        setLoading(false);
      }
    };

    void fetchProfile();
  }, [location.pathname, location.key, doctorId, mode]);

  const handleMessage = () => {
    if (!profile?.userId || profile.userId <= 0) return;
    navigate(`/messages?userId=${profile.userId}`);
  };

  const loadingUi = (
    <div className="flex flex-col items-center justify-center py-24 text-muted-foreground">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
      <p className="text-sm mt-3">Loading doctor profile…</p>
    </div>
  );

  const errorUi = (
    <div className="max-w-lg mx-auto">
      <Alert variant="destructive">
        <AlertDescription>{error || "Profile not found."}</AlertDescription>
      </Alert>
      <Button
        variant="outline"
        className="mt-4 gap-2"
        onClick={() => (isPublic ? navigate(-1) : navigateHome(navigate))}
      >
        <ArrowLeft className="h-4 w-4" />
        Back
      </Button>
    </div>
  );

  const profileContent =
    profile && !error ? (
      <>
        <DoctorHubPageHeader
          title={isPublic ? profile.fullName : "Profile settings"}
          description={
            isPublic
              ? "Public doctor profile"
              : "How students and collaborators see you across SkillSwap."
          }
          actions={
            isPublic ? (
              <Button size="sm" onClick={handleMessage} className="gap-2">
                <MessageSquare className="h-4 w-4" />
                Message
              </Button>
            ) : (
              <Button size="sm" asChild className="gap-2">
                <Link to="/doctor/edit-profile">
                  <Pencil className="h-4 w-4" />
                  Edit profile
                </Link>
              </Button>
            )
          }
        />
        <DoctorProfileView
          profile={profile}
          isPublic={isPublic}
          publicCourses={publicCourses}
          publicProjects={publicProjects}
        />
      </>
    ) : null;

  if (loading) {
    if (!isPublic) {
      return loadingUi;
    }
    return (
      <div className="doctor-hub min-h-screen px-4 py-8 max-w-5xl mx-auto">{loadingUi}</div>
    );
  }

  if (error || !profile) {
    if (!isPublic) {
      return errorUi;
    }
    return (
      <div className="doctor-hub min-h-screen px-4 py-8 max-w-5xl mx-auto">{errorUi}</div>
    );
  }

  if (!isPublic) {
    return profileContent;
  }

  return (
    <div className="doctor-hub min-h-screen">
      <header className="sticky top-0 z-20 border-b border-border bg-background/80 backdrop-blur">
        <div className="max-w-5xl mx-auto h-14 px-4 flex items-center justify-between">
          <Button variant="ghost" size="sm" className="gap-2" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
        </div>
      </header>
      <main className="px-4 py-6 md:py-8 max-w-5xl mx-auto">{profileContent}</main>
    </div>
  );
}
