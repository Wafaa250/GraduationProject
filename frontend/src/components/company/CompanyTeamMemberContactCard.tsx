import { Link } from "react-router-dom";
import { ExternalLink, Mail, Github, Globe, Linkedin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import type { CompanyRequestTeamRecommendationMember } from "@/api/companyApi";
import { COMPANY_ROUTES } from "@/routes/paths";
import { mapStudentDiscoveryContact } from "@/lib/studentDiscoveryContact";
import type { StudentDiscoveryContact } from "@/types/studentDiscoveryContact";

function initials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function normalizeUrl(url: string): string {
  const trimmed = url.trim();
  if (!trimmed) return trimmed;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

function ContactLine({
  icon: Icon,
  label,
  value,
  href,
}: {
  icon: typeof Mail;
  label: string;
  value: string;
  href: string;
}) {
  return (
    <div className="flex items-center justify-between gap-2 rounded-lg border border-border/50 bg-background/50 px-2.5 py-2">
      <div className="flex items-center gap-2 min-w-0">
        <Icon className="h-3.5 w-3.5 text-primary shrink-0" aria-hidden />
        <div className="min-w-0">
          <p className="text-[9px] uppercase tracking-wide text-muted-foreground font-medium">
            {label}
          </p>
          <p className="text-xs truncate">{value}</p>
        </div>
      </div>
      <Button asChild size="sm" variant="outline" className="rounded-md shrink-0 h-7 text-xs px-2">
        <a href={href} target="_blank" rel="noopener noreferrer">
          Open <ExternalLink className="h-3 w-3 ml-0.5" />
        </a>
      </Button>
    </div>
  );
}

function ContactFields({ contact }: { contact: StudentDiscoveryContact }) {
  const email = contact.email?.trim();
  const linkedin = contact.linkedin?.trim();
  const github = contact.github?.trim();
  const portfolio = contact.portfolio?.trim();

  if (!email && !linkedin && !github && !portfolio) {
    return (
      <p className="text-xs text-muted-foreground italic py-2">No contact links available.</p>
    );
  }

  return (
    <div className="space-y-2">
      {email && (
        <ContactLine icon={Mail} label="Email" value={email} href={`mailto:${email}`} />
      )}
      {linkedin && (
        <ContactLine
          icon={Linkedin}
          label="LinkedIn"
          value={linkedin.replace(/^https?:\/\//i, "")}
          href={normalizeUrl(linkedin)}
        />
      )}
      {github && (
        <ContactLine
          icon={Github}
          label="GitHub"
          value={github.replace(/^https?:\/\//i, "")}
          href={normalizeUrl(github)}
        />
      )}
      {portfolio && (
        <ContactLine
          icon={Globe}
          label="Portfolio"
          value={portfolio.replace(/^https?:\/\//i, "")}
          href={normalizeUrl(portfolio)}
        />
      )}
    </div>
  );
}

type Props = {
  member: CompanyRequestTeamRecommendationMember;
  requestId: number;
  teamId: number;
};

export function CompanyTeamMemberContactCard({ member, requestId, teamId }: Props) {
  const contact = mapStudentDiscoveryContact(member);

  return (
    <article className="cw-lux-panel h-full flex flex-col">
      <div className="p-4 flex flex-col h-full">
        <div className="flex items-center gap-3 mb-4">
          <Avatar className="h-11 w-11 shrink-0">
            <AvatarFallback className="cw-candidate-avatar-fallback text-sm font-medium">
              {initials(member.studentName)}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-sm truncate">{member.studentName}</p>
            <Badge
              variant="outline"
              className="mt-1 rounded-md text-[10px] font-normal border-primary/25 text-primary"
            >
              {member.roleName}
            </Badge>
          </div>
        </div>

        <ContactFields contact={contact} />

        <Button asChild size="sm" variant="ghost" className="rounded-lg mt-4 w-full text-xs h-8">
          <Link
            to={COMPANY_ROUTES.studentDiscoveryProfile(
              requestId,
              member.studentProfileId,
              teamId,
            )}
          >
            View full profile
          </Link>
        </Button>
      </div>
    </article>
  );
}
