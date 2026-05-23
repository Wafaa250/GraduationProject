import { Link } from "react-router-dom";
import { MessageCircle, Settings2, Users } from "lucide-react";
import type { DoctorProjectTeam } from "../../../api/doctorCoursesApi";
import { Avatar, AvatarFallback } from "../ui/avatar";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Card, CardContent } from "../ui/card";

type Props = {
  team: DoctorProjectTeam;
  aiMode: "doctor" | "student" | null;
  openingChatTeamId: number | null;
  onOpenChat: (teamId: number) => void;
  onManageTeam: (team: DoctorProjectTeam) => void;
};

export function ProjectTeamCard({
  team,
  aiMode,
  openingChatTeamId,
  onOpenChat,
  onManageTeam,
}: Props) {
  const displayIndex = team.teamIndex + 1;

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="font-semibold text-foreground">Team {displayIndex}</div>
            <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
              <Users className="h-3.5 w-3.5" />
              {team.memberCount} member{team.memberCount !== 1 ? "s" : ""}
            </div>
          </div>
          {aiMode === "student" ? (
            <Badge variant="secondary" className="text-[10px]">
              Manual team
            </Badge>
          ) : null}
        </div>

        <div className="flex -space-x-2">
          {team.members.slice(0, 5).map((m) => (
            <Avatar key={m.studentId} className="h-7 w-7 border-2 border-background">
              <AvatarFallback className="text-[10px] bg-primary/10 text-primary">
                {m.name.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
          ))}
        </div>

        <div className="space-y-2">
          {team.members.map((member) => (
            <div
              key={member.studentId}
              className="flex items-center gap-2 rounded-md border border-border px-2 py-1.5"
            >
              <Avatar className="h-8 w-8 shrink-0">
                <AvatarFallback className="text-xs">{member.name.charAt(0).toUpperCase()}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <Link
                  to={`/students/profile/${member.userId}`}
                  className="text-sm font-medium hover:underline truncate block"
                >
                  {member.name}
                </Link>
                {member.skills.length > 0 ? (
                  <div className="flex flex-wrap gap-1 mt-1">
                    {member.skills.slice(0, 3).map((sk) => (
                      <Badge key={sk} variant="outline" className="text-[10px] font-normal">
                        {sk}
                      </Badge>
                    ))}
                  </div>
                ) : null}
              </div>
              {aiMode !== "student" ? (
                <Badge variant="outline" className="tabular-nums text-[10px] shrink-0">
                  {member.matchScore.toFixed(0)}%
                </Badge>
              ) : null}
            </div>
          ))}
        </div>

        <div className="flex flex-wrap gap-2 pt-1">
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="gap-1.5"
            disabled={!team.teamId || openingChatTeamId === team.teamId}
            onClick={() => team.teamId && onOpenChat(team.teamId)}
          >
            <MessageCircle className="h-4 w-4" />
            {openingChatTeamId === team.teamId ? "Opening…" : "Team chat"}
          </Button>
          <Button type="button" size="sm" variant="secondary" className="gap-1.5" onClick={() => onManageTeam(team)}>
            <Settings2 className="h-4 w-4" />
            Manage team
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
