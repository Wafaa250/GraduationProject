import { useEffect, type ReactNode } from "react";
import { Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { CompatibilityRing } from "@/components/company/CompatibilityRing";
import type { RecommendationCandidate } from "@/types/companyRecommendation";

function initials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

type Props = {
  candidate: RecommendationCandidate | null;
  invitationSent: boolean;
  onClose: () => void;
  onInvite: () => void;
};

function ProfileSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-wide text-muted-foreground font-semibold mb-2">
        {title}
      </p>
      {children}
    </div>
  );
}

export function CompanyCandidateProfilePanel({
  candidate,
  invitationSent,
  onClose,
  onInvite,
}: Props) {
  useEffect(() => {
    if (!candidate) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [candidate, onClose]);

  if (!candidate) return null;

  const breakdown = [
    { label: "Skill fit", value: Math.min(98, candidate.matchScore) },
    { label: "Project interest fit", value: Math.max(75, candidate.matchScore - 6) },
    { label: "Experience fit", value: Math.max(70, candidate.matchScore - 10) },
    { label: "Collaboration fit", value: Math.max(72, candidate.matchScore - 4) },
  ];

  return (
    <div className="fixed inset-0 z-50 flex justify-end" role="dialog" aria-modal="true">
      <button
        type="button"
        className="absolute inset-0 bg-black/40"
        aria-label="Close profile"
        onClick={onClose}
      />
      <aside className="relative w-full max-w-md bg-card border-l shadow-xl flex flex-col max-h-full">
        <div className="flex items-start justify-between gap-3 p-5 border-b shrink-0">
          <div className="flex gap-3 min-w-0">
            <Avatar className="h-14 w-14 shrink-0">
              <AvatarFallback className="cw-candidate-avatar-fallback text-base font-medium">
                {initials(candidate.name)}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <h2 className="text-lg font-semibold tracking-tight">{candidate.name}</h2>
              <p className="text-sm text-muted-foreground">{candidate.major}</p>
              <p className="text-xs text-muted-foreground">
                {candidate.university} · {candidate.year}
              </p>
            </div>
          </div>
          <div className="flex items-start gap-2 shrink-0">
            <CompatibilityRing value={candidate.matchScore} size={56} />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="rounded-lg h-9 w-9"
              onClick={onClose}
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          <ProfileSection title="Bio">
            <p className="text-sm leading-relaxed text-muted-foreground">{candidate.bio}</p>
          </ProfileSection>

          <ProfileSection title="Availability">
            <Badge variant="outline" className="rounded-md font-normal">
              {candidate.availability}
            </Badge>
          </ProfileSection>

          <ProfileSection title="Compatibility breakdown">
            <div className="space-y-3">
              {breakdown.map((row) => (
                <div key={row.label}>
                  <div className="flex justify-between text-xs mb-1">
                    <span>{row.label}</span>
                    <span className="font-medium tabular-nums">{row.value}%</span>
                  </div>
                  <Progress value={row.value} className="h-1.5" />
                </div>
              ))}
            </div>
          </ProfileSection>

          <ProfileSection title="Skills">
            <div className="flex flex-wrap gap-1.5">
              {candidate.skills.map((skill) => (
                <Badge key={skill} className="cw-candidate-skill-badge rounded-md text-xs">
                  {skill}
                </Badge>
              ))}
            </div>
          </ProfileSection>

          <ProfileSection title="Tools">
            <div className="flex flex-wrap gap-1.5">
              {candidate.tools.map((tool) => (
                <Badge key={tool} variant="secondary" className="rounded-md text-xs font-normal">
                  {tool}
                </Badge>
              ))}
            </div>
          </ProfileSection>

          <ProfileSection title="Project interests">
            <div className="flex flex-wrap gap-1.5">
              {candidate.projectInterests.map((interest) => (
                <Badge key={interest} variant="outline" className="rounded-md text-xs font-normal">
                  {interest}
                </Badge>
              ))}
            </div>
          </ProfileSection>
        </div>

        <div className="p-5 border-t flex gap-2 shrink-0 bg-card">
          <Button type="button" variant="outline" className="rounded-xl flex-1" onClick={onClose}>
            Close
          </Button>
          <Button
            type="button"
            variant={invitationSent ? "outline" : "default"}
            className={
              invitationSent
                ? "rounded-xl flex-1 text-emerald-700 border-emerald-200 bg-emerald-50 dark:bg-emerald-950/30 dark:border-emerald-800 dark:text-emerald-300"
                : "rounded-xl cw-btn-gradient shadow-sm flex-1 border-0"
            }
            disabled={invitationSent}
            onClick={onInvite}
          >
            {invitationSent ? (
              <>
                <Check className="h-4 w-4 mr-1 shrink-0" aria-hidden />
                Invitation Sent
              </>
            ) : (
              "Invite"
            )}
          </Button>
        </div>
      </aside>
    </div>
  );
}
