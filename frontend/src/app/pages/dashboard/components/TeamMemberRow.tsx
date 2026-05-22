import type { GradProjectMember } from "../../../../api/gradProjectApi";
import { initialsFromName } from "../dashboardUtils";

type TeamMemberRowProps = {
  member: GradProjectMember;
  canManageTeam: boolean;
  isSelf: boolean;
  isRemoving: boolean;
  onRemove: () => void;
  isPromoting: boolean;
  onMakeLeader: () => void;
};

export function TeamMemberRow({
  member: m,
  canManageTeam,
  isSelf,
  isRemoving,
  onRemove,
}: TeamMemberRowProps) {
  const isLeader = m.role === "leader";
  const showActions = canManageTeam && !isLeader;
  const canRemove = showActions && !isSelf;
  const isBusy = isRemoving;
  const initials = initialsFromName(m.name);

  return (
    <div
      className={`flex items-center justify-between gap-3 rounded-xl px-3 py-2.5 border ${
        isLeader
          ? "border-primary/30 bg-primary-soft/60"
          : "border-border bg-muted/40"
      } ${isBusy ? "opacity-50" : ""}`}
    >
      <div className="flex items-center gap-2.5 min-w-0">
        <div
          className={`size-9 rounded-full overflow-hidden shrink-0 grid place-items-center text-xs font-bold ${
            isLeader ? "ring-2 ring-primary/40" : ""
          }`}
        >
          {m.profilePicture ? (
            <img src={m.profilePicture} alt={m.name} className="size-full object-cover" />
          ) : (
            <div
              className={`size-full grid place-items-center text-primary-foreground ${
                isLeader ? "bg-gradient-primary" : "bg-muted text-muted-foreground"
              }`}
            >
              {initials}
            </div>
          )}
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-semibold text-foreground truncate">{m.name}</span>
            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                isLeader
                  ? "bg-gradient-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {isLeader ? "Leader" : "Member"}
            </span>
            {isSelf ? (
              <span className="text-[10px] font-semibold text-primary">You</span>
            ) : null}
          </div>
          <span className="text-xs text-muted-foreground">{m.major || m.university || "—"}</span>
        </div>
      </div>

      {canRemove ? (
        <button
          type="button"
          onClick={onRemove}
          disabled={isBusy}
          className="text-muted-foreground hover:text-destructive p-1 disabled:opacity-50"
          aria-label="Remove member"
        >
          {isRemoving ? "…" : "✕"}
        </button>
      ) : null}
    </div>
  );
}
