import { Link } from "react-router-dom";
import ProfileLink from "../common/ProfileLink";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Card, CardContent } from "../ui/card";

export type StudentListItem = {
  userId: number;
  profileId: number;
  name: string;
  university: string;
  major: string;
  academicYear: string;
  skills: string[];
  matchScore: number;
  profilePicture: string | null;
  isMember: boolean;
  hasPendingInvite: boolean;
  canInvite: boolean;
  ownsGraduationProject: boolean;
};

type Props = {
  student: StudentListItem;
  profileHref: string;
  showMatchScore?: boolean;
  showAvailableBadge?: boolean;
  useProfileLinkForName?: boolean;
  onInvite?: () => void;
  isTeamFull?: boolean;
  isSending?: boolean;
};

export function StudentDirectoryCard({
  student,
  profileHref,
  showMatchScore = false,
  showAvailableBadge = false,
  useProfileLinkForName = false,
  onInvite,
  isTeamFull = false,
  isSending = false,
}: Props) {
  const initials = student.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const available =
    showAvailableBadge &&
    !student.isMember &&
    !student.hasPendingInvite &&
    student.canInvite &&
    !student.ownsGraduationProject;

  const nameEl = useProfileLinkForName ? (
    <ProfileLink userId={student.userId} role="student" className="font-medium hover:underline">
      {student.name}
    </ProfileLink>
  ) : (
    <span className="font-medium truncate text-foreground">{student.name}</span>
  );

  const cardInner = (
    <Card className="h-full hover:border-primary/40 transition-colors overflow-hidden">
      <CardContent className="p-4 flex gap-3">
        <Avatar className="h-12 w-12 shrink-0">
          {student.profilePicture ? (
            <AvatarImage src={student.profilePicture} alt="" />
          ) : null}
          <AvatarFallback className="bg-accent text-accent-foreground text-sm font-semibold">
            {initials}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            {nameEl}
            {available ? (
              <Badge
                variant="secondary"
                className="text-[10px] bg-emerald-500/10 text-emerald-700 border-emerald-200"
              >
                Available
              </Badge>
            ) : null}
            {showMatchScore && student.matchScore > 0 ? (
              <Badge variant="outline" className="text-[10px] tabular-nums">
                {student.matchScore}% match
              </Badge>
            ) : null}
          </div>
          <div className="text-xs text-muted-foreground mt-0.5 truncate">
            {student.major || "—"}
            {student.university ? ` · ${student.university}` : ""}
            {student.academicYear ? ` · ${student.academicYear}` : ""}
          </div>
          {student.skills.length > 0 ? (
            <div className="flex flex-wrap gap-1 mt-2">
              {student.skills.slice(0, 4).map((k) => (
                <Badge key={k} variant="outline" className="text-[10px] font-normal">
                  {k}
                </Badge>
              ))}
              {student.skills.length > 4 ? (
                <Badge variant="outline" className="text-[10px] text-muted-foreground">
                  +{student.skills.length - 4}
                </Badge>
              ) : null}
            </div>
          ) : null}
        </div>
      </CardContent>
      {onInvite ? (
        <div className="px-4 pb-4 flex flex-col sm:flex-row gap-2">
          <Button asChild variant="outline" size="sm" className="flex-1">
            <Link to={profileHref}>View profile</Link>
          </Button>
          <InviteButton
            student={student}
            onInvite={onInvite}
            isTeamFull={isTeamFull}
            isSending={isSending}
          />
        </div>
      ) : null}
    </Card>
  );

  if (onInvite) {
    return <div className="h-full">{cardInner}</div>;
  }

  return (
    <Link to={profileHref} className="block h-full no-underline text-inherit">
      {cardInner}
    </Link>
  );
}

function InviteButton({
  student,
  onInvite,
  isTeamFull,
  isSending,
}: {
  student: StudentListItem;
  onInvite: () => void;
  isTeamFull: boolean;
  isSending: boolean;
}) {
  if (isSending) {
    return (
      <Button size="sm" disabled className="flex-1">
        Sending…
      </Button>
    );
  }
  if (student.isMember) {
    return (
      <Button size="sm" disabled variant="secondary" className="flex-1">
        Member
      </Button>
    );
  }
  if (student.hasPendingInvite) {
    return (
      <Button size="sm" disabled variant="secondary" className="flex-1">
        Pending
      </Button>
    );
  }
  if (isTeamFull) {
    return (
      <Button size="sm" disabled variant="secondary" className="flex-1">
        Team full
      </Button>
    );
  }
  if (!student.canInvite) {
    return (
      <Button size="sm" disabled variant="secondary" className="flex-1">
        {student.ownsGraduationProject ? "Own project" : "Unavailable"}
      </Button>
    );
  }
  return (
    <Button size="sm" className="flex-1" onClick={onInvite}>
      Invite
    </Button>
  );
}
