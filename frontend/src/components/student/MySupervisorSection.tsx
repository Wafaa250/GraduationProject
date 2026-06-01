import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  BookOpen,
  Building2,
  Calendar,
  GraduationCap,
  Loader2,
  Mail,
  MessageCircle,
  User,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { PROFILE_AVATAR_FALLBACK_CLASS } from "@/lib/profileAvatar";
import { cn } from "@/components/ui/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { startConversation } from "@/api/conversationsApi";
import { getDoctorPublicProfile, type DoctorPublicProfile } from "@/api/doctorPublicApi";
import type { GradProjectSupervisor } from "@/api/gradProjectApi";
import { parseApiErrorMessage } from "@/api/axiosInstance";
import { toast } from "@/hooks/use-toast";
import { studentMessageThreadPath } from "@/routes/paths";

function initials(name: string): string {
  return name
    .split(/\s+/)
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function profilePhotoUrl(raw?: string | null): string | null {
  const value = raw?.trim();
  if (!value) return null;
  if (value.startsWith("data:")) return value;
  return `data:image/jpeg;base64,${value}`;
}

function formatAssignedDate(iso?: string | null): string | null {
  if (!iso) return null;
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return null;
  }
}

type MySupervisorSectionProps = {
  supervisor: GradProjectSupervisor;
};

