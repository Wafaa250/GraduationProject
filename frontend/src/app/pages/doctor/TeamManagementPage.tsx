import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { Loader2, MessageCircle, Plus, Trash2, Users } from "lucide-react";
import {
  addDoctorTeamMember,
  getDoctorCourseEnrolledStudents,
  getDoctorCourseProjects,
  getDoctorTeamByIndex,
  openCourseTeamConversation,
  removeDoctorTeamMember,
  type DoctorCourseEnrolledStudent,
  type DoctorProjectTeam,
} from "../../../api/doctorCoursesApi";
import { parseApiErrorMessage } from "../../../api/axiosInstance";
import { useToast } from "../../../context/ToastContext";
import { DoctorHubPageHeader } from "../../components/doctor/hub/DoctorHubPageHeader";
import { DoctorSubpageLayout } from "../../components/doctor/hub/DoctorSubpageLayout";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "../../components/ui/alert-dialog";
import { Avatar, AvatarFallback } from "../../components/ui/avatar";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../../components/ui/dialog";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";
type TeamManagementLocationState = {
  courseId?: number;
  projectName?: string;
};

export default function TeamManagementPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { projectId, teamId } = useParams<{ projectId: string; teamId: string }>();
  const { showToast } = useToast();

  const st = location.state as TeamManagementLocationState | null;
  const backendCourseId =
    typeof st?.courseId === "number" && st.courseId > 0 ? st.courseId : null;
  const backendProjectId =
    projectId && /^\d+$/.test(projectId) ? Number(projectId) : null;
  const teamIndex =
    teamId != null && /^\d+$/.test(teamId) ? Number(teamId) : null;

  const [team, setTeam] = useState<DoctorProjectTeam | null>(null);
  const [loading, setLoading] = useState(true);
  const [projectTitle, setProjectTitle] = useState(st?.projectName?.trim() ?? "Project");
  const [addOpen, setAddOpen] = useState(false);
  const [universityIdInput, setUniversityIdInput] = useState("");
  const [selectedUniversityId, setSelectedUniversityId] = useState("");
  const [enrolledStudents, setEnrolledStudents] = useState<DoctorCourseEnrolledStudent[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [removingStudentId, setRemovingStudentId] = useState<number | null>(null);
  const [openingChat, setOpeningChat] = useState(false);

  const teamsBackHref = useMemo(() => {
    if (backendCourseId != null && backendProjectId != null) {
      return `/courses/${backendCourseId}/projects/${backendProjectId}/teams`;
    }
    return "/doctor-dashboard?section=courses";
  }, [backendCourseId, backendProjectId]);

  const loadTeam = useCallback(async () => {
    if (backendCourseId == null || backendProjectId == null || teamIndex == null) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const [teamData, projects] = await Promise.all([
        getDoctorTeamByIndex(backendCourseId, backendProjectId, teamIndex),
        getDoctorCourseProjects(backendCourseId),
      ]);
      setTeam(teamData);
      const meta = projects.find((p) => p.id === backendProjectId);
      if (meta) {
        setProjectTitle(meta.title.trim() || projectTitle);
      }
    } catch (err) {
      showToast(parseApiErrorMessage(err), "error");
      setTeam(null);
    } finally {
      setLoading(false);
    }
  }, [backendCourseId, backendProjectId, teamIndex, showToast]);

  useEffect(() => {
    void loadTeam();
  }, [loadTeam]);

  useEffect(() => {
    if (backendCourseId == null || !addOpen) return;
    let cancelled = false;
    getDoctorCourseEnrolledStudents(backendCourseId)
      .then((list) => {
        if (!cancelled) setEnrolledStudents(list);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [backendCourseId, addOpen]);

  const handleAddMember = async () => {
    if (backendCourseId == null || backendProjectId == null || teamIndex == null) return;
    const typed = universityIdInput.trim();
    const picked = selectedUniversityId.trim();
    if (typed && picked) {
      showToast("Use either university ID or the dropdown, not both.", "error");
      return;
    }
    const universityId = typed || picked;
    if (!universityId) {
      showToast("Enter a university ID or select a student.", "error");
      return;
    }
    setSubmitting(true);
    try {
      const updated = await addDoctorTeamMember(
        backendCourseId,
        backendProjectId,
        teamIndex,
        universityId,
      );
      setTeam(updated);
      showToast("Member added.", "success");
      setUniversityIdInput("");
      setSelectedUniversityId("");
      setAddOpen(false);
    } catch (err) {
      showToast(parseApiErrorMessage(err), "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleRemoveMember = async (studentProfileId: number) => {
    if (backendCourseId == null || backendProjectId == null || teamIndex == null) return;
    setRemovingStudentId(studentProfileId);
    try {
      const updated = await removeDoctorTeamMember(
        backendCourseId,
        backendProjectId,
        teamIndex,
        studentProfileId,
      );
      setTeam(updated);
      showToast("Member removed.", "success");
    } catch (err) {
      showToast(parseApiErrorMessage(err), "error");
    } finally {
      setRemovingStudentId(null);
    }
  };

  const handleOpenChat = async () => {
    if (!team?.teamId) return;
    setOpeningChat(true);
    try {
      const { conversationId } = await openCourseTeamConversation(team.teamId);
      navigate("/messages", { state: { conversationId } });
    } catch (err) {
      showToast(parseApiErrorMessage(err), "error");
    } finally {
      setOpeningChat(false);
    }
  };

  const displayTeamNumber = teamIndex != null ? teamIndex + 1 : "—";

  if (backendCourseId == null || backendProjectId == null || teamIndex == null) {
    return (
      <DoctorSubpageLayout backTo="/doctor-dashboard?section=courses" backLabel="All courses">
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            Open team management from a course project&apos;s teams page so course context is available.
          </CardContent>
        </Card>
      </DoctorSubpageLayout>
    );
  }

  return (
    <DoctorSubpageLayout wide backTo={teamsBackHref} backLabel="Back to teams">
      <DoctorHubPageHeader
        eyebrow={projectTitle}
        title={`Team ${displayTeamNumber}`}
        description="Add or remove members and start a team conversation."
        actions={
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={!team?.teamId || openingChat}
            onClick={() => void handleOpenChat()}
            className="gap-2"
          >
            <MessageCircle className="h-4 w-4" />
            {openingChat ? "Opening…" : "Team conversation"}
          </Button>
        }
      />

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-4 space-y-0 pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="h-4 w-4" />
              Members
              <Badge variant="secondary" className="tabular-nums">
                {team?.memberCount ?? 0}
              </Badge>
            </CardTitle>
            <Button type="button" size="sm" onClick={() => setAddOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add member
            </Button>
          </CardHeader>
          <CardContent className="space-y-2">
            {!team || team.members.length === 0 ? (
              <p className="text-sm text-muted-foreground py-6 text-center m-0">
                No members in this team yet.
              </p>
            ) : (
              team.members.map((member) => (
                <div
                  key={member.studentId}
                  className="flex items-center gap-3 rounded-lg border border-border p-3"
                >
                  <Avatar className="h-9 w-9">
                    <AvatarFallback className="text-xs bg-primary/10 text-primary">
                      {member.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <Link
                      to={`/students/profile/${member.userId}`}
                      className="text-sm font-medium hover:underline"
                    >
                      {member.name}
                    </Link>
                    {member.universityId ? (
                      <p className="text-xs text-muted-foreground m-0 mt-0.5">
                        {member.universityId}
                      </p>
                    ) : null}
                    {member.skills.length > 0 ? (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {member.skills.slice(0, 4).map((sk) => (
                          <Badge key={sk} variant="outline" className="text-[10px] font-normal">
                            {sk}
                          </Badge>
                        ))}
                      </div>
                    ) : null}
                  </div>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        disabled={removingStudentId === member.studentId}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Remove {member.name}?</AlertDialogTitle>
                        <AlertDialogDescription>
                          They will be removed from this team.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => void handleRemoveMember(member.studentId)}
                        >
                          Remove
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      )}

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add member by university ID</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="uni-id">University ID</Label>
              <Input
                id="uni-id"
                value={universityIdInput}
                onChange={(e) => {
                  setUniversityIdInput(e.target.value);
                  if (e.target.value.trim()) setSelectedUniversityId("");
                }}
                placeholder="e.g. U20210001"
                disabled={Boolean(selectedUniversityId)}
              />
            </div>
            <p className="text-xs text-muted-foreground text-center m-0">or</p>
            <div className="space-y-2">
              <Label>Enrolled student</Label>
              <Select
                value={selectedUniversityId || "__none__"}
                onValueChange={(v) => {
                  const id = v === "__none__" ? "" : v;
                  setSelectedUniversityId(id);
                  if (id) setUniversityIdInput("");
                }}
                disabled={Boolean(universityIdInput.trim())}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select student" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">Select student</SelectItem>
                  {enrolledStudents
                    .filter((s) => s.universityId)
                    .map((s) => (
                      <SelectItem key={s.studentId} value={s.universityId}>
                        {s.name || s.universityId} ({s.universityId})
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setAddOpen(false)}>
              Cancel
            </Button>
            <Button type="button" onClick={() => void handleAddMember()} disabled={submitting}>
              {submitting ? "Adding…" : "Add"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DoctorSubpageLayout>
  );
}
