import type { ReactNode } from "react";
import {
  BriefcaseBusiness,
  Building2,
  Clock3,
  GraduationCap,
  Linkedin,
  Mail,
  ShieldCheck,
  Sparkles,
  Wrench,
} from "lucide-react";
import {
  displayProfileValue,
  doctorProfileInitials,
  type DoctorProfileViewModel,
} from "../../../pages/doctor/doctorProfileMappers";
import { Avatar, AvatarFallback, AvatarImage } from "../../ui/avatar";
import { Badge } from "../../ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "../../ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../ui/tabs";

export type DoctorPublicCourse = { id: number; name: string; code: string; semester: string };
export type DoctorPublicProject = { id: number; name: string };

type Props = {
  profile: DoctorProfileViewModel;
  isPublic: boolean;
  publicCourses?: DoctorPublicCourse[];
  publicProjects?: DoctorPublicProject[];
};

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-muted/30 px-3 py-2.5">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground m-0">
        {label}
      </p>
      <p className="text-sm font-medium text-foreground mt-1 m-0">{displayProfileValue(value)}</p>
    </div>
  );
}

function ContactItem({
  icon,
  label,
  value,
  isLink = false,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  isLink?: boolean;
}) {
  if (!value?.trim()) return null;
  const href = value.startsWith("http") ? value : isLink ? `https://${value}` : value;
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 rounded-lg border border-border bg-muted/30 px-3 py-2.5">
      <span className="inline-flex items-center gap-2 text-xs font-semibold text-muted-foreground">
        {icon}
        {label}
      </span>
      {isLink ? (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm font-medium text-primary hover:underline truncate"
        >
          {value}
        </a>
      ) : (
        <span className="text-sm font-medium text-foreground truncate">{value}</span>
      )}
    </div>
  );
}

function SkillBadges({ items, variant }: { items: string[]; variant: "tech" | "research" }) {
  if (items.length === 0) {
    return <p className="text-sm text-muted-foreground m-0">—</p>;
  }
  return (
    <div className="flex flex-wrap gap-2">
      {items.map((skill) => (
        <Badge
          key={skill}
          variant={variant === "tech" ? "secondary" : "outline"}
          className="text-xs"
        >
          {skill}
        </Badge>
      ))}
    </div>
  );
}

function AboutSections({ profile }: { profile: DoctorProfileViewModel }) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Academic information
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-2 sm:grid-cols-2">
          <InfoItem label="Faculty" value={profile.faculty} />
          <InfoItem label="Department" value={profile.department} />
          <InfoItem label="Specialization" value={profile.specialization} />
          <InfoItem
            label="Experience"
            value={
              profile.yearsOfExperience ? `${profile.yearsOfExperience} years` : ""
            }
          />
          <InfoItem label="University" value={profile.university} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Contact & social
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <ContactItem icon={<Mail className="h-3.5 w-3.5" />} label="Email" value={profile.email} />
          <ContactItem
            icon={<Linkedin className="h-3.5 w-3.5" />}
            label="LinkedIn"
            value={profile.linkedin}
            isLink
          />
          <ContactItem
            icon={<Clock3 className="h-3.5 w-3.5" />}
            label="Office hours"
            value={profile.officeHours}
          />
        </CardContent>
      </Card>

      <Card className="md:col-span-2">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold uppercase tracking-wide text-muted-foreground inline-flex items-center gap-2">
            <Wrench className="h-4 w-4" />
            Technical skills
          </CardTitle>
        </CardHeader>
        <CardContent>
          <SkillBadges items={profile.technicalSkills} variant="tech" />
        </CardContent>
      </Card>

      <Card className="md:col-span-2">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold uppercase tracking-wide text-muted-foreground inline-flex items-center gap-2">
            <Sparkles className="h-4 w-4" />
            Research interests
          </CardTitle>
        </CardHeader>
        <CardContent>
          <SkillBadges items={profile.researchSkills} variant="research" />
        </CardContent>
      </Card>
    </div>
  );
}

export function DoctorProfileView({
  profile,
  isPublic,
  publicCourses = [],
  publicProjects = [],
}: Props) {
  const initials = doctorProfileInitials(profile.fullName);

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <Card className="overflow-hidden border-primary/10">
        <CardContent className="p-6 flex flex-col sm:flex-row gap-6 items-start sm:items-center">
          <Avatar className="h-24 w-24 border-4 border-background shadow-md">
            {profile.profilePictureBase64 ? (
              <AvatarImage src={profile.profilePictureBase64} alt={profile.fullName} />
            ) : null}
            <AvatarFallback className="bg-primary text-primary-foreground text-2xl font-bold">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <Badge variant="secondary" className="mb-2 gap-1">
              <ShieldCheck className="h-3 w-3" />
              Doctor
            </Badge>
            <h2 className="text-2xl font-semibold tracking-tight m-0 truncate">
              {profile.fullName || "Doctor"}
            </h2>
            <p className="text-sm text-primary font-medium mt-1 m-0">
              {displayProfileValue(profile.specialization || profile.title)}
            </p>
            <div className="flex flex-wrap gap-2 mt-3">
              <Badge variant="outline" className="gap-1 font-normal">
                <Building2 className="h-3 w-3" />
                {displayProfileValue(profile.department)}
              </Badge>
              <Badge variant="outline" className="gap-1 font-normal">
                <BriefcaseBusiness className="h-3 w-3" />
                {displayProfileValue(profile.university)}
              </Badge>
              {profile.faculty ? (
                <Badge variant="outline" className="gap-1 font-normal">
                  <GraduationCap className="h-3 w-3" />
                  {profile.faculty}
                </Badge>
              ) : null}
            </div>
            {profile.bio?.trim() ? (
              <p className="text-sm text-muted-foreground mt-4 mb-0 leading-relaxed">
                {profile.bio}
              </p>
            ) : null}
          </div>
        </CardContent>
      </Card>

      {isPublic ? (
        <Tabs defaultValue="about">
          <TabsList className="flex-wrap h-auto">
            <TabsTrigger value="about">About</TabsTrigger>
            <TabsTrigger value="courses">Courses</TabsTrigger>
            <TabsTrigger value="projects">Projects</TabsTrigger>
          </TabsList>
          <TabsContent value="about" className="mt-4">
            <AboutSections profile={profile} />
          </TabsContent>
          <TabsContent value="courses" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Courses</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {publicCourses.length === 0 ? (
                  <p className="text-sm text-muted-foreground m-0">No courses listed.</p>
                ) : (
                  publicCourses.map((course) => (
                    <div
                      key={course.id}
                      className="rounded-lg border border-border px-3 py-2.5"
                    >
                      <p className="font-medium text-sm m-0">{course.name}</p>
                      <p className="text-xs text-muted-foreground mt-0.5 m-0">
                        {course.code || "—"}
                        {course.semester ? ` · ${course.semester}` : ""}
                      </p>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="projects" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Supervised projects</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {publicProjects.length === 0 ? (
                  <p className="text-sm text-muted-foreground m-0">No supervised projects yet.</p>
                ) : (
                  publicProjects.map((project) => (
                    <div
                      key={project.id}
                      className="rounded-lg border border-border px-3 py-2.5"
                    >
                      <p className="font-medium text-sm m-0">{project.name}</p>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      ) : (
        <AboutSections profile={profile} />
      )}
    </div>
  );
}
