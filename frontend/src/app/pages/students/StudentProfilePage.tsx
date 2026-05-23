import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  ArrowLeft,
  Github,
  Linkedin,
  Globe,
  Star,
  GraduationCap,
  MapPin,
  BookOpen,
  Zap,
  Wrench,
  Languages,
  Loader2,
} from "lucide-react";
import api from "../../../api/axiosInstance";
import { DoctorHubPageHeader } from "../../components/doctor/hub/DoctorHubPageHeader";
import { DoctorSubpageLayout } from "../../components/doctor/hub/DoctorSubpageLayout";
import { Avatar, AvatarFallback, AvatarImage } from "../../components/ui/avatar";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Progress } from "../../components/ui/progress";

interface StudentProfile {
  userId: number;
  profileId: number;
  name: string;
  email: string;
  studentId: string;
  university: string;
  faculty: string;
  major: string;
  academicYear: string;
  gpa: number | null;
  bio: string;
  availability: string;
  lookingFor: string;
  github: string;
  linkedin: string;
  portfolio: string;
  profilePictureBase64: string | null;
  languages: string[];
  roles: string[];
  technicalSkills: string[];
  tools: string[];
  matchScore: number | null;
}

function getRole(): string | null {
  try {
    return localStorage.getItem("role");
  } catch {
    return null;
  }
}

