import type { ReactNode } from "react";
import { Users } from "lucide-react";

import { Badge } from "../../../../components/ui/badge";
import {
  COURSE_HUB_CHAT_PANEL_HEIGHT,
  CourseHubChatPanel,
  type CourseHubChatMessage,
} from "./CourseHubChatPanel";
import { CourseHubTeamMemberCard } from "./CourseHubTeamMemberCard";

type TeamMember = {
  studentId: number;
  userId: number;
  name: string;
  universityId: string;
  matchScore: number;
};

/** Single card: compact member list (left) + team chat (right). */
export function CourseHubTeamWorkspacePanel({
  members,
  currentUserId,
  messages,
  chatLoading,
  chatSending,
  onSend,
  chatPlaceholder,
  chatEmptyTitle,
  chatEmptyDescription,
  footer,
}: {
  members: TeamMember[];
  currentUserId: number | null;
  messages: CourseHubChatMessage[];
  chatLoading?: boolean;
  chatSending?: boolean;
  onSend: (text: string) => Promise<void>;
  chatPlaceholder?: string;
  chatEmptyTitle?: string;
  chatEmptyDescription?: string;
  footer?: ReactNode;
}) {
  return (
    <div
      className={`overflow-hidden rounded-2xl border border-border bg-card shadow-card ${COURSE_HUB_CHAT_PANEL_HEIGHT}`}
    >
      <div className="flex h-full flex-col sm:flex-row">
        <aside className="flex h-auto max-h-[40%] shrink-0 flex-col border-b border-border bg-gradient-soft/50 sm:h-full sm:max-h-none sm:w-48 sm:border-b-0 sm:border-r md:w-52">
          <div className="flex shrink-0 items-center justify-between gap-2 px-3 py-3 sm:px-3.5">
            <h2 className="font-display text-sm font-semibold tracking-tight text-foreground">
              Team members
            </h2>
            <Badge
              variant="outline"
              className="h-5 shrink-0 gap-1 border-border bg-background px-1.5 text-[10px] font-medium"
            >
              <Users className="h-2.5 w-2.5" />
              {members.length}
            </Badge>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto px-2 pb-2 sm:px-2.5 sm:pb-3">
            <div className="flex flex-col gap-0.5">
              {members.map((member) => (
                <CourseHubTeamMemberCard
                  key={member.studentId}
                  compact
                  name={member.name}
                  userId={member.userId}
                  universityId={member.universityId}
                  matchScore={member.matchScore}
                  isMe={currentUserId != null && currentUserId === member.userId}
                />
              ))}
            </div>
          </div>
          {footer ? (
            <div className="shrink-0 border-t border-border/80 px-3 py-3 sm:px-3.5">
              {footer}
            </div>
          ) : null}
        </aside>

        <div className="flex min-h-0 min-w-0 flex-1 flex-col">
          <CourseHubChatPanel
            meUserId={currentUserId}
            messages={messages}
            loading={chatLoading}
            sending={chatSending}
            onSend={onSend}
            placeholder={chatPlaceholder}
            emptyTitle={chatEmptyTitle}
            emptyDescription={chatEmptyDescription}
            embedded
            className="h-full"
          />
        </div>
      </div>
    </div>
  );
}
