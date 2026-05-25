import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Pencil, Loader2 } from "lucide-react";
import { getDoctorMe } from "@/api/meApi";
import { parseApiErrorMessage } from "@/api/axiosInstance";
import { DoctorHubPageHeader } from "@/components/doctor/hub/DoctorHubPageHeader";
import { ROUTES } from "@/routes/paths";
import { toast } from "@/hooks/use-toast";

export default function DoctorProfilePage() {
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [department, setDepartment] = useState("");
  const [faculty, setFaculty] = useState("");
  const [specialization, setSpecialization] = useState("");
  const [bio, setBio] = useState("");
  const [photo, setPhoto] = useState<string | null>(null);
  const [technicalSkills, setTechnicalSkills] = useState<string[]>([]);
  const [researchSkills, setResearchSkills] = useState<string[]>([]);

  useEffect(() => {
    void getDoctorMe()
      .then((me) => {
        setName(me.user?.name ?? "");
        setEmail(me.user?.email ?? "");
        const dp = me.doctorProfile;
        setDepartment(dp?.department ?? "");
        setFaculty(dp?.faculty ?? "");
        setSpecialization(dp?.specialization ?? "");
        setBio(dp?.bio ?? "");
        setTechnicalSkills(dp?.technicalSkills ?? []);
        setResearchSkills(dp?.researchSkills ?? []);
        const raw = dp?.profilePictureBase64?.trim() || me.user?.profilePictureBase64?.trim();
        if (raw) setPhoto(raw.startsWith("data:") ? raw : `data:image/jpeg;base64,${raw}`);
      })
      .catch((err) => {
        toast({
          variant: "destructive",
          title: "Could not load profile",
          description: parseApiErrorMessage(err),
        });
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <main className="flex-1 flex items-center justify-center min-h-[40vh]">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </main>
    );
  }

  return (
    <main className="flex-1 bg-gradient-mesh">
      <div className="px-5 lg:px-8 py-5 max-w-3xl mx-auto">
        <DoctorHubPageHeader title="My Profile" description="Your SkillSwap faculty profile" />
        <div className="rounded-2xl border border-border bg-white p-6 shadow-card space-y-6">
          <div className="flex items-start gap-4">
            {photo ? (
              <img src={photo} alt="" className="h-20 w-20 rounded-full object-cover ring-2 ring-primary/20" />
            ) : (
              <div className="h-20 w-20 rounded-full bg-gradient-primary grid place-items-center text-lg font-bold text-primary-foreground">
                {name.slice(0, 2).toUpperCase()}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <h2 className="text-xl font-bold text-foreground">{name}</h2>
              <p className="text-sm text-muted-foreground">{email}</p>
              <p className="text-sm text-muted-foreground mt-1">
                {specialization}
                {department ? ` · ${department}` : ""}
                {faculty ? ` · ${faculty}` : ""}
              </p>
            </div>
            <Link
              to={ROUTES.doctorEditProfile}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground hover:brightness-110"
            >
              <Pencil className="h-4 w-4" /> Edit
            </Link>
          </div>
          {bio && (
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                Bio
              </h3>
              <p className="text-sm text-foreground/90">{bio}</p>
            </div>
          )}
          {technicalSkills.length > 0 && (
            <SkillBlock title="Technical skills" skills={technicalSkills} />
          )}
          {researchSkills.length > 0 && <SkillBlock title="Research skills" skills={researchSkills} />}
        </div>
      </div>
    </main>
  );
}

function SkillBlock({ title, skills }: { title: string; skills: string[] }) {
  return (
    <div>
      <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
        {title}
      </h3>
      <div className="flex flex-wrap gap-1.5">
        {skills.map((s) => (
          <span
            key={s}
            className="rounded-md bg-secondary px-2 py-0.5 text-xs font-medium border border-border"
          >
            {s}
          </span>
        ))}
      </div>
    </div>
  );
}