export function MySupervisorSection({ supervisor }: MySupervisorSectionProps) {
  const navigate = useNavigate();
  const [messaging, setMessaging] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileDetails, setProfileDetails] = useState<DoctorPublicProfile | null>(null);

  const photo = profilePhotoUrl(supervisor.profilePicture);
  const assignedLabel = formatAssignedDate(supervisor.assignedAt);

  const handleMessage = async () => {
    if (!supervisor.userId) return;
    setMessaging(true);
    try {
      const conversationId = await startConversation(supervisor.userId);
      navigate(studentMessageThreadPath(conversationId), { state: { focusComposer: true } });
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Could not start conversation",
        description: parseApiErrorMessage(err),
      });
    } finally {
      setMessaging(false);
    }
  };

  const handleViewProfile = async () => {
    if (!supervisor.userId) return;
    setProfileOpen(true);
    setProfileLoading(true);
    try {
      setProfileDetails(await getDoctorPublicProfile(supervisor.userId));
    } catch (err) {
      setProfileDetails(null);
      toast({
        variant: "destructive",
        title: "Could not load profile",
        description: parseApiErrorMessage(err),
      });
    } finally {
      setProfileLoading(false);
    }
  };

  const detail = profileDetails?.doctorProfile;
  const detailUser = profileDetails?.user;

  return (
    <section>
      <div className="mb-4 flex items-center gap-2">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <GraduationCap className="h-4 w-4" aria-hidden />
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Supervision
          </p>
          <h2 className="font-display text-xl font-bold text-foreground">My Supervisor</h2>
        </div>
      </div>

      <Card className="overflow-hidden border-border/60 shadow-soft">
        <CardContent className="p-6 sm:p-8">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
            <Avatar className="h-20 w-20 shrink-0 ring-4 ring-primary/10">
              {photo ? <AvatarImage src={photo} alt="" /> : null}
              <AvatarFallback
                className={cn(PROFILE_AVATAR_FALLBACK_CLASS, "text-lg")}
              >
                {initials(supervisor.name || "?")}
              </AvatarFallback>
            </Avatar>

            <div className="min-w-0 flex-1 space-y-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="font-display text-2xl font-bold text-foreground">
                    {supervisor.name}
                  </h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {supervisor.specialization?.trim() || "Faculty supervisor"}
                  </p>
                </div>
                <Badge className="border-0 bg-success/10 text-success shrink-0">Active</Badge>
              </div>

              <dl className="grid gap-3 sm:grid-cols-2">
                {supervisor.faculty?.trim() ? (
                  <div className="flex gap-3 rounded-xl border border-border/60 bg-secondary/30 p-3">
                    <Building2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
                    <div>
                      <dt className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                        Faculty
                      </dt>
                      <dd className="text-sm font-medium text-foreground">{supervisor.faculty}</dd>
                    </div>
                  </div>
                ) : null}
                {supervisor.department?.trim() ? (
                  <div className="flex gap-3 rounded-xl border border-border/60 bg-secondary/30 p-3">
                    <BookOpen className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
                    <div>
                      <dt className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                        Department
                      </dt>
                      <dd className="text-sm font-medium text-foreground">{supervisor.department}</dd>
                    </div>
                  </div>
                ) : null}
                {supervisor.email?.trim() ? (
                  <div className="flex gap-3 rounded-xl border border-border/60 bg-secondary/30 p-3 sm:col-span-2">
                    <Mail className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
                    <div className="min-w-0">
                      <dt className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                        University email
                      </dt>
                      <dd className="truncate text-sm font-medium text-foreground">{supervisor.email}</dd>
                    </div>
                  </div>
                ) : null}
                {assignedLabel ? (
                  <div className="flex gap-3 rounded-xl border border-border/60 bg-secondary/30 p-3 sm:col-span-2">
                    <Calendar className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
                    <div>
                      <dt className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                        Assigned
                      </dt>
                      <dd className="text-sm font-medium text-foreground">{assignedLabel}</dd>
                    </div>
                  </div>
                ) : null}
              </dl>

              <div className="flex flex-wrap gap-2 pt-1">
                <Button
                  className="rounded-lg bg-gradient-hero text-primary-foreground hover:opacity-95"
                  disabled={messaging || !supervisor.userId}
                  onClick={() => void handleMessage()}
                >
                  {messaging ? (
                    <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                  ) : (
                    <MessageCircle className="mr-1.5 h-4 w-4" />
                  )}
                  Message Supervisor
                </Button>
                <Button
                  variant="outline"
                  className="rounded-lg"
                  disabled={!supervisor.userId}
                  onClick={() => void handleViewProfile()}
                >
                  <User className="mr-1.5 h-4 w-4" />
                  View Profile
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {profileOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="supervisor-profile-title"
        >
          <Card className="w-full max-w-lg border-border/60 shadow-elevated">
            <CardContent className="p-6">
              <h2
                id="supervisor-profile-title"
                className="font-display text-lg font-bold text-foreground"
              >
                {supervisor.name}
              </h2>
              {profileLoading ? (
                <div className="flex justify-center py-10">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : profileDetails ? (
                <div className="mt-4 space-y-3 text-sm">
                  {detailUser?.email ? (
                    <p>
                      <span className="font-semibold text-foreground">Email: </span>
                      {detailUser.email}
                    </p>
                  ) : null}
                  {detail?.faculty ? (
                    <p>
                      <span className="font-semibold text-foreground">Faculty: </span>
                      {detail.faculty}
                    </p>
                  ) : null}
                  {detail?.department ? (
                    <p>
                      <span className="font-semibold text-foreground">Department: </span>
                      {detail.department}
                    </p>
                  ) : null}
                  {detail?.specialization ? (
                    <p>
                      <span className="font-semibold text-foreground">Specialization: </span>
                      {detail.specialization}
                    </p>
                  ) : null}
                  {detail?.university ? (
                    <p>
                      <span className="font-semibold text-foreground">University: </span>
                      {detail.university}
                    </p>
                  ) : null}
                  {detail?.bio?.trim() ? (
                    <p className="leading-relaxed text-muted-foreground">{detail.bio.trim()}</p>
                  ) : null}
                </div>
              ) : (
                <p className="mt-4 text-sm text-muted-foreground">
                  Profile details are not available.
                </p>
              )}
              <div className="mt-6 flex justify-end">
                <Button type="button" variant="outline" className="rounded-xl" onClick={() => setProfileOpen(false)}>
                  Close
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : null}
    </section>
  );
}
