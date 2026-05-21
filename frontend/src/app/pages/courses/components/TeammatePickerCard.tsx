import type { ReactNode } from "react";

import { MatchScoreBadge } from "../../../components/design-system";
import { SkillChip } from "../../../components/design-system/SkillChip";
import { Button } from "../../../components/ui/button";
import { cn } from "../../../components/ui/utils";

function avatarSrc(raw: string | null | undefined): string | null {
  const trimmed = raw?.trim();
  if (!trimmed) return null;
  return trimmed.startsWith("data:") ? trimmed : `data:image/*;base64,${trimmed}`;
}

export type TeammatePickerCardProps = {
  name: string;
  email?: string | null;
  avatar?: string | null;
  sectionName?: string | null;
  bio?: string | null;
  skills: string[];
  matchScore?: number;
  matchReason?: string | null;
  badge?: ReactNode;
  action: ReactNode;
  footer?: ReactNode;
};

export function TeammatePickerCard({
  name,
  email,
  avatar,
  sectionName,
  bio,
  skills,
  matchScore,
  matchReason,
  badge,
  action,
  footer,
}: TeammatePickerCardProps) {
  const src = avatarSrc(avatar);
  const initial = (name || "?").charAt(0).toUpperCase();

  return (
    <article className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-4 shadow-soft">
      <div className="flex items-start gap-3">
        {src ? (
          <img
            src={src}
            alt={name}
            className="h-10 w-10 shrink-0 rounded-full border border-border object-cover"
          />
        ) : (
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/15 text-sm font-bold text-primary">
            {initial}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <p className="truncate font-display text-sm font-bold text-foreground">{name}</p>
          <p className="truncate text-xs text-muted-foreground">{email || "No email"}</p>
        </div>
        {typeof matchScore === "number" ? (
          <MatchScoreBadge score={Math.min(100, Math.max(0, Math.round(matchScore)))} />
        ) : (
          badge
        )}
      </div>

      {sectionName ? (
        <span className="inline-flex w-fit rounded-full border border-primary/20 bg-primary/10 px-2.5 py-0.5 text-[11px] font-bold text-primary">
          {sectionName}
        </span>
      ) : null}

      {matchReason ? (
        <div className="rounded-lg border border-ai/20 bg-ai-soft/50 px-3 py-2">
          <p className="text-[10px] font-bold uppercase tracking-widest text-ai">Why this match</p>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{matchReason}</p>
        </div>
      ) : null}

      {bio ? <p className="text-xs leading-relaxed text-muted-foreground">{bio}</p> : null}

      <div className="flex flex-wrap gap-1.5">
        {skills.length === 0 ? (
          <span className="text-xs text-muted-foreground">No skills listed</span>
        ) : (
          skills.map((skill) => <SkillChip key={skill} label={skill} />)
        )}
      </div>

      <div className="flex justify-end">{action}</div>
      {footer ? <div>{footer}</div> : null}
    </article>
  );
}

export function InviteActionButton({
  label,
  disabled,
  loading,
  onClick,
  variant = "gradient",
}: {
  label: string;
  disabled?: boolean;
  loading?: boolean;
  onClick: () => void;
  variant?: "gradient" | "secondary";
}) {
  return (
    <Button
      type="button"
      variant={variant}
      size="sm"
      disabled={disabled || loading}
      onClick={onClick}
      className={cn(disabled && "opacity-70")}
    >
      {loading ? "Sending…" : label}
    </Button>
  );
}
