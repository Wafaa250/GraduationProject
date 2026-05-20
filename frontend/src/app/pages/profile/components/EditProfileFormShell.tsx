import type { RefObject, ReactNode } from "react";
import { Sparkles } from "lucide-react";

import { Progress } from "../../../components/ui/progress";
import { cn } from "../../../components/ui/utils";
import { ProfileCoverHero } from "./ProfileCoverHero";

const SECTIONS = [
  { id: "basic", label: "About" },
  { id: "work", label: "Work style" },
  { id: "skills", label: "Skills" },
  { id: "links", label: "Links" },
] as const;

export type EditProfileSectionId = (typeof SECTIONS)[number]["id"];

export type EditProfileFormShellProps = {
  activeSection: EditProfileSectionId;
  onSectionChange: (id: EditProfileSectionId) => void;
  fullName: string;
  major?: string;
  academicYear?: string;
  university?: string;
  availability?: string;
  profilePicPreview: string | null;
  initials: string;
  fileRef: RefObject<HTMLInputElement | null>;
  onPhotoClick: () => void;
  onPhotoChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  completeness: number;
  completenessHint: string;
  profileTasks?: { label: string; done: boolean }[];
  children: ReactNode;
  footer: ReactNode;
};

export function EditProfileFormShell({
  activeSection,
  onSectionChange,
  fullName,
  major,
  academicYear,
  university,
  availability,
  profilePicPreview,
  initials,
  fileRef,
  onPhotoClick,
  onPhotoChange,
  completeness,
  completenessHint,
  profileTasks = [],
  children,
  footer,
}: EditProfileFormShellProps) {
  const headline = [academicYear, major].filter(Boolean).join(" · ");
  return (
    <div className="space-y-6">
      <ProfileCoverHero
        className="mb-14 sm:mb-20"
        variant="editing"
        displayName={fullName}
        headline={headline || undefined}
        campusLabel={university || undefined}
        avatarUrl={profilePicPreview}
        initials={initials}
        onAvatarClick={onPhotoClick}
        showCameraOverlay
      />
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={onPhotoChange}
      />

      <div className="flex flex-wrap gap-2">
        {SECTIONS.map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => onSectionChange(s.id)}
            className={cn(
              "rounded-xl px-4 py-2 text-sm font-semibold transition-colors",
              activeSection === s.id
                ? "bg-primary text-primary-foreground shadow-glow"
                : "border border-border bg-card text-muted-foreground hover:bg-muted/60",
            )}
          >
            {s.label}
          </button>
        ))}
      </div>

      <div className="grid items-start gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <div className="rounded-2xl border border-border bg-card p-6 shadow-soft">{children}</div>
          {footer}
        </div>

        <aside className="space-y-4">
          <div  className="rounded-2xl border border-ai/20 bg-ai-soft/60 p-4">
            <div className="flex items-center gap-2 text-ai">
              <Sparkles className="h-4 w-4" />
              <p className="text-[10px] font-bold uppercase tracking-widest">AI readiness</p>
            </div>
            <p className="mt-2 font-display text-3xl font-bold gradient-text-ai">{completeness}%</p>
            <Progress
              value={completeness}
              className="mt-2 bg-ai/10 [&>[data-slot=progress-indicator]]:bg-gradient-ai"
            />
            <ul className="mt-4 space-y-1.5 text-xs text-muted-foreground">
              {profileTasks.length > 0 ? (
                profileTasks.map((task) => (
                  <li key={task.label} className={task.done ? "" : "text-foreground/80"}>
                    {task.done ? "✓" : "○"} {task.label}
                  </li>
                ))
              ) : (
                <li>{completenessHint}</li>
              )}
            </ul>
          </div>
        </aside>
      </div>
    </div>
  );
}