export default function StudentProfilePage() {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const isDoctor = getRole() === "doctor";

  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) return;
    setLoading(true);
    setError(null);
    api
      .get(`/students/${userId}`)
      .then((res) => setProfile(res.data))
      .catch((err) => {
        const msg =
          err?.response?.status === 403
            ? "You do not have permission to view this profile."
            : err?.response?.data?.message || "Student not found.";
        setError(msg);
      })
      .finally(() => setLoading(false));
  }, [userId]);

  const backBar = (
    <Button variant="ghost" size="sm" className="mb-4 -ml-2 gap-2" asChild>
      <Link to="/students">
        <ArrowLeft className="h-4 w-4" />
        {isDoctor ? "Student directory" : "Browse students"}
      </Link>
    </Button>
  );

  if (loading) {
    const loadingUi = (
      <div className="flex flex-col items-center justify-center py-24 text-muted-foreground">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm mt-3">Loading profile…</p>
      </div>
    );
    if (isDoctor) {
      return (
        <DoctorSubpageLayout wide backTo="/students" backLabel="Back to directory">
          {loadingUi}
        </DoctorSubpageLayout>
      );
    }
    return <div className="min-h-screen max-w-4xl mx-auto px-4 py-8">{loadingUi}</div>;
  }

  if (error || !profile) {
    const errorUi = (
      <>
        {backBar}
        <Card>
          <CardContent className="py-12 text-center">
            <p className="font-semibold text-foreground">{error || "Profile not found"}</p>
            <Button className="mt-4" variant="outline" onClick={() => navigate("/students")}>
              Back to students
            </Button>
          </CardContent>
        </Card>
      </>
    );
    if (isDoctor) {
      return (
        <DoctorSubpageLayout wide backTo="/students" backLabel="Back to directory">
          {errorUi}
        </DoctorSubpageLayout>
      );
    }
    return <div className="min-h-screen max-w-4xl mx-auto px-4 py-8">{errorUi}</div>;
  }

  const initials = profile.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const matchScore = profile.matchScore ?? 0;
  const allSkills = [...(profile.roles || []), ...(profile.technicalSkills || [])];

  const content = (
    <>
      {backBar}
      <div className="grid lg:grid-cols-[minmax(280px,320px)_1fr] gap-6 items-start">
        <div className="space-y-4">
          <Card className="overflow-hidden">
            <CardContent className="p-6 flex flex-col items-center text-center relative">
              {profile.matchScore !== null && profile.matchScore > 0 ? (
                <Badge
                  variant="outline"
                  className="absolute top-4 right-4 gap-1 tabular-nums"
                >
                  <Star className="h-3 w-3 fill-amber-500 text-amber-500" />
                  {profile.matchScore}% match
                </Badge>
              ) : null}
              <Avatar className="h-20 w-20 ring-4 ring-accent">
                {profile.profilePictureBase64 ? (
                  <AvatarImage src={profile.profilePictureBase64} alt={profile.name} />
                ) : null}
                <AvatarFallback className="text-lg font-semibold bg-primary text-primary-foreground">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <h1 className="text-xl font-semibold mt-4 mb-2 m-0">{profile.name}</h1>
              <div className="flex flex-wrap gap-2 justify-center mb-3">
                {profile.major ? (
                  <Badge variant="secondary" className="gap-1 font-normal">
                    <GraduationCap className="h-3 w-3" />
                    {profile.major}
                  </Badge>
                ) : null}
                {profile.academicYear ? (
                  <Badge variant="secondary" className="gap-1 font-normal">
                    <BookOpen className="h-3 w-3" />
                    {profile.academicYear}
                  </Badge>
                ) : null}
                {profile.university ? (
                  <Badge variant="secondary" className="gap-1 font-normal">
                    <MapPin className="h-3 w-3" />
                    {profile.university}
                  </Badge>
                ) : null}
                {profile.gpa != null ? (
                  <Badge className="bg-emerald-500/10 text-emerald-700 border-emerald-200 font-normal">
                    GPA {profile.gpa}
                  </Badge>
                ) : null}
              </div>
              {profile.faculty ? (
                <p className="text-xs text-muted-foreground mb-2">{profile.faculty}</p>
              ) : null}
              {profile.studentId ? (
                <p className="text-xs text-muted-foreground mb-2">ID: {profile.studentId}</p>
              ) : null}
              {profile.bio ? (
                <p className="text-sm text-muted-foreground leading-relaxed mb-4">{profile.bio}</p>
              ) : null}
              {(profile.availability || profile.lookingFor) && (
                <div className="w-full space-y-2 text-left mb-4">
                  {profile.availability ? (
                    <div className="flex justify-between gap-2 text-sm rounded-md bg-muted/50 px-3 py-2">
                      <span className="text-muted-foreground">Availability</span>
                      <span className="font-medium text-right">{profile.availability}</span>
                    </div>
                  ) : null}
                  {profile.lookingFor ? (
                    <div className="flex justify-between gap-2 text-sm rounded-md bg-muted/50 px-3 py-2">
                      <span className="text-muted-foreground">Looking for</span>
                      <span className="font-medium text-right">{profile.lookingFor}</span>
                    </div>
                  ) : null}
                </div>
              )}
              <div className="flex flex-wrap gap-2 justify-center">
                {profile.github ? (
                  <Button variant="outline" size="sm" asChild>
                    <a
                      href={
                        profile.github.startsWith("http")
                          ? profile.github
                          : `https://github.com/${profile.github}`
                      }
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Github className="h-4 w-4 mr-1" />
                      GitHub
                    </a>
                  </Button>
                ) : null}
                {profile.linkedin ? (
                  <Button variant="outline" size="sm" asChild>
                    <a
                      href={
                        profile.linkedin.startsWith("http")
                          ? profile.linkedin
                          : `https://linkedin.com/in/${profile.linkedin}`
                      }
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Linkedin className="h-4 w-4 mr-1" />
                      LinkedIn
                    </a>
                  </Button>
                ) : null}
                {profile.portfolio ? (
                  <Button variant="outline" size="sm" asChild>
                    <a
                      href={
                        profile.portfolio.startsWith("http")
                          ? profile.portfolio
                          : `https://${profile.portfolio}`
                      }
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Globe className="h-4 w-4 mr-1" />
                      Portfolio
                    </a>
                  </Button>
                ) : null}
              </div>
            </CardContent>
          </Card>

          {profile.languages?.length > 0 ? (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Languages className="h-4 w-4" />
                  Languages
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex flex-wrap gap-2">
                  {profile.languages.map((l) => (
                    <Badge key={l} variant="secondary">
                      {l}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          ) : null}
        </div>

        <div className="space-y-4">
          {profile.roles?.length > 0 ? (
            <SkillCard title="Specializations" icon={Star} items={profile.roles} tone="primary" />
          ) : null}
          {profile.technicalSkills?.length > 0 ? (
            <SkillCard
              title="Technical skills"
              icon={Zap}
              items={profile.technicalSkills}
              tone="violet"
            />
          ) : null}
          {profile.tools?.length > 0 ? (
            <SkillCard title="Tools & technologies" icon={Wrench} items={profile.tools} tone="cyan" />
          ) : null}

          {profile.matchScore !== null && profile.matchScore > 0 ? (
            <Card className="border-primary/20 bg-primary/5">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Star className="h-4 w-4 text-primary" />
                  Match score
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0 space-y-2">
                <div className="flex items-center gap-3">
                  <Progress value={matchScore} className="flex-1 h-2" />
                  <span className="text-lg font-semibold tabular-nums">{matchScore}%</span>
                </div>
                <p className="text-xs text-muted-foreground mb-0">
                  Based on skill overlap and complementary strengths between your profile and this
                  student.
                </p>
              </CardContent>
            </Card>
          ) : null}

          {allSkills.length === 0 && !profile.bio ? (
            <Card>
              <CardContent className="py-10 text-center text-muted-foreground text-sm">
                This student hasn&apos;t filled in their skills yet.
              </CardContent>
            </Card>
          ) : null}
        </div>
      </div>
    </>
  );

  if (isDoctor) {
    return (
      <DoctorSubpageLayout wide backTo="/students" backLabel="Back to directory">
        <DoctorHubPageHeader title={profile.name} description="Student profile" />
        {content}
      </DoctorSubpageLayout>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/20">
      <div className="max-w-5xl mx-auto px-4 md:px-6 py-6 md:py-8">
        <DoctorHubPageHeader title={profile.name} description="Student profile" />
        {content}
      </div>
    </div>
  );
}

function SkillCard({
  title,
  icon: Icon,
  items,
  tone,
}: {
  title: string;
  icon: typeof Star;
  items: string[];
  tone: "primary" | "violet" | "cyan";
}) {
  const toneClass =
    tone === "violet"
      ? "bg-violet-500/10 text-violet-700 border-violet-200"
      : tone === "cyan"
        ? "bg-cyan-500/10 text-cyan-700 border-cyan-200"
        : "bg-primary/10 text-primary border-primary/20";

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <Icon className="h-4 w-4 text-muted-foreground" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex flex-wrap gap-2">
          {items.map((item) => (
            <Badge key={item} variant="outline" className={toneClass}>
              {item}
            </Badge>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
