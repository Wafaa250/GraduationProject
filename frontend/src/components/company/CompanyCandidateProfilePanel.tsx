import { useEffect, type ReactNode } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { CompatibilityRing } from "@/components/company/CompatibilityRing";
import { CompanyStudentContactSection } from "@/components/company/CompanyStudentContactSection";
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
  onClose: () => void;
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

export function CompanyCandidateProfilePanel({ candidate, onClose }: Props) {
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
    { label: "Project relevance", value: Math.max(75, candidate.matchScore - 6) },
    { label: "Experience fit", value: Math.max(70, candidate.matchScore - 10) },
    { label: "Profile quality", value: Math.max(72, candidate.matchScore - 4) },
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
          <ProfileSection title="Why this match">
            <ul className="text-sm text-muted-foreground space-y-1.5 leading-relaxed">
              {candidate.insights.map((line) => (
                <li key={line}>• {line}</li>
              ))}
            </ul>
          </ProfileSection>

          <ProfileSection title="Contact">
            <CompanyStudentContactSection contact={candidate.contact} />
          </ProfileSection>

          <ProfileSection title="Bio">
            <p className="text-sm leading-relaxed text-muted-foreground">{candidate.bio}</p>
          </ProfileSection>

          <ProfileSection title="Match breakdown">
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

          {candidate.tools.length > 0 && (
            <ProfileSection title="Tools">
              <div className="flex flex-wrap gap-1.5">
                {candidate.tools.map((tool) => (
                  <Badge key={tool} variant="secondary" className="rounded-md text-xs font-normal">
                    {tool}
                  </Badge>
                ))}
              </div>
            </ProfileSection>
          )}

          {candidate.projectInterests.length > 0 && (
            <ProfileSection title="Project interests">
              <div className="flex flex-wrap gap-1.5">
                {candidate.projectInterests.map((interest) => (
                  <Badge key={interest} variant="outline" className="rounded-md text-xs font-normal">
                    {interest}
                  </Badge>
                ))}
              </div>
            </ProfileSection>
          )}
        </div>

        <div className="p-5 border-t shrink-0 bg-card">
          <Button type="button" variant="outline" className="rounded-xl w-full" onClick={onClose}>
            Close profile
          </Button>
        </div>
      </aside>
    </div>
  );
}
